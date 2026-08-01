import { config } from 'dotenv'
import { resolve } from 'node:path'

// Local .env; on Vercel env vars come from the dashboard (file may be absent).
config({ path: resolve(process.cwd(), '.env'), quiet: true })

function required(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback
  // Strip accidental quotes/newlines from Vercel dashboard paste.
  const cleaned = value?.trim().replace(/^['"]|['"]$/g, '').replace(/\r?\n/g, '')
  return cleaned || undefined
}

const weakSecrets = new Set([
  'icl-change-me-admin-secret',
  'replace-with-long-random-secret',
  'secret',
  'change-me',
])

function parseOrigins(raw: string | undefined, publicSiteUrl: string | undefined) {
  const defaults = ['http://127.0.0.1:5173', 'http://localhost:5173']
  const fromEnv = (raw || '')
    .split(',')
    .map((item) => item.trim().replace(/\/$/, ''))
    .filter(Boolean)
  const withSite = publicSiteUrl ? [publicSiteUrl.replace(/\/$/, '')] : []
  return [...new Set([...defaults, ...withSite, ...fromEnv])]
}

const publicSiteUrl = required('PUBLIC_SITE_URL') || required('SITE_URL')
const adminApiSecret = required('ADMIN_API_SECRET')

export const serverEnv = {
  port: Number(process.env.PORT || 8787),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production' || Boolean(process.env.VERCEL),
  publicSiteUrl,
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS, publicSiteUrl),
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  telegramBotToken: required('TELEGRAM_BOT_TOKEN'),
  telegramAdminId: required('TELEGRAM_ADMIN_ID'),
  /** Optional custom HTML template with {placeholders}. Use \n for newlines in .env */
  telegramOrderTemplate: required('TELEGRAM_ORDER_TEMPLATE')?.replaceAll('\\n', '\n'),
  googleSheetsWebhookUrl: required('GOOGLE_SHEETS_WEBHOOK_URL'),
  googleSheetsWebhookSecret: required('GOOGLE_SHEETS_WEBHOOK_SECRET'),
  adminLogin: required('ADMIN_LOGIN') || 'Leonid',
  adminPassword: required('ADMIN_PASSWORD') || '',
  adminApiSecret: adminApiSecret || '',
}

/** Required for Auth / orders / DB access. */
export function assertSupabaseConfig() {
  const missing: string[] = []
  if (!serverEnv.supabaseUrl) missing.push('SUPABASE_URL')
  if (!serverEnv.supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (missing.length) {
    throw new Error(`Missing env: ${missing.join(', ')}`)
  }
}

/** Required for admin panel API only. */
export function assertAdminConfig() {
  const missing: string[] = []
  if (!serverEnv.adminPassword) missing.push('ADMIN_PASSWORD')
  if (!adminApiSecret || weakSecrets.has(adminApiSecret) || adminApiSecret.length < 24) {
    missing.push('ADMIN_API_SECRET (длинный случайный секрет ≥24 символов, не дефолт)')
  }
  if (missing.length) {
    throw new Error(`Missing/weak env: ${missing.join(', ')}`)
  }
}

/** Full server boot check. */
export function assertServerConfig() {
  assertSupabaseConfig()
  assertAdminConfig()
}
