import { timingSafeEqual } from 'node:crypto'
import { Hono } from 'hono'
import { serverEnv } from '../config/env.js'
import { getBotHandler } from '../bot/index.js'
import type { TgUpdate } from '../bot/types.js'

function secretMatches(received: string | undefined, expected: string) {
  if (!received) return false
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export const telegramBotRoutes = new Hono()

telegramBotRoutes.post('/webhook', async (c) => {
  const secret = serverEnv.telegramWebhookSecret
  const handler = getBotHandler()
  if (!secret || !handler) {
    return c.json({ ok: false, error: 'Бот не настроен (TELEGRAM_BOT_TOKEN / TELEGRAM_WEBHOOK_SECRET)' }, 503)
  }
  if (!secretMatches(c.req.header('x-telegram-bot-api-secret-token'), secret)) {
    return c.json({ ok: false, error: 'Forbidden' }, 403)
  }

  let update: TgUpdate
  try {
    update = await c.req.json<TgUpdate>()
  } catch {
    return c.json({ ok: false, error: 'Invalid JSON' }, 400)
  }

  // Serverless functions are frozen after the response, so finish the work first.
  // The handler never throws: a non-200 would make Telegram redeliver the update.
  await handler(update)
  return c.json({ ok: true })
})
