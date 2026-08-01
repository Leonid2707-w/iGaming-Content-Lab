import { Hono } from 'hono'
import { recordPageVisit } from '../db/visits.js'
import { readJsonBody } from '../lib/jsonBody.js'

const recentHits = new Map<string, number>()
const RATE_WINDOW_MS = 8_000

export const visitsPublicRoutes = new Hono()

visitsPublicRoutes.post('/', async (c) => {
  try {
    const body = await readJsonBody(c.req, {
      visitorId: '',
      path: '/',
      referrer: '',
    })

    const visitorId = String(body.visitorId || '').trim()
    const path = String(body.path || '/').trim()
    if (!visitorId || visitorId.length < 8) {
      return c.json({ ok: false, error: 'visitorId обязателен' }, 400)
    }

    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('cf-connecting-ip') ||
      'unknown'
    const rateKey = `${ip}:${visitorId}:${path}`
    const now = Date.now()
    const last = recentHits.get(rateKey) || 0
    if (now - last < RATE_WINDOW_MS) {
      return c.json({ ok: true, deduped: true })
    }
    recentHits.set(rateKey, now)
    if (recentHits.size > 5_000) {
      for (const [key, ts] of recentHits) {
        if (now - ts > RATE_WINDOW_MS * 4) recentHits.delete(key)
      }
    }

    await recordPageVisit({
      visitorId,
      path,
      referrer: body.referrer,
      userAgent: c.req.header('user-agent') || '',
    })

    return c.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось сохранить посещение'
    console.warn('[visits]', message)
    return c.json({ ok: false, error: message }, 500)
  }
})
