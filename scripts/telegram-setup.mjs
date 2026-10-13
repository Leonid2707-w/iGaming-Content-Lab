// Registers the production webhook and bot commands.
// Usage: node scripts/telegram-setup.mjs [https://your-domain]   (reads .env)
//        node scripts/telegram-setup.mjs --info
import { config } from 'dotenv'

config({ quiet: true })

const clean = (value) => value?.trim().replace(/^['"]|['"]$/g, '') || ''
const token = clean(process.env.TELEGRAM_BOT_TOKEN)
const secret = clean(process.env.TELEGRAM_WEBHOOK_SECRET)
const arg = process.argv[2]

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not set')
  process.exit(1)
}

async function call(method, params = {}) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(`${method}: ${data.description}`)
  return data.result
}

if (arg === '--info') {
  console.log(await call('getWebhookInfo'))
  process.exit(0)
}

const site = clean(arg || process.env.PUBLIC_SITE_URL).replace(/\/$/, '')
if (!site.startsWith('https://')) {
  console.error('Pass the public https URL or set PUBLIC_SITE_URL')
  process.exit(1)
}
if (secret.length < 16 || !/^[A-Za-z0-9_-]+$/.test(secret)) {
  console.error('TELEGRAM_WEBHOOK_SECRET must be ≥16 chars of A-Z, a-z, 0-9, _ or -')
  process.exit(1)
}

const me = await call('getMe')
const url = `${site}/api/telegram/webhook`
await call('setWebhook', {
  url,
  secret_token: secret,
  allowed_updates: ['message', 'callback_query'],
  drop_pending_updates: true,
})
await call('setMyCommands', {
  commands: [
    { command: 'start', description: 'Главное меню' },
    { command: 'order', description: 'Оформить заказ' },
    { command: 'prices', description: 'Услуги и цены' },
    { command: 'my', description: 'Мои заказы' },
    { command: 'support', description: 'Написать менеджеру' },
    { command: 'cancel', description: 'Отменить текущее действие' },
  ],
})

console.log(`@${me.username}: webhook → ${url}`)
console.log(await call('getWebhookInfo'))
