import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { OrderFile } from '../types/order.js'

const uploadsRoot = join(fileURLToPath(new URL('../..', import.meta.url)), 'uploads')

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

export async function uploadOrderFiles(
  _orderPublicId: string,
  files: File[],
): Promise<{ files: OrderFile[]; errors: string[] }> {
  if (!files.length) return { files: [], errors: [] }

  const uploaded: OrderFile[] = []
  const errors: string[] = []

  for (const [index, file] of files.entries()) {
    const mime = file.type || 'application/octet-stream'
    const originalName = file.name || `file-${index + 1}`

    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      if (!buffer.length) {
        errors.push(`${originalName}: пустой файл`)
        continue
      }
      // Local disk — надёжно при нестабильном Supabase Storage
      uploaded.push(await saveLocally(buffer, originalName, mime))
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

export async function refreshSignedUrls(files: OrderFile[]): Promise<OrderFile[]> {
  return files.map((file) => {
    if (/^[0-9a-f-]{36}\//i.test(file.path)) {
      const [fileId, ...rest] = file.path.split('/')
      return {
        ...file,
        url: publicFileUrl(fileId, rest.join('/')),
      }
    }
    if (file.url.startsWith('/api/files/')) return file
    return file
  })
}
