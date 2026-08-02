import { Hono } from 'hono'
import {
  createOrder,
  getOrderById,
  updateOrderFiles,
  updateOrderTelegramResult,
} from '../db/orders.js'
import { collectOrderLinks } from '../lib/links.js'
import { clientIp, rateLimit } from '../lib/rateLimit.js'
import { optionalUserAuth } from '../middleware/userAuth.js'
import { getServiceById } from './services.js'
import {
  MAX_ORDER_FILE_BYTES,
  assertOrderFileMeta,
  buildOrderFilesFromPaths,
  createOrderUploadSlots,
  uploadOrderFiles,
} from '../services/storage.js'
import { syncOrderToSheets } from '../services/googleSheets.js'
import { sendTelegramOrderNotification } from '../services/telegram.js'
import { readJsonBody } from '../lib/jsonBody.js'

function parseMeta(raw?: string | Record<string, unknown> | null) {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
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

type OrderInput = {
  clientTelegram: string
  serviceId: string
  serviceTitle: string
  platform: string
  quantityLabel: string
  quantityRaw: number
  priceRaw: string
  priceLabel: string
  description: string
  referencesText: string
  linksJson: string
  linkDraft: string
  meta: Record<string, unknown>
  fileMeta: { name: string; mime: string; size: number }[]
  honeypot: string
}

async function resolvePricing(input: OrderInput) {
  const catalogService = input.serviceId ? await getServiceById(input.serviceId) : null
  const serviceTitle =
    (catalogService?.title as string | undefined) || input.serviceTitle || 'Индивидуальная заявка'

  let price: number | null = null
  let priceLabel: string | undefined

  if (catalogService && catalogService.priceMode === 'numeric' && typeof catalogService.price === 'number') {
    const unitPrice = Number(catalogService.price)
    const qty =
      Number.isFinite(input.quantityRaw) && input.quantityRaw > 0
        ? input.quantityRaw
        : Number(catalogService.minimum) || 1
    const prefix = typeof catalogService.pricePrefix === 'string' ? catalogService.pricePrefix : ''
    if (catalogService.unit === 'piece' || catalogService.unitId === 'per_piece') {
      price = Math.round(unitPrice * qty * 100) / 100
      priceLabel = formatPriceLabel(price, prefix, `за ${qty} шт.`)
    } else {
      price = unitPrice
      priceLabel = formatPriceLabel(price, prefix, String(catalogService.unitLabel || ''))
    }
  } else if (catalogService?.priceMode === 'text') {
    price = null
    priceLabel = String(catalogService.priceText || 'Индивидуально')
  } else {
    const clientPrice = Number(input.priceRaw || '')
    price = Number.isFinite(clientPrice) ? clientPrice : null
    priceLabel = input.priceLabel || undefined
  }

  return { serviceTitle, price, priceLabel }
}

async function notifyOrder(orderId: string) {
  let order = await getOrderById(orderId)
  if (!order) throw new Error('Заявка не найдена')
  const telegram = await sendTelegramOrderNotification(order)
  order = await updateOrderTelegramResult(order.id, {
    sent: telegram.ok,
    error: telegram.error,
  })
  if (!telegram.ok) console.warn('[orders.telegram]', telegram.error)
  void syncOrderToSheets(order)
  return { order, telegram }
}

export const ordersPublicRoutes = new Hono()

ordersPublicRoutes.use('*', optionalUserAuth)

/** Preferred path: JSON body (no files) + signed uploads — avoids Vercel HTTP 413. */
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

    const contentType = c.req.header('content-type') || ''
    const user = c.get('user')

    let input: OrderInput
    const legacyFiles: File[] = []

    if (contentType.includes('application/json')) {
      const body = await readJsonBody(c.req, {
        companyWebsite: '',
        website: '',
        clientTelegram: '',
        serviceId: '',
        serviceTitle: '',
        platform: '',
        quantityLabel: '',
        quantity: 0,
        price: '',
        priceLabel: '',
        description: '',
        referencesText: '',
        links: '[]',
        linkDraft: '',
        meta: {} as Record<string, unknown>,
        files: [] as { name?: string; mime?: string; size?: number }[],
      })

      input = {
        honeypot: String(body.companyWebsite || body.website || ''),
        clientTelegram: String(body.clientTelegram || '').trim(),
        serviceId: String(body.serviceId || '').trim(),
        serviceTitle: String(body.serviceTitle || '').trim(),
        platform: String(body.platform || ''),
        quantityLabel: String(body.quantityLabel || ''),
        quantityRaw: Number(body.quantity || 0),
        priceRaw: String(body.price ?? ''),
        priceLabel: String(body.priceLabel || ''),
        description: String(body.description || '').trim(),
        referencesText: String(body.referencesText || ''),
        linksJson: typeof body.links === 'string' ? body.links : JSON.stringify(body.links || []),
        linkDraft: String(body.linkDraft || ''),
        meta: parseMeta(body.meta),
        fileMeta: Array.isArray(body.files)
          ? body.files
              .map((item) => assertOrderFileMeta(item || {}))
              .filter((item): item is { name: string; mime: string; size: number } => typeof item !== 'string')
          : [],
      }

      // Collect validation errors for bad metas separately
      if (Array.isArray(body.files)) {
        const metaErrors = body.files
          .map((item) => assertOrderFileMeta(item || {}))
          .filter((item): item is string => typeof item === 'string')
        if (metaErrors.length && !input.fileMeta.length) {
          return c.json({ ok: false, error: metaErrors.join('; ') }, 400)
        }
      }
    } else {
      const form = await c.req.formData()
      input = {
        honeypot: String(form.get('companyWebsite') || form.get('website') || '').trim(),
        clientTelegram: String(form.get('clientTelegram') || '').trim(),
        serviceId: String(form.get('serviceId') || '').trim(),
        serviceTitle: String(form.get('serviceTitle') || '').trim(),
        platform: String(form.get('platform') || ''),
        quantityLabel: String(form.get('quantityLabel') || ''),
        quantityRaw: Number(form.get('quantity') || form.get('qty') || 0),
        priceRaw: String(form.get('price') || ''),
        priceLabel: String(form.get('priceLabel') || ''),
        description: String(form.get('description') || '').trim(),
        referencesText: String(form.get('referencesText') || ''),
        linksJson: String(form.get('links') || ''),
        linkDraft: String(form.get('linkDraft') || ''),
        meta: parseMeta(String(form.get('meta') || '')),
        fileMeta: [],
      }

      for (const item of form.getAll('files')) {
        if (typeof item === 'string') continue
        const candidate = item as File
        if (typeof candidate.arrayBuffer === 'function' && Number(candidate.size) > 0) {
          legacyFiles.push(candidate)
        }
      }
    }

    if (input.honeypot) {
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

    if (!input.clientTelegram) {
      return c.json({ ok: false, error: 'Укажите Telegram username' }, 400)
    }
    if (!input.description) {
      return c.json({ ok: false, error: 'Опишите задачу' }, 400)
    }

    if (legacyFiles.length > 12 || input.fileMeta.length > 12) {
      return c.json({ ok: false, error: 'Можно прикрепить не более 12 файлов' }, 400)
    }
    for (const file of legacyFiles) {
      if (file.size > MAX_ORDER_FILE_BYTES) {
        return c.json({ ok: false, error: `Файл «${file.name}» больше 50 МБ` }, 400)
      }
    }

    const { serviceTitle, price, priceLabel } = await resolvePricing(input)
    const links = collectOrderLinks({
      linksJson: input.linksJson,
      referencesText: input.referencesText,
      description: input.description,
      linkDraft: input.linkDraft,
    })

    let order = await createOrder({
      userId: user.id,
      clientTelegram: input.clientTelegram,
      serviceId: input.serviceId || undefined,
      serviceTitle,
      platform: input.platform || undefined,
      quantityLabel: input.quantityLabel || undefined,
      price,
      priceLabel,
      description: input.description,
      referencesText: input.referencesText,
      links,
      meta: input.meta,
    })

    // Preferred: return signed upload slots; client uploads directly to Supabase.
    if (input.fileMeta.length) {
      const { slots, errors } = await createOrderUploadSlots(order.public_id, input.fileMeta)
      if (slots.length) {
        return c.json({
          ok: true,
          needsFinalize: true,
          order: {
            id: order.id,
            publicId: order.public_id,
            telegramSent: false,
            filesCount: 0,
            linksCount: order.links.length,
          },
          uploadSlots: slots,
          warning: errors.length ? errors.join('; ') : undefined,
        })
      }
      // Slots failed — still keep the order and notify without files.
      console.warn('[orders.uploadSlots]', errors)
    }

    // Legacy multipart path (local / small files only — Vercel caps ~4.5 MB)
    let fileWarning = ''
    if (legacyFiles.length) {
      try {
        const { files: uploaded, errors: fileErrors } = await uploadOrderFiles(
          order.public_id,
          legacyFiles,
        )
        if (uploaded.length) order = await updateOrderFiles(order.id, uploaded)
        if (fileErrors.length) {
          fileWarning = fileErrors.join('; ')
          console.warn('[orders.files]', fileErrors)
        }
      } catch (fileError) {
        fileWarning = fileError instanceof Error ? fileError.message : 'Ошибка загрузки файлов'
        console.warn('[orders.files]', fileError)
      }
    }

    const { order: notified, telegram } = await notifyOrder(order.id)

    return c.json({
      ok: true,
      needsFinalize: false,
      order: {
        id: notified.id,
        publicId: notified.public_id,
        telegramSent: telegram.ok,
        filesCount: notified.files.length,
        linksCount: notified.links.length,
      },
      warning: fileWarning || undefined,
    })
  } catch (error) {
    console.error('[orders.create]', error)
    const raw = error instanceof Error ? error.message : String(error)
    return c.json({ ok: false, error: raw || 'Не удалось отправить заявку' }, 500)
  }
})

