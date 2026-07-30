import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSupabase } from '../db/supabase.js'
import type { OrderFile } from '../types/order.js'

const uploadsRoot = join(fileURLToPath(new URL('../..', import.meta.url)), 'uploads')
const BUCKET = 'order-files'
/** Vercel request body limit ~4.5MB — keep headroom for multipart fields */
const VERCEL_MAX_FILE_BYTES = 4 * 1024 * 1024

function useLocalUploads() {
  if (process.env.USE_LOCAL_UPLOADS === '1') return true
  if (process.env.USE_LOCAL_UPLOADS === '0') return false
  return process.env.VERCEL !== '1'
}

function maxFileBytes() {
  return process.env.VERCEL === '1' ? VERCEL_MAX_FILE_BYTES : 100 * 1024 * 1024
}

function safeName(name: string) {
  return name.replace(/[^\w.\-()\sа-яА-ЯёЁ]/gi, '_').slice(0, 120) || 'file'
}

function publicFileUrl(fileId: string, filename: string) {
  return `/api/files/${fileId}/${encodeURIComponent(filename)}`
}

async function saveLocally(
  buffer: Buffer,
  originalName: string,
  mime: string,
): Promise<OrderFile> {
  const fileId = randomUUID()
  const filename = safeName(originalName)
  const diskPath = join(uploadsRoot, fileId, filename)
  await mkdir(dirname(diskPath), { recursive: true })
  await writeFile(diskPath, buffer)

  return {
    name: originalName,
    path: `${fileId}/${filename}`,
    url: publicFileUrl(fileId, filename),
    mime,
    size: buffer.length,
  }
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
    .createSignedUrl(path, 60 * 60 * 24 * 7)

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
  const limit = maxFileBytes()
  const local = useLocalUploads()

  for (const [index, file] of files.entries()) {
    const mime = file.type || 'application/octet-stream'
    const originalName = file.name || `file-${index + 1}`

    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      if (!buffer.length) {
        errors.push(`${originalName}: пустой файл`)
        continue
      }
      if (buffer.length > limit) {
        errors.push(
          `${originalName}: слишком большой файл (макс. ${Math.floor(limit / (1024 * 1024))} МБ на хостинге)`,
        )
        continue
      }

      uploaded.push(
        local
          ? await saveLocally(buffer, originalName, mime)
          : await saveToSupabase(orderPublicId, buffer, originalName, mime),
      )
    } catch (error) {
      errors.push(
        `${originalName}: ${error instanceof Error ? error.message : 'upload failed'}`,
      )
    }
  }

  return { files: uploaded, errors }
}

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
        url: publicFileUrl(fileId, rest.join('/')),
      })
      continue
    }

    if (file.path.includes('/')) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(file.path, 60 * 60 * 24 * 7)
      if (!error && data?.signedUrl) {
        result.push({ ...file, url: data.signedUrl })
        continue
      }
    }

    if (file.url.startsWith('/api/files/')) {
      result.push(file)
      continue
    }

    result.push(file)
  }

  return result
}
