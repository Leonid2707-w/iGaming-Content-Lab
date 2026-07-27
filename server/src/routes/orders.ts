import { Hono } from 'hono'
import {
  createOrder,
  updateOrderFiles,
  updateOrderTelegramResult,
} from '../db/orders.js'
import { collectOrderLinks } from '../lib/links.js'
import { optionalUserAuth } from '../middleware/userAuth.js'
import { uploadOrderFiles } from '../services/storage.js'
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

function parsePrice(raw?: string) {
  if (!raw || raw === '') return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

export const ordersPublicRoutes = new Hono()

ordersPublicRoutes.use('*', optionalUserAuth)

ordersPublicRoutes.post('/', async (c) => {
  try {
    const form = await c.req.formData()
    const user = c.get('user')

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
    const serviceTitle = String(form.get('serviceTitle') || '').trim()
    const description = String(form.get('description') || '').trim()
    const referencesText = String(form.get('referencesText') || '')

    if (!clientTelegram) {
      return c.json({ ok: false, error: 'Укажите Telegram username' }, 400)
    }
    if (!serviceTitle) {
      return c.json({ ok: false, error: 'Укажите услугу' }, 400)
    }
    if (!description) {
      return c.json({ ok: false, error: 'Опишите задачу' }, 400)
    }

    const incomingFiles = form.getAll('files').filter((item): item is File => {
      if (!item || typeof item !== 'object') return false
      const candidate = item as File
      return typeof candidate.arrayBuffer === 'function' && Number(candidate.size) > 0
    })

    if (incomingFiles.length > 12) {
      return c.json({ ok: false, error: 'Можно прикрепить не более 12 файлов' }, 400)
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
      serviceId: String(form.get('serviceId') || '') || undefined,
      serviceTitle,
      platform: String(form.get('platform') || '') || undefined,
      quantityLabel: String(form.get('quantityLabel') || '') || undefined,
      price: parsePrice(String(form.get('price') || '')),
      priceLabel: String(form.get('priceLabel') || '') || undefined,
      description,
      referencesText,
      links,
      meta: parseMeta(String(form.get('meta') || '')),
    })

    const warnings: string[] = []

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
          warnings.push(
            `Заявка сохранена, но часть файлов не загрузилась (${fileErrors.length}).`,
          )
          console.warn('[orders.files]', fileErrors)
        }
      } catch (fileError) {
        console.warn('[orders.files]', fileError)
        warnings.push('Заявка сохранена, но файлы временно не удалось загрузить.')
      }
    }

    const telegram = await sendTelegramOrderNotification(order)
    await updateOrderTelegramResult(order.id, {
      sent: telegram.ok,
      error: telegram.error,
    })
    if (!telegram.ok) {
      warnings.push('Заявка сохранена, но уведомление в Telegram временно недоступно')
    }

    return c.json({
      ok: true,
      order: {
        id: order.id,
        publicId: order.public_id,
        telegramSent: telegram.ok,
        filesCount: order.files.length,
        linksCount: order.links.length,
      },
      warning: warnings.length ? warnings.join(' ') : undefined,
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
