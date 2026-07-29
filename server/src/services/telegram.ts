import { setDefaultResultOrder } from 'node:dns'
import { serverEnv } from '../config/env.js'
import type { OrderRecord } from '../types/order.js'
import { ORDER_STATUS_LABELS } from '../types/order.js'

// На части сетей Telegram лучше открывается по IPv4
try {
  setDefaultResultOrder('ipv4first')
} catch {
  // ignore older Node
}

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Default HTML template. Override via TELEGRAM_ORDER_TEMPLATE in .env */
export const DEFAULT_ORDER_TELEGRAM_TEMPLATE = [
  '🆕 <b>Новая заявка iCL</b>',
  '',
  '<b>ID:</b> <code>{public_id}</code>',
  '<b>Дата:</b> {date}',
  '<b>Telegram:</b> {telegram}',
  '<b>Услуга:</b> {service}',
  '<b>Платформа:</b> {platform}',
  '<b>Объём:</b> {quantity}',
  '<b>Сумма:</b> {price_label}',
  '<b>Статус:</b> {status}',
  '',
  '<b>Описание:</b>',
  '{description}',
  '',
  '<b>Референсы и стиль:</b>',
  '{references}',
  '',
  '<b>Ссылки:</b>',
  '{links}',
  '{files_note}',
].join('\n')

export type OrderTelegramVars = Record<string, string>

export function buildOrderTelegramVars(order: OrderRecord): OrderTelegramVars {
  const links =
    order.links.length > 0 ? order.links.map((link) => `• ${link}`).join('\n') : '—'
  const filesNote =
    order.files.length > 0
      ? `\n📎 Файлы: <b>${order.files.length}</b> (в админ-панели)`
      : ''

  return {
    public_id: order.public_id,
    id: order.public_id,
    date: formatDate(order.created_at),
    created_at: formatDate(order.created_at),
    updated_at: formatDate(order.updated_at),
    telegram: order.client_telegram || '—',
    client_telegram: order.client_telegram || '—',
    service: order.service_title || '—',
    service_title: order.service_title || '—',
    platform: order.platform || '—',
    quantity: order.quantity_label || '—',
    quantity_label: order.quantity_label || '—',
    price: order.price == null ? '—' : String(order.price),
    price_label: order.price_label || formatMoney(order.price),
    status: ORDER_STATUS_LABELS[order.status] || order.status,
    status_code: order.status,
    description: order.description?.trim() || '—',
    references: order.references_text?.trim() || '—',
    references_text: order.references_text?.trim() || '—',
    links,
    files_count: String(order.files.length),
    files_note: filesNote,
    user_id: order.user_id || '—',
  }
}

function applyTemplate(template: string, vars: OrderTelegramVars, htmlEscape: boolean) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key: string) => {
    const raw = vars[key] ?? ''
    return htmlEscape ? escapeHtml(raw) : raw
  })
}

export function formatOrderTelegramMessage(order: OrderRecord): string {
  const vars = buildOrderTelegramVars(order)
  const template = serverEnv.telegramOrderTemplate || DEFAULT_ORDER_TELEGRAM_TEMPLATE
  const filesNote = vars.files_note
  const safeVars: OrderTelegramVars = { ...vars, files_note: '__FILES_NOTE__' }
  const rendered = applyTemplate(template, safeVars, true)
  return rendered.replaceAll('__FILES_NOTE__', filesNote)
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
      signal: AbortSignal.timeout(25000),
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
    const message =
      error instanceof Error
        ? error.name === 'TimeoutError' || error.name === 'AbortError'
          ? 'Telegram API timeout (проверьте сеть/VPN)'
          : error.message
        : 'Telegram network error'
    return { ok: false, error: message }
  }
}

export async function notifyNewOrder(
  order: OrderRecord,
): Promise<TelegramSendResult> {
  return sendTelegramMessage(formatOrderTelegramMessage(order))
}

export async function sendTelegramOrderNotification(
  order: OrderRecord,
): Promise<TelegramSendResult & { error?: string }> {
  const result = await notifyNewOrder(order)
  return result.ok ? { ok: true } : { ok: false, error: result.error }
}
