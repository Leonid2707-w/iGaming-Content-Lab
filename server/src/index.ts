import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serverEnv } from './config/env.js'
import { adminRoutes } from './routes/admin.js'
import { adminUsersRoutes } from './routes/adminUsers.js'
import { authRoutes } from './routes/auth.js'
import { filesPublicRoutes } from './routes/files.js'
import { ordersPublicRoutes } from './routes/orders.js'
import { portfolioAdminRoutes } from './routes/portfolio.js'

const app = new Hono()

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
    ok: true,
    service: 'icl-api',
    telegramConfigured: Boolean(serverEnv.telegramBotToken && serverEnv.telegramAdminId),
    telegramChatId: serverEnv.telegramAdminId || null,
    sheetsConfigured: Boolean(
      serverEnv.googleSheetsWebhookUrl && serverEnv.googleSheetsWebhookSecret,
    ),
    supabaseConfigured: Boolean(serverEnv.supabaseUrl && serverEnv.supabaseServiceRoleKey),
    publicSiteUrl: serverEnv.publicSiteUrl || null,
    allowedOrigins: serverEnv.allowedOrigins,
  }),
)

app.route('/api/auth', authRoutes)
app.route('/api/orders', ordersPublicRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/admin/portfolio', portfolioAdminRoutes)
app.route('/api/admin/users', adminUsersRoutes)
app.route('/api/files', filesPublicRoutes)

app.onError((error, c) => {
  console.error('[api]', error)
  return c.json({ ok: false, error: error.message || 'Internal error' }, 500)
})

serve({ fetch: app.fetch, port: serverEnv.port }, (info) => {
  console.log(`[icl-api] http://127.0.0.1:${info.port}`)
})
