import type { InlineKeyboard } from './types.js'

export interface TelegramApi {
  call<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>
}

export function createTelegramApi(token: string, timeoutMs = 15_000): TelegramApi {
  return {
    async call<T>(method: string, params: Record<string, unknown> = {}) {
      const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(timeoutMs),
      })
      const data = (await res.json()) as { ok?: boolean; result?: T; description?: string }
      if (!res.ok || !data.ok) {
        throw new Error(`Telegram ${method}: ${data.description ?? `HTTP ${res.status}`}`)
      }
      return data.result as T
    },
  }
}

export function sendText(
  api: TelegramApi,
  chatId: number | string,
  text: string,
  keyboard?: InlineKeyboard,
) {
  return api.call('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
  })
}

export const BOT_COMMANDS = [
  { command: 'start', description: 'Главное меню' },
  { command: 'order', description: 'Оформить заказ' },
  { command: 'prices', description: 'Услуги и цены' },
  { command: 'my', description: 'Мои заказы' },
  { command: 'support', description: 'Написать менеджеру' },
  { command: 'cancel', description: 'Отменить текущее действие' },
]
