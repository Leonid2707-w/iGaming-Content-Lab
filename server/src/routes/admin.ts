import { Hono } from 'hono'
import {
  authenticateAdmin,
  createAdminToken,
  requireAdmin,
  requirePermission,
} from '../middleware/adminAuth.js'
import {
  deleteOrder,
  getOrderById,
  getOrderHistory,
  listOrders,
  updateOrderStatus,
  updateOrderTelegramResult,
} from '../db/orders.js'
import {
  deleteOrderFromSheets,
  syncAllOrdersToSheets,
  syncOrderToSheets,
} from '../services/googleSheets.js'
import { sendTelegramMessage, sendTelegramOrderNotification } from '../services/telegram.js'
import { refreshSignedUrls } from '../services/storage.js'
import { getAdminStats, parseStatsRange } from '../db/stats.js'
import { readJsonBody } from '../lib/jsonBody.js'
import { clientIp, rateLimit } from '../lib/rateLimit.js'
import type { OrderRecord, OrderStatus } from '../types/order.js'
import { hasPermission } from '../config/adminPermissions.js'

const allowedStatuses = new Set<OrderStatus>(['new', 'in_progress', 'done', 'cancelled'])

function redactOrderClient(order: OrderRecord, canSeeClients: boolean): OrderRecord {
  if (canSeeClients) return order
  return {
    ...order,
    client_telegram: '•••',
    user_id: null,
    links: [],
    references_text: '',
    description: order.description ? '[скрыто — нет права на данные клиентов]' : '',
  }
}

export const adminRoutes = new Hono()

adminRoutes.post('/login', async (c) => {
  const ip = clientIp({ get: (n) => c.req.header(n) })
  const limited = rateLimit({ key: `admin-login:${ip}`, limit: 20, windowMs: 15 * 60 * 1000 })
  if (!limited.ok) {
    return c.json(
      { ok: false, error: `Слишком много попыток. Повторите через ${limited.retryAfterSec} с.` },
      429,
    )
  }

  const body = await readJsonBody(c.req, { login: '', password: '' })
  const login = String(body.login || '')
  const password = String(body.password || '')

  const admin = await authenticateAdmin(login, password)
  if (!admin) {
    return c.json({ ok: false, error: 'Неверный логин или пароль' }, 401)
  }

  return c.json({
    ok: true,
    token: createAdminToken(admin),
    admin: {
      id: admin.id,
      login: admin.login,
      displayName: admin.displayName,
      isOwner: admin.isOwner,
      permissions: admin.isOwner ? [] : admin.permissions,
    },
  })
})

adminRoutes.use('/*', requireAdmin)

adminRoutes.get('/me', (c) => {
  const admin = c.get('admin')
  return c.json({
    ok: true,
    admin: {
      id: admin.id,
      login: admin.login,
      displayName: admin.displayName,
      isOwner: admin.isOwner,
      permissions: admin.isOwner ? [] : admin.permissions,
    },
  })
})

adminRoutes.get(
  '/stats',
  requirePermission(
    'analytics.visits',
    'analytics.orders',
    'analytics.registrations',
    'analytics.finance',
  ),
  async (c) => {
    try {
      const range = parseStatsRange({
        from: c.req.query('from') || undefined,
        to: c.req.query('to') || undefined,
        preset: c.req.query('preset') || undefined,
      })
      const stats = await getAdminStats(range)
      const admin = c.get('admin')
      const filtered = { ...stats } as Record<string, unknown>
      if (!hasPermission(admin, 'analytics.visits')) {
        delete filtered.visits
        delete filtered.uniqueVisitors
        delete filtered.visitsByDay
      }
      if (!hasPermission(admin, 'analytics.orders')) {
        delete filtered.orders
        delete filtered.ordersByDay
        delete filtered.ordersByStatus
      }
      if (!hasPermission(admin, 'analytics.registrations')) {
        delete filtered.registrations
        delete filtered.registrationsByDay
      }
      if (!hasPermission(admin, 'analytics.finance')) {
        delete filtered.revenue
        delete filtered.revenueByDay
      }
      return c.json({ ok: true, stats: filtered })
    } catch (error) {
      return c.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : 'Ошибка загрузки статистики',
        },
        400,
      )
    }
  },
)

