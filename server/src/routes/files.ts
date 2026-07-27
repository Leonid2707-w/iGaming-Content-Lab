import { createReadStream } from 'node:fs'
import { access } from 'node:fs/promises'
import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { resolveLocalUploadPath } from '../services/storage.js'

export const filesPublicRoutes = new Hono()

filesPublicRoutes.get('/:fileId/:filename', async (c) => {
  const fileId = c.req.param('fileId')
  const filename = decodeURIComponent(c.req.param('filename'))
  const diskPath = resolveLocalUploadPath(fileId, filename)

  try {
    await access(diskPath)
  } catch {
    return c.json({ ok: false, error: 'Файл не найден' }, 404)
  }

  const lower = filename.toLowerCase()
  const type =
    lower.endsWith('.png')
      ? 'image/png'
      : lower.endsWith('.jpg') || lower.endsWith('.jpeg')
        ? 'image/jpeg'
        : lower.endsWith('.webp')
          ? 'image/webp'
          : lower.endsWith('.gif')
            ? 'image/gif'
            : lower.endsWith('.mp4')
              ? 'video/mp4'
              : lower.endsWith('.webm')
                ? 'video/webm'
                : lower.endsWith('.mp3')
                  ? 'audio/mpeg'
                  : 'application/octet-stream'

  c.header('Content-Type', type)
  c.header('Cache-Control', 'private, max-age=3600')
  c.header('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(filename)}`)

  return stream(c, async (streamWriter) => {
    const nodeStream = createReadStream(diskPath)
    for await (const chunk of nodeStream) {
      await streamWriter.write(chunk)
    }
  })
})
