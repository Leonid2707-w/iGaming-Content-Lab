import { serverEnv } from '../config/env.js'
import { ORDER_STATUS_LABELS, type OrderRecord } from '../types/order.js'

export type SheetsSyncAction = 'upsert' | 'delete' | 'sync_all'

export interface SheetsOrderPayload {
  id: string
  publicId: string
  createdAt: string
  updatedAt: string
  clientTelegram: string
  serviceTitle: string
  platform: string
  quantityLabel: string
  price: number | null
  priceLabel: string
  status: string
  statusLabel: string
  description: string
  referencesText: string
  links: string[]
  filesCount: number
  telegramSent: boolean
  telegramError: string | null
  userId: string
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function toSheetsOrderPayload(order: OrderRecord): SheetsOrderPayload {
  return {
    id: order.id,
    publicId: order.public_id,
    createdAt: formatDate(order.created_at),
    updatedAt: formatDate(order.updated_at),
    clientTelegram: order.client_telegram,
    serviceTitle: order.service_title,
    platform: order.platform || '',
    quantityLabel: order.quantity_label || '',
    price: order.price,
    priceLabel: order.price_label || '',
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
    description: order.description,
    referencesText: order.references_text || '',
    links: order.links || [],
    filesCount: order.files?.length || 0,
    telegramSent: order.telegram_sent,
    telegramError: order.telegram_error,
    userId: order.user_id || '',
  }
}

function sheetsConfigured() {
  return Boolean(serverEnv.googleSheetsWebhookUrl && serverEnv.googleSheetsWebhookSecret)
}

async function postToSheets(body: Record<string, unknown>) {
  if (!sheetsConfigured()) {
    return { ok: false as const, skipped: true as const, error: 'Google Sheets sync not configured' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(serverEnv.googleSheetsWebhookUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: serverEnv.googleSheetsWebhookSecret,
        ...body,
      }),
      signal: controller.signal,
      redirect: 'follow',
    })

    const text = await response.text()
    let data: { ok?: boolean; error?: string } = {}
    try {
      data = JSON.parse(text) as { ok?: boolean; error?: string }
    } catch {
      data = { ok: response.ok, error: text.slice(0, 200) }
    }

    if (!response.ok || data.ok === false) {
      return {
        ok: false as const,
        skipped: false as const,
        error: data.error || `Sheets HTTP ${response.status}`,
      }
    }

    return { ok: true as const, skipped: false as const }
  } catch (error) {
    return {
      ok: false as const,
      skipped: false as const,
      error: error instanceof Error ? error.message : 'Sheets network error',
    }
  } finally {
    clearTimeout(timeout)
  }
}

/** Fire-and-forget friendly: never throws to caller paths. */
export async function syncOrderToSheets(order: OrderRecord) {
  const result = await postToSheets({
    action: 'upsert' satisfies SheetsSyncAction,
    order: toSheetsOrderPayload(order),
  })
  if (!result.ok && !result.skipped) {
    console.warn('[sheets.sync]', order.public_id, result.error)
  }
  return result
}

export async function deleteOrderFromSheets(publicId: string) {
  const result = await postToSheets({
    action: 'delete' satisfies SheetsSyncAction,
    publicId,
  })
  if (!result.ok && !result.skipped) {
    console.warn('[sheets.delete]', publicId, result.error)
  }
  return result
}

export async function syncAllOrdersToSheets(orders: OrderRecord[]) {
  const result = await postToSheets({
    action: 'sync_all' satisfies SheetsSyncAction,
    orders: orders.map(toSheetsOrderPayload),
  })
  if (!result.ok && !result.skipped) {
    console.warn('[sheets.sync_all]', result.error)
  }
  return result
}