adminRoutes.get('/orders', requirePermission('orders.view'), async (c) => {
  try {
    const search = c.req.query('search') || ''
    const sort = c.req.query('sort') || 'newest'
    const status = c.req.query('status') || 'all'
    const orders = await listOrders({ search, sort, status })
    const admin = c.get('admin')
    const canSeeClients = hasPermission(admin, 'orders.clients')
    return c.json({
      ok: true,
      orders: orders.map((order) => redactOrderClient(order, canSeeClients)),
    })
  } catch (error) {
    return c.json(
      { ok: false, error: error instanceof Error ? error.message : 'Ошибка загрузки заявок' },
      500,
    )
  }
})

adminRoutes.get('/orders/:id', requirePermission('orders.view'), async (c) => {
  try {
    const order = await getOrderById(c.req.param('id'))
    if (!order) return c.json({ ok: false, error: 'Заявка не найдена' }, 404)
    const files = await refreshSignedUrls(order.files)
    const history = await getOrderHistory(order.id)
    const admin = c.get('admin')
    const canSeeClients = hasPermission(admin, 'orders.clients')
    return c.json({
      ok: true,
      order: redactOrderClient({ ...order, files }, canSeeClients),
      history,
    })
  } catch (error) {
    return c.json(
      { ok: false, error: error instanceof Error ? error.message : 'Ошибка загрузки заявки' },
      500,
    )
  }
})

adminRoutes.patch('/orders/:id/status', requirePermission('orders.status'), async (c) => {
  try {
    const body = await readJsonBody(c.req, { status: '', note: '' })
    const status = body.status as OrderStatus
    if (!allowedStatuses.has(status)) {
      return c.json({ ok: false, error: 'Некорректный статус' }, 400)
    }
    const order = await updateOrderStatus(c.req.param('id'), status, body.note || '')
    const history = await getOrderHistory(order.id)
    void syncOrderToSheets(order)
    return c.json({ ok: true, order, history })
  } catch (error) {
    return c.json(
      { ok: false, error: error instanceof Error ? error.message : 'Ошибка обновления статуса' },
      500,
    )
  }
})

adminRoutes.post('/orders/sync-sheets', requirePermission('orders.view'), async (c) => {
  try {
    const orders = await listOrders({ search: '', sort: 'newest', status: 'all' })
    const result = await syncAllOrdersToSheets(orders)
    if (!result.ok) {
      return c.json(
        {
          ok: false,
          error: result.skipped
            ? 'Google Sheets не настроен (GOOGLE_SHEETS_WEBHOOK_URL / SECRET)'
            : result.error || 'Не удалось синхронизировать',
        },
        result.skipped ? 400 : 502,
      )
    }
    return c.json({ ok: true, count: orders.length })
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Ошибка синхронизации с таблицей',
      },
      500,
    )
  }
})

adminRoutes.post('/telegram/test', requirePermission('orders.view'), async (c) => {
  const result = await sendTelegramMessage(
    [
      '🧪 <b>Тест уведомлений iCL</b>',
      '',
      'Система заказов подключена и готова к работе.',
      `<b>Время:</b> ${new Date().toLocaleString('ru-RU')}`,
    ].join('\n'),
  )
  if (!result.ok) {
    return c.json({ ok: false, error: result.error || 'Не удалось отправить' }, 502)
  }
  return c.json({ ok: true })
})

adminRoutes.post('/orders/:id/resend-telegram', requirePermission('orders.status'), async (c) => {
  try {
    const order = await getOrderById(c.req.param('id'))
    if (!order) return c.json({ ok: false, error: 'Заявка не найдена' }, 404)
    const telegram = await sendTelegramOrderNotification(order)
    const updated = await updateOrderTelegramResult(order.id, {
      sent: telegram.ok,
      error: telegram.error,
    })
    if (!telegram.ok) {
      return c.json({ ok: false, error: telegram.error || 'Не удалось отправить', order: updated }, 502)
    }
    return c.json({ ok: true, order: updated })
  } catch (error) {
    return c.json(
      { ok: false, error: error instanceof Error ? error.message : 'Ошибка повторной отправки' },
      500,
    )
  }
})

adminRoutes.delete('/orders/:id', requirePermission('orders.delete'), async (c) => {
  try {
    const deleted = await deleteOrder(c.req.param('id'))
    if (!deleted) return c.json({ ok: false, error: 'Заявка не найдена' }, 404)
    void deleteOrderFromSheets(deleted.public_id)
    return c.json({ ok: true })
  } catch (error) {
    return c.json(
      { ok: false, error: error instanceof Error ? error.message : 'Ошибка удаления заявки' },
      500,
    )
  }
})
