/**
 * Local development: long polling instead of a webhook.
 * Note: deleteWebhook disconnects the production webhook — run scripts/telegram-setup.mjs afterwards.
 */
import { serverEnv } from '../config/env.js'
import { BOT_COMMANDS, createTelegramApi } from './api.js'
import { getBotHandler } from './index.js'
import type { TgUpdate } from './types.js'

const handler = getBotHandler()
if (!serverEnv.telegramBotToken || !handler) {
  console.error('[bot] TELEGRAM_BOT_TOKEN не задан в .env')
  process.exit(1)
}
const api = createTelegramApi(serverEnv.telegramBotToken, 45_000)

const me = await api.call<{ username: string }>('getMe')
await api.call('deleteWebhook', { drop_pending_updates: false })
await api.call('setMyCommands', { commands: BOT_COMMANDS })
console.log(`[bot] @${me.username} запущен в режиме long polling. Ctrl+C — остановить.`)

let offset = 0
let stopped = false
process.on('SIGINT', () => {
  stopped = true
  console.log('\n[bot] остановка…')
  process.exit(0)
})

while (!stopped) {
  try {
    const updates = await api.call<TgUpdate[]>('getUpdates', {
      offset,
      timeout: 30,
      allowed_updates: ['message', 'callback_query'],
    })
    for (const update of updates) {
      offset = update.update_id + 1
      await handler(update)
    }
  } catch (error) {
    console.error('[bot] polling error:', error instanceof Error ? error.message : error)
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }
}
