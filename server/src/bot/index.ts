import { serverEnv } from '../config/env.js'
import { createOrder, listOrdersForTelegramUser } from '../db/orders.js'
import { getSupabase } from '../db/supabase.js'
import { readCatalog } from '../routes/services.js'
import { notifyOrder } from '../services/orderNotify.js'
import type { OrderRecord } from '../types/order.js'
import { createTelegramApi, sendText, type TelegramApi } from './api.js'
import { normalizeCatalog } from './catalog.js'
import { createBotHandler, formatStatusChangeMessage, type BotUpdateHandler } from './handler.js'
import { createMemorySessionStore, createSupabaseSessionStore } from './sessions.js'

let api: TelegramApi | null = null
let handler: BotUpdateHandler | null = null

export function getBotApi(): TelegramApi | null {
  if (!serverEnv.telegramBotToken) return null
  api ??= createTelegramApi(serverEnv.telegramBotToken)
  return api
}

function supabaseConfigured() {
  return Boolean(serverEnv.supabaseUrl && serverEnv.supabaseServiceRoleKey)
}

export function getBotHandler(): BotUpdateHandler | null {
  const botApi = getBotApi()
  if (!botApi) return null
  handler ??= createBotHandler({
    api: botApi,
    sessions: supabaseConfigured()
      ? createSupabaseSessionStore(getSupabase)
      : createMemorySessionStore(),
    loadCatalog: async () => normalizeCatalog(supabaseConfigured() ? await readCatalog() : null),
    createOrder: (input) => createOrder(input),
    afterOrderCreated: async (order) => {
      await notifyOrder(order.id)
    },
    listOrders: (user) =>
      listOrdersForTelegramUser({ telegramUserId: user.id, username: user.username }),
    adminChatId: serverEnv.telegramAdminId,
    supportUrl: serverEnv.telegramSupportUrl,
    siteUrl: serverEnv.publicSiteUrl,
  })
  return handler
}

/** Tell the client about a status change if the order came from the bot. */
export async function notifyClientStatusChange(order: OrderRecord, note?: string) {
  const chatId = order.meta?.telegram_chat_id
  const botApi = getBotApi()
  if (!botApi || (typeof chatId !== 'string' && typeof chatId !== 'number')) return
  try {
    await sendText(botApi, chatId, formatStatusChangeMessage(order, note))
  } catch (error) {
    console.warn('[bot.statusNotify]', error instanceof Error ? error.message : error)
  }
}
