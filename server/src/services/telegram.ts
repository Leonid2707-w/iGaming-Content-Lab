import { serverEnv } from '../config/env.js'
import type { OrderRecord } from '../types/order.js'
import { ORDER_STATUS_LABELS } from '../types/order.js'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function formatMoney(value: number | null): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatOrderTelegramMessage(order: OrderRecord): string {
  const date = new Date(order.created_at).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const links =
    order.links.length > 0
      ? order.links.map((l) => `• ${escapeHtml(l)}`).join('\n')
      : '—'

  const refs = order.references_text?.trim()
    ? escapeHtml(order.references_text.trim())
    : '—'
  const desc = order.description?.trim()
    ? escapeHtml(order.description.trim())
    : '—'
  const platform = order.platform?.trim()
    ? escapeHtml(order.platform.trim())
    : '—'
  const quantity = order.quantity_label?.trim()
    ? escapeHtml(order.quantity_label.trim())
    : '—'
  const cost = order.price_label?.trim() || formatMoney(order.price)

  const filesNote =
    order.files.length > 0
      ? `\n📎 Файлы: <b>${order.files.length}</b> (в админ-панели)`
      : ''

  return [
    `🆕 <b>Новая заявка iCL</b>`,
    '',
    `<b>Дата:</b> ${escapeHtml(date)}`,
    `<b>Услуга:</b> ${escapeHtml(order.service_title)}`,
    `<b>Платформа:</b> ${platform}`,
    `<b>Количество:</b> ${quantity}`,
    `<b>Стоимость:</b> ${escapeHtml(cost)}`,
    `<b>Telegram клиента:</b> ${escapeHtml(order.client_telegram)}`,
    `<b>Описание:</b>\n${desc}`,
    `<b>Референсы:</b>\n${refs}`,
    `<b>Ссылки:</b>\n${links}`,
    `<b>Статус:</b> ${ORDER_STATUS_LABELS[order.status]}`,
    `<b>ID заявки:</b> <code>${escapeHtml(order.public_id)}</code>`,
    filesNote,
  ].join('\n')
}

export type TelegramSendResult =
  | { ok: true }
  | { ok: false; error: string }

export async function sendTelegramMessage(
  text: string,
): Promise<TelegramSendResult> {
  const token = serverEnv.telegramBotToken
  const adminId = serverEnv.telegramAdminId

  if (!token || !adminId) {
    return {
      ok: false,
      error: 'Telegram не настроен (TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_ID)',
    }
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    const data = (await res.json()) as { ok?: boolean; description?: string }
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        error: data.description ?? `Telegram HTTP ${res.status}`,
      }
    }
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Telegram network error',
    }
  }
}

export async function notifyNewOrder(
  order: OrderRecord,
): Promise<TelegramSendResult> {
  return sendTelegramMessage(formatOrderTelegramMessage(order))
}

/** Alias used by routes */
export async function sendTelegramOrderNotification(
  order: OrderRecord,
): Promise<TelegramSendResult & { error?: string }> {
  const result = await notifyNewOrder(order)
  return result.ok ? { ok: true } : { ok: false, error: result.error }
}
