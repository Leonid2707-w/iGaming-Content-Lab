import { Hono } from 'hono'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSupabase } from '../db/supabase.js'
import { requireAdmin } from '../middleware/adminAuth.js'

const MAX_BYTES_LOCAL = 50 * 1024 * 1024
const MAX_BYTES_VERCEL = 4 * 1024 * 1024
const portfolioRoot = fileURLToPath(
  new URL('../../../public/videos/uploads', import.meta.url),
)

function useLocalUploads() {
  if (process.env.USE_LOCAL_UPLOADS === '1') return true
  if (process.env.USE_LOCAL_UPLOADS === '0') return false
  return process.env.VERCEL !== '1'
}

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

    const maxBytes = useLocalUploads() ? MAX_BYTES_LOCAL : MAX_BYTES_VERCEL
    if (buffer.length > maxBytes) {
      return c.json(
        {
          ok: false,
          error: useLocalUploads()
            ? 'Максимальный размер видео — 50 MB'
            : 'На Vercel лимит ~4 МБ на запрос. Загрузите короткое превью или положите файл в Supabase Storage (bucket portfolio).',
        },
        400,
      )
    }

    const ext = mime.includes('webm') ? 'webm' : 'mp4'
    const fileId = randomUUID()
    const filename = `${fileId}.${ext}`

    if (useLocalUploads()) {
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
    }

    const supabase = getSupabase()
    const path = `portfolio/${filename}`
    const { error } = await supabase.storage.from('order-files').upload(path, buffer, {
      contentType: mime,
      upsert: false,
    })
    if (error) throw new Error(error.message)

    const { data, error: signError } = await supabase.storage
      .from('order-files')
      .createSignedUrl(path, 60 * 60 * 24 * 365)

    if (signError || !data?.signedUrl) {
      throw new Error(signError?.message || 'Не удалось создать ссылку на видео')
    }

    return c.json({
      ok: true,
      file: {
        name: file.name || filename,
        src: data.signedUrl,
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
