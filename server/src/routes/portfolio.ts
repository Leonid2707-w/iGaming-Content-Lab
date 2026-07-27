import { Hono } from 'hono'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { requireAdmin } from '../middleware/adminAuth.js'

const MAX_BYTES = 50 * 1024 * 1024
const portfolioRoot = fileURLToPath(
  new URL('../../../public/videos/uploads', import.meta.url),
)

export const portfolioAdminRoutes = new Hono()

portfolioAdminRoutes.use('/*', requireAdmin)

portfolioAdminRoutes.post('/upload', async (c) => {
  try {
    const body = await c.req.parseBody({ all: true })
    const file = body.file
    if (!file || typeof file === 'string') {
      return c.json({ ok: false, error: 'Файл не передан' }, 400)
    }

    const mime = file.type || 'application/octet-stream'
    if (!mime.startsWith('video/')) {
      return c.json({ ok: false, error: 'Нужен видеофайл' }, 400)
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (!buffer.length) {
      return c.json({ ok: false, error: 'Пустой файл' }, 400)
    }
    if (buffer.length > MAX_BYTES) {
      return c.json({ ok: false, error: 'Максимальный размер видео — 50 MB' }, 400)
    }

    const ext = mime.includes('webm') ? 'webm' : 'mp4'
    const fileId = randomUUID()
    const filename = `${fileId}.${ext}`
    await mkdir(portfolioRoot, { recursive: true })
    await writeFile(join(portfolioRoot, filename), buffer)

    return c.json({
      ok: true,
      file: {
        name: file.name || filename,
        src: `/videos/uploads/${filename}`,
        mime,
        size: buffer.length,
      },
    })
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Ошибка загрузки видео',
      },
      500,
    )
  }
})
