/** Client-side guards aligned with server/src/services/storage.ts */
export const MAX_ORDER_FILE_BYTES = 50 * 1024 * 1024

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

export function isAllowedOrderMime(mime: string) {
  if (!mime) return true
  if (ALLOWED_MIME_EXACT.has(mime)) return true
  return ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix))
}

export function validateOrderFiles(files: File[]): { ok: File[]; errors: string[] } {
  const ok: File[] = []
  const errors: string[] = []
  for (const file of files) {
    if (!isAllowedOrderMime(file.type)) {
      errors.push(`${file.name}: недопустимый тип файла`)
      continue
    }
    if (file.size > MAX_ORDER_FILE_BYTES) {
      errors.push(`${file.name}: слишком большой файл (макс. 50 МБ)`)
      continue
    }
    if (!file.size) {
      errors.push(`${file.name}: пустой файл`)
      continue
    }
    ok.push(file)
  }
  return { ok, errors }
}

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
