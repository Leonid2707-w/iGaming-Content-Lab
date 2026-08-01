import { Hono } from 'hono'
import {
  createOrder,
  updateOrderFiles,
  updateOrderTelegramResult,
} from '../db/orders.js'
import { collectOrderLinks } from '../lib/links.js'
import { clientIp, rateLimit } from '../lib/rateLimit.js'
import { optionalUserAuth } from '../middleware/userAuth.js'
import { getServiceById } from './services.js'
import { MAX_ORDER_FILE_BYTES, uploadOrderFiles } from '../services/storage.js'
import { syncOrderToSheets } from '../services/googleSheets.js'
import { sendTelegramOrderNotification } from '../services/telegram.js'

function parseMeta(raw?: string) {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function formatPriceLabel(price: number | null, prefix?: string, unitLabel?: string) {
  if (price == null) return 'Индивидуально'
  const amount = `$${price.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
  const withPrefix = prefix ? `${prefix} ${amount}` : amount
  return unitLabel ? `${withPrefix} ${unitLabel}` : withPrefix
}

export const ordersPublicRoutes = new Hono()

ordersPublicRoutes.use('*', optionalUserAuth)

ordersPublicRoutes.post('/', async (c) => {
  try {
    const ip = clientIp({ get: (n) => c.req.header(n) })
    const limited = rateLimit({ key: `order:${ip}`, limit: 12, windowMs: 60 * 60 * 1000 })
    if (!limited.ok) {
      return c.json(
        { ok: false, error: `Слишком много заявок. Повторите через ${limited.retryAfterSec} с.` },
        429,
      )
    }

    const form = await c.req.formData()
    const user = c.get('user')

    // Honeypot — bots fill hidden fields
    if (String(form.get('companyWebsite') || form.get('website') || '').trim()) {
      return c.json({ ok: true, order: { id: 'ok', publicId: 'ok', telegramSent: false } })
    }

    if (!user) {
      return c.json(
        {
          ok: false,
          error: 'Чтобы оформить заказ, войдите или зарегистрируйтесь.',
          code: 'AUTH_REQUIRED',
        },
        401,
      )
    }

    const clientTelegram = String(form.get('clientTelegram') || '').trim()
    const serviceId = String(form.get('serviceId') || '').trim()
    const description = String(form.get('description') || '').trim()
    const referencesText = String(form.get('referencesText') || '')
    const quantityRaw = Number(form.get('quantity') || form.get('qty') || 0)

    if (!clientTelegram) {
      return c.json({ ok: false, error: 'Укажите Telegram username' }, 400)
    }
    if (!description) {
      return c.json({ ok: false, error: 'Опишите задачу' }, 400)
    }

    const catalogService = serviceId ? await getServiceById(serviceId) : null
    const clientTitle = String(form.get('serviceTitle') || '').trim()
    const serviceTitle =
      (catalogService?.title as string | undefined) || clientTitle || 'Индивидуальная заявка'

    let price: number | null = null
    let priceLabel: string | undefined

    if (catalogService && catalogService.priceMode === 'numeric' && typeof catalogService.price === 'number') {
      const unitPrice = Number(catalogService.price)
      const qty =
        Number.isFinite(quantityRaw) && quantityRaw > 0
          ? quantityRaw
          : Number(catalogService.minimum) || 1
      const prefix = typeof catalogService.pricePrefix === 'string' ? catalogService.pricePrefix : ''
      if (catalogService.unit === 'piece' || catalogService.unitId === 'per_piece') {
        price = Math.round(unitPrice * qty * 100) / 100
        priceLabel = formatPriceLabel(price, prefix, `за ${qty} шт.`)
      } else {
        price = unitPrice
        priceLabel = formatPriceLabel(
          price,
          prefix,
          String(catalogService.unitLabel || ''),
        )
      }
    } else if (catalogService?.priceMode === 'text') {
      price = null
      priceLabel = String(catalogService.priceText || 'Индивидуально')
    } else {
      // Fallback when catalog not in DB yet: accept client label, ignore client price number trust
      const clientPrice = Number(form.get('price') || '')
      price = Number.isFinite(clientPrice) ? clientPrice : null
      priceLabel = String(form.get('priceLabel') || '') || undefined
    }

    const incomingFiles: File[] = []
    for (const item of form.getAll('files')) {
      if (typeof item === 'string') continue
      const candidate = item as File
      if (typeof candidate.arrayBuffer === 'function' && Number(candidate.size) > 0) {
        incomingFiles.push(candidate)
      }
    }

    if (incomingFiles.length > 12) {
      return c.json({ ok: false, error: 'Можно прикрепить не более 12 файлов' }, 400)
    }
    for (const file of incomingFiles) {
      if (file.size > MAX_ORDER_FILE_BYTES) {
        return c.json({ ok: false, error: `Файл «${file.name}» больше 50 МБ` }, 400)
      }
    }

    const links = collectOrderLinks({
      linksJson: String(form.get('links') || ''),
      referencesText,
      description,
      linkDraft: String(form.get('linkDraft') || ''),
    })

    let order = await createOrder({
      userId: user.id,
      clientTelegram,
      serviceId: serviceId || undefined,
      serviceTitle,
      platform: String(form.get('platform') || '') || undefined,
      quantityLabel: String(form.get('quantityLabel') || '') || undefined,
      price,
      priceLabel,
      description,
      referencesText,
      links,
      meta: parseMeta(String(form.get('meta') || '')),
    })

    let fileWarning = ''
    if (incomingFiles.length) {
      try {
        const { files: uploaded, errors: fileErrors } = await uploadOrderFiles(
          order.public_id,
          incomingFiles,
        )
        if (uploaded.length) {
          order = await updateOrderFiles(order.id, uploaded)
        }
        if (fileErrors.length) {
          fileWarning = fileErrors.join('; ')
          console.warn('[orders.files]', fileErrors)
        }
      } catch (fileError) {
        fileWarning = fileError instanceof Error ? fileError.message : 'Ошибка загрузки файлов'
        console.warn('[orders.files]', fileError)
      }
    }

    const telegram = await sendTelegramOrderNotification(order)
    order = await updateOrderTelegramResult(order.id, {
      sent: telegram.ok,
      error: telegram.error,
    })
    if (!telegram.ok) {
      console.warn('[orders.telegram]', telegram.error)
    }

    void syncOrderToSheets(order)

    return c.json({
      ok: true,
      order: {
        id: order.id,
        publicId: order.public_id,
        telegramSent: telegram.ok,
        filesCount: order.files.length,
        linksCount: order.links.length,
      },
      warning: fileWarning || undefined,
    })
  } catch (error) {
    console.error('[orders.create]', error)
    const raw = error instanceof Error ? error.message : String(error)
    return c.json(
      {
        ok: false,
        error: raw || 'Не удалось отправить заявку',
      },
      500,
    )
  }
})
