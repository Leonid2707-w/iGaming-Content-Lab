import { Hono } from 'hono'
import { getSupabase } from '../db/supabase.js'
import { clientIp, rateLimit } from '../lib/rateLimit.js'
import { readJsonBody } from '../lib/jsonBody.js'
import { sendTelegramMessage } from '../services/telegram.js'

export const partnersPublicRoutes = new Hono()

partnersPublicRoutes.post('/', async (c) => {
  try {
    const ip = clientIp({ get: (n) => c.req.header(n) })
    const limited = rateLimit({ key: `partner:${ip}`, limit: 5, windowMs: 60 * 60 * 1000 })
    if (!limited.ok) {
      return c.json(
        { ok: false, error: `Слишком много заявок. Повторите через ${limited.retryAfterSec} с.` },
        429,
      )
    }

    const body = await readJsonBody(c.req, {
      name: '',
      telegram: '',
      audience: '',
      comment: '',
      website: '',
    })

    // Honeypot
    if (String(body.website || '').trim()) {
      return c.json({ ok: true })
    }

    const name = String(body.name || '').trim()
    const telegram = String(body.telegram || '').trim()
    const audience = String(body.audience || '').trim()
    const comment = String(body.comment || '').trim()

    if (name.length < 2) return c.json({ ok: false, error: 'Укажите имя.' }, 400)
    if (!telegram) return c.json({ ok: false, error: 'Укажите Telegram.' }, 400)

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('partner_leads')
      .insert({
        name,
        telegram: telegram.startsWith('@') ? telegram : `@${telegram.replace(/^@/, '')}`,
        audience,
        comment,
      })
      .select('id')
      .single()

    if (error) {
      if (/relation .*partner_leads.* does not exist|schema cache/i.test(error.message)) {
        return c.json(
          {
            ok: false,
            error:
              'Таблица partner_leads не создана. Выполните supabase/migrations/005_site_services_partners.sql',
          },
          503,
        )
      }
      throw new Error(error.message)
    }

    const tgText = [
      '🤝 <b>Партнёрская заявка iCL</b>',
      `Имя: ${name}`,
      `Telegram: ${telegram}`,
      audience ? `Аудитория: ${audience}` : '',
      comment ? `Комментарий: ${comment}` : '',
      data?.id ? `ID: <code>${data.id}</code>` : '',
    ]
      .filter(Boolean)
      .join('\n')

    void sendTelegramMessage(tgText).catch((err) => console.warn('[partners.telegram]', err))

    return c.json({ ok: true })
  } catch (error) {
    console.error('[partners]', error)
    return c.json(
      { ok: false, error: error instanceof Error ? error.message : 'Не удалось отправить заявку' },
      500,
    )
  }
})
