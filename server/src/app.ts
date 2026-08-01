import { setDefaultResultOrder } from 'node:dns'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { assertServerConfig, serverEnv } from './config/env.js'
import { ensureOwnerAdmin } from './db/admins.js'
import { adminRoutes } from './routes/admin.js'
import { adminsAdminRoutes } from './routes/admins.js'
import { adminUsersRoutes } from './routes/adminUsers.js'
import { authRoutes } from './routes/auth.js'
import { filesPublicRoutes } from './routes/files.js'
import { ordersPublicRoutes } from './routes/orders.js'
import { portfolioAdminRoutes } from './routes/portfolio.js'
import { servicesAdminRoutes, servicesPublicRoutes } from './routes/services.js'
import { partnersPublicRoutes } from './routes/partners.js'
import { visitsPublicRoutes } from './routes/visits.js'

try {
  setDefaultResultOrder('ipv4first')
} catch {
  // ignore
}

let bootConfigError: string | null = null
try {
  assertServerConfig()
} catch (error) {
  bootConfigError = error instanceof Error ? error.message : String(error)
  // Never crash the whole serverless function at import time — health/login
  // must still respond so Vercel deploy is diagnosable.
  console.error('[icl-api] config error:', bootConfigError)
}

export const app = new Hono()

let ownerSeedStarted = false
function scheduleOwnerSeed() {
  if (ownerSeedStarted || bootConfigError) return
  if (!serverEnv.supabaseUrl || !serverEnv.adminPassword) return
  ownerSeedStarted = true
  void ensureOwnerAdmin().catch((error) => {
    console.warn('[admins] seed failed:', error instanceof Error ? error.message : error)
  })
}

app.use('*', async (_c, next) => {
  scheduleOwnerSeed()
  await next()
})

app.use(
  '*',
  cors({
    origin: serverEnv.allowedOrigins,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
)

app.get('/api/health', (c) =>
  c.json({
    ok: !bootConfigError,
    service: 'icl-api',
    runtime: process.env.VERCEL ? 'vercel' : 'node',
    supabaseConfigured: Boolean(serverEnv.supabaseUrl && serverEnv.supabaseServiceRoleKey),
    telegramConfigured: Boolean(serverEnv.telegramBotToken && serverEnv.telegramAdminId),
    sheetsConfigured: Boolean(
      serverEnv.googleSheetsWebhookUrl && serverEnv.googleSheetsWebhookSecret,
    ),
    configError: bootConfigError || undefined,
  }),
)

app.route('/api/auth', authRoutes)
app.route('/api/orders', ordersPublicRoutes)
app.route('/api/visits', visitsPublicRoutes)
app.route('/api/partners', partnersPublicRoutes)
app.route('/api/services', servicesPublicRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/admin/admins', adminsAdminRoutes)
app.route('/api/admin/portfolio', portfolioAdminRoutes)
app.route('/api/admin/users', adminUsersRoutes)
app.route('/api/admin/services', servicesAdminRoutes)
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
