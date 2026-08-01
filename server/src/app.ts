import { setDefaultResultOrder } from 'node:dns'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serverEnv } from './config/env.js'
import { adminRoutes } from './routes/admin.js'
import { adminUsersRoutes } from './routes/adminUsers.js'
import { authRoutes } from './routes/auth.js'
import { filesPublicRoutes } from './routes/files.js'
import { ordersPublicRoutes } from './routes/orders.js'
import { portfolioAdminRoutes } from './routes/portfolio.js'
import { visitsPublicRoutes } from './routes/visits.js'

try {
  setDefaultResultOrder('ipv4first')
} catch {
  // ignore
}

export const app = new Hono()

app.use(
  '*',
  cors({
    origin: serverEnv.allowedOrigins,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
)

async function probeSupabase() {
  const url = serverEnv.supabaseUrl?.replace(/\/$/, '')
  const key = serverEnv.supabaseServiceRoleKey
  if (!url || !key) return { ok: false as const, error: 'missing env' }
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8_000)
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: controller.signal,
    })
    clearTimeout(timer)
    return { ok: res.ok, status: res.status }
  } catch (error) {
    const err = error as Error & { cause?: unknown }
    return {
      ok: false as const,
      error: err.message || 'fetch failed',
      cause: err.cause ? String(err.cause) : undefined,
    }
  }
}

app.get('/api/health', async (c) => {
  const supabaseProbe = await probeSupabase()
  return c.json({
    ok: true,
    service: 'icl-api',
    runtime: process.env.VERCEL ? 'vercel' : 'node',
    telegramConfigured: Boolean(serverEnv.telegramBotToken && serverEnv.telegramAdminId),
    telegramChatId: serverEnv.telegramAdminId || null,
    sheetsConfigured: Boolean(
      serverEnv.googleSheetsWebhookUrl && serverEnv.googleSheetsWebhookSecret,
    ),
    supabaseConfigured: Boolean(serverEnv.supabaseUrl && serverEnv.supabaseServiceRoleKey),
    supabaseReachable: supabaseProbe.ok,
    supabaseProbe,
    publicSiteUrl: serverEnv.publicSiteUrl || null,
    allowedOrigins: serverEnv.allowedOrigins,
  })
})

app.route('/api/auth', authRoutes)
app.route('/api/orders', ordersPublicRoutes)
app.route('/api/visits', visitsPublicRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/admin/portfolio', portfolioAdminRoutes)
app.route('/api/admin/users', adminUsersRoutes)
app.route('/api/files', filesPublicRoutes)

app.notFound((c) => {
  if (c.req.path.startsWith('/api')) {
    return c.json({ ok: false, error: `API-маршрут не найден: ${c.req.method} ${c.req.path}` }, 404)
  }
  return c.text('Not Found', 404)
})

app.onError((error, c) => {
  console.error('[api]', error)
  return c.json({ ok: false, error: error.message || 'Internal error' }, 500)
})
