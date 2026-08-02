import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSupabase } from '../db/supabase.js'
import type { OrderFile } from '../types/order.js'

const BUCKET = 'order-files'
const uploadsRoot = join(fileURLToPath(new URL('../..', import.meta.url)), 'uploads')
/** Plan: support videos up to 50 MB (Vercel body limit may still cap ~4.5 MB on serverless). */
export const MAX_ORDER_FILE_BYTES = 50 * 1024 * 1024
const SIGNED_TTL_SEC = 60 * 60 // 1 hour

function safeName(name: string) {
  return name.replace(/[^\w.\-()\sа-яА-ЯёЁ]/gi, '_').slice(0, 120) || 'file'
}

const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/', 'application/pdf']
const ALLOWED_MIME_EXACT = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
])

function isAllowedMime(mime: string) {
  if (!mime) return true
  if (ALLOWED_MIME_EXACT.has(mime)) return true
  return ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix))
}

export type OrderUploadSlot = {
  name: string
  path: string
  mime: string
  size: number
  signedUrl: string
  token: string
}

export function assertOrderFileMeta(input: {
  name?: string
  mime?: string
  size?: number
}): { name: string; mime: string; size: number } | string {
  const name = String(input.name || '').trim() || 'file'
  const mime = String(input.mime || 'application/octet-stream')
  const size = Number(input.size || 0)
  if (!isAllowedMime(mime)) return `${name}: недопустимый тип файла`
  if (!Number.isFinite(size) || size <= 0) return `${name}: пустой файл`
  if (size > MAX_ORDER_FILE_BYTES) return `${name}: слишком большой файл (макс. 50 МБ)`
  return { name, mime, size }
}

/** Signed PUT URLs so the browser uploads straight to Supabase (bypasses Vercel 4.5 MB body limit). */
export async function createOrderUploadSlots(
  orderPublicId: string,
  files: { name: string; mime: string; size: number }[],
): Promise<{ slots: OrderUploadSlot[]; errors: string[] }> {
  const supabase = getSupabase()
  const slots: OrderUploadSlot[] = []
  const errors: string[] = []

  for (const file of files) {
    const checked = assertOrderFileMeta(file)
    if (typeof checked === 'string') {
      errors.push(checked)
      continue
    }
    const fileId = randomUUID()
    const path = `${orderPublicId}/${fileId}-${safeName(checked.name)}`
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path)
    if (error || !data?.signedUrl || !data.token) {
      errors.push(`${checked.name}: ${error?.message || 'не удалось создать ссылку загрузки'}`)
      continue
    }
    slots.push({
      name: checked.name,
      path: data.path || path,
      mime: checked.mime,
      size: checked.size,
      signedUrl: data.signedUrl,
      token: data.token,
    })
  }

  return { slots, errors }
}

export async function buildOrderFilesFromPaths(
  files: { name: string; path: string; mime: string; size: number }[],
): Promise<OrderFile[]> {
  const supabase = getSupabase()
  const result: OrderFile[] = []
  for (const file of files) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.path, SIGNED_TTL_SEC)
    result.push({
      name: file.name,
      path: file.path,
      url: !error && data?.signedUrl ? data.signedUrl : '',
      mime: file.mime,
      size: file.size,
    })
  }
  return result
}

async function saveToSupabase(
  orderPublicId: string,
  buffer: Buffer,
  originalName: string,
  mime: string,
): Promise<OrderFile> {
  const supabase = getSupabase()
  const fileId = randomUUID()
  const filename = safeName(originalName)
  const path = `${orderPublicId}/${fileId}-${filename}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: false,
  })
  if (error) throw new Error(error.message)

  const { data, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_TTL_SEC)

  if (signError || !data?.signedUrl) {
    throw new Error(signError?.message || 'Не удалось создать ссылку на файл')
  }

  return {
    name: originalName,
    path,
    url: data.signedUrl,
    mime,
    size: buffer.length,
  }
}

export async function uploadOrderFiles(
  orderPublicId: string,
  files: File[],
): Promise<{ files: OrderFile[]; errors: string[] }> {
  if (!files.length) return { files: [], errors: [] }

  const uploaded: OrderFile[] = []
  const errors: string[] = []

  for (const [index, file] of files.entries()) {
    const mime = file.type || 'application/octet-stream'
    const originalName = file.name || `file-${index + 1}`

    try {
      if (!isAllowedMime(mime)) {
        errors.push(`${originalName}: недопустимый тип файла`)
        continue
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      if (!buffer.length) {
        errors.push(`${originalName}: пустой файл`)
        continue
      }
      if (buffer.length > MAX_ORDER_FILE_BYTES) {
        errors.push(`${originalName}: слишком большой файл (макс. 50 МБ)`)
        continue
      }

      uploaded.push(await saveToSupabase(orderPublicId, buffer, originalName, mime))
    } catch (error) {
      errors.push(
        `${originalName}: ${error instanceof Error ? error.message : 'upload failed'}`,
      )
    }
  }

  return { files: uploaded, errors }
}

/** Legacy local-disk helper for older orders still on disk. */
export function resolveLocalUploadPath(fileId: string, filename: string) {
  const safeId = fileId.replace(/[^a-zA-Z0-9-]/g, '')
  const safeFile = safeName(filename)
  return join(uploadsRoot, safeId, safeFile)
}

export function isLocalUploadPath(path: string) {
  return /^[0-9a-f-]{36}\//i.test(path)
}

export async function refreshSignedUrls(files: OrderFile[]): Promise<OrderFile[]> {
  const supabase = getSupabase()
  const result: OrderFile[] = []

  for (const file of files) {
    if (isLocalUploadPath(file.path)) {
      const [fileId, ...rest] = file.path.split('/')
      result.push({
        ...file,
        url: `/api/files/${fileId}/${encodeURIComponent(rest.join('/'))}`,
      })
      continue
    }

    if (file.path.includes('/')) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(file.path, SIGNED_TTL_SEC)
      if (!error && data?.signedUrl) {
        result.push({ ...file, url: data.signedUrl })
        continue
      }
    }

    result.push(file)
  }

  return result
}
