import { Hono } from 'hono'
import {
  createAdminToken,
  requireAdmin,
  validateAdminCredentials,
} from '../middleware/adminAuth.js'
import {
  deleteOrder,
  getOrderById,
  getOrderHistory,
  listOrders,
  updateOrderStatus,
} from '../db/orders.js'
import { refreshSignedUrls } from '../services/storage.js'
import type { OrderStatus } from '../types/order.js'

const allowedStatuses = new Set<OrderStatus>(['new', 'in_progress', 'done', 'cancelled'])

export const adminRoutes = new Hono()

adminRoutes.post('/login', async (c) => {
  const body = await c.req.json<{ login?: string; password?: string }>().catch(() => ({}))
  const login = String(body.login || '')
  const password = String(body.password || '')

  if (!validateAdminCredentials(login, password)) {
    return c.json({ ok: false, error: 'Неверный логин или пароль' }, 401)
  }

  return c.json({
    ok: true,
    token: createAdminToken(login.trim()),
  })
})

adminRoutes.use('/*', requireAdmin)

adminRoutes.get('/orders', async (c) => {
  try {
    const search = c.req.query('search') || ''
    const sort = c.req.query('sort') || 'newest'
    const status = c.req.query('status') || 'all'
    const orders = await listOrders({ search, sort, status })
    return c.json({ ok: true, orders })
  } catch (error) {
    return c.json(
      { ok: false, error: error instanceof Error ? error.message : 'Ошибка загрузки заявок' },
      500,
    )
  }
})

adminRoutes.get('/orders/:id', async (c) => {
  try {
    const order = await getOrderById(c.req.param('id'))
    if (!order) return c.json({ ok: false, error: 'Заявка не найдена' }, 404)
    const files = await refreshSignedUrls(order.files)
    const history = await getOrderHistory(order.id)
    return c.json({ ok: true, order: { ...order, files }, history })
  } catch (error) {
    return c.json(
      { ok: false, error: error instanceof Error ? error.message : 'Ошибка загрузки заявки' },
      500,
    )
  }
})

adminRoutes.patch('/orders/:id/status', async (c) => {
  try {
    const body = await c.req.json<{ status?: string; note?: string }>().catch(() => ({}))
    const status = body.status as OrderStatus
    if (!allowedStatuses.has(status)) {
      return c.json({ ok: false, error: 'Некорректный статус' }, 400)
    }
    const order = await updateOrderStatus(c.req.param('id'), status, body.note || '')
    const history = await getOrderHistory(order.id)
    return c.json({ ok: true, order, history })
  } catch (error) {
    return c.json(
      { ok: false, error: error instanceof Error ? error.message : 'Ошибка обновления статуса' },
      500,
    )
  }
})

adminRoutes.delete('/orders/:id', async (c) => {
  try {
    const deleted = await deleteOrder(c.req.param('id'))
    if (!deleted) return c.json({ ok: false, error: 'Заявка не найдена' }, 404)
    return c.json({ ok: true })
  } catch (error) {
    return c.json(
      { ok: false, error: error instanceof Error ? error.message : 'Ошибка удаления заявки' },
      500,
    )
  }
})