/** After browser uploads to signed URLs — attach files and notify Telegram/Sheets. */
ordersPublicRoutes.post('/:id/finalize', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ ok: false, error: 'Требуется авторизация', code: 'AUTH_REQUIRED' }, 401)
    }

    const order = await getOrderById(c.req.param('id'))
    if (!order) return c.json({ ok: false, error: 'Заявка не найдена' }, 404)
    if (order.user_id && order.user_id !== user.id) {
      return c.json({ ok: false, error: 'Нет доступа к заявке' }, 403)
    }

    const body = await readJsonBody(c.req, {
      files: [] as { name?: string; path?: string; mime?: string; size?: number }[],
    })

    const prefix = `${order.public_id}/`
    const accepted = (Array.isArray(body.files) ? body.files : [])
      .map((item) => ({
        name: String(item.name || 'file'),
        path: String(item.path || ''),
        mime: String(item.mime || 'application/octet-stream'),
        size: Number(item.size || 0),
      }))
      .filter((item) => item.path.startsWith(prefix) && item.size > 0)

    let updated = order
    if (accepted.length) {
      const files = await buildOrderFilesFromPaths(accepted)
      updated = await updateOrderFiles(order.id, files)
    }

    const { order: notified, telegram } = await notifyOrder(updated.id)

    return c.json({
      ok: true,
      order: {
        id: notified.id,
        publicId: notified.public_id,
        telegramSent: telegram.ok,
        filesCount: notified.files.length,
        linksCount: notified.links.length,
      },
    })
  } catch (error) {
    console.error('[orders.finalize]', error)
    return c.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Не удалось завершить загрузку файлов',
      },
      500,
    )
  }
})
