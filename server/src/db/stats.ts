import { listOrders } from './orders.js'
import { listPageVisits } from './visits.js'
import type { OrderRecord, OrderStatus } from '../types/order.js'

export type StatsRange = {
  from: Date
  to: Date
}

export type DailyPoint = {
  date: string
  visits: number
  uniqueVisits: number
  orders: number
  revenue: number
}

export type AdminStatsPayload = {
  range: { from: string; to: string }
  visits: {
    total: number
    unique: number
    topPaths: Array<{ path: string; count: number }>
  }
  orders: {
    total: number
    byStatus: Record<OrderStatus, number>
    revenueTotal: number
    revenueDone: number
    avgCheck: number
    byService: Array<{ service: string; count: number; revenue: number }>
  }
  conversionRate: number
  daily: DailyPoint[]
}

const EMPTY_STATUS: Record<OrderStatus, number> = {
  new: 0,
  in_progress: 0,
  done: 0,
  cancelled: 0,
}

export function parseStatsRange(query: {
  from?: string
  to?: string
  preset?: string
}): StatsRange {
  const now = new Date()
  const to = query.to ? new Date(query.to) : now
  if (Number.isNaN(to.getTime())) throw new Error('Некорректная дата «по»')

  let from: Date
  if (query.from) {
    from = new Date(query.from)
  } else {
    const preset = (query.preset || '30d').toLowerCase()
    from = new Date(to)
    if (preset === '7d') from.setUTCDate(from.getUTCDate() - 6)
    else if (preset === '90d') from.setUTCDate(from.getUTCDate() - 89)
    else if (preset === 'all') from = new Date('2020-01-01T00:00:00.000Z')
    else from.setUTCDate(from.getUTCDate() - 29)
  }

  if (Number.isNaN(from.getTime())) throw new Error('Некорректная дата «с»')
  if (from > to) throw new Error('Дата «с» позже даты «по»')

  from.setUTCHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setUTCHours(23, 59, 59, 999)
  return { from, to: end }
}

export async function getAdminStats(range: StatsRange): Promise<AdminStatsPayload> {
  const fromIso = range.from.toISOString()
  const toIso = range.to.toISOString()

  const [orders, visits] = await Promise.all([
    listOrders({ search: '', sort: 'newest', status: 'all' }),
    listPageVisits(fromIso, toIso),
  ])

  const ordersInRange = orders.filter((order) => {
    const created = new Date(order.created_at).getTime()
    return created >= range.from.getTime() && created <= range.to.getTime()
  })

  const byStatus = { ...EMPTY_STATUS }
  let revenueTotal = 0
  let revenueDone = 0
  const serviceMap = new Map<string, { count: number; revenue: number }>()

  for (const order of ordersInRange) {
    byStatus[order.status] += 1
    const price = Number(order.price) || 0
    if (order.status !== 'cancelled') revenueTotal += price
    if (order.status === 'done') revenueDone += price

    const key = order.service_title || 'Без названия'
    const current = serviceMap.get(key) || { count: 0, revenue: 0 }
    current.count += 1
    if (order.status !== 'cancelled') current.revenue += price
    serviceMap.set(key, current)
  }

  const uniqueVisitors = new Set(visits.map((v) => v.visitor_id))
  const pathCounts = new Map<string, number>()
  for (const visit of visits) {
    pathCounts.set(visit.path, (pathCounts.get(visit.path) || 0) + 1)
  }

  const topPaths = [...pathCounts.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const byService = [...serviceMap.entries()]
    .map(([service, value]) => ({ service, ...value }))
    .sort((a, b) => b.count - a.count)

  const paidOrders = ordersInRange.filter((o) => o.status !== 'cancelled' && Number(o.price) > 0)
  const avgCheck =
    paidOrders.length > 0
      ? paidOrders.reduce((sum, o) => sum + (Number(o.price) || 0), 0) / paidOrders.length
      : 0

  const daily = buildDailySeries(range, visits, ordersInRange)
  const unique = uniqueVisitors.size
  const conversionRate = unique > 0 ? (ordersInRange.length / unique) * 100 : 0

  return {
    range: { from: fromIso, to: toIso },
    visits: {
      total: visits.length,
      unique,
      topPaths,
    },
    orders: {
      total: ordersInRange.length,
      byStatus,
      revenueTotal,
      revenueDone,
      avgCheck,
      byService,
    },
    conversionRate,
    daily,
  }
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function buildDailySeries(
  range: StatsRange,
  visits: Array<{ created_at: string; visitor_id: string }>,
  orders: OrderRecord[],
): DailyPoint[] {
  const days: DailyPoint[] = []
  const cursor = new Date(range.from)
  cursor.setUTCHours(0, 0, 0, 0)
  const end = new Date(range.to)
  end.setUTCHours(0, 0, 0, 0)

  while (cursor <= end) {
    days.push({
      date: dayKey(cursor),
      visits: 0,
      uniqueVisits: 0,
      orders: 0,
      revenue: 0,
    })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  const index = new Map(days.map((d, i) => [d.date, i]))
  const uniqueByDay = new Map<string, Set<string>>()

  for (const visit of visits) {
    const key = dayKey(new Date(visit.created_at))
    const i = index.get(key)
    if (i == null) continue
    days[i].visits += 1
    if (!uniqueByDay.has(key)) uniqueByDay.set(key, new Set())
    uniqueByDay.get(key)!.add(visit.visitor_id)
  }

  for (const [key, set] of uniqueByDay) {
    const i = index.get(key)
    if (i != null) days[i].uniqueVisits = set.size
  }

  for (const order of orders) {
    const key = dayKey(new Date(order.created_at))
    const i = index.get(key)
    if (i == null) continue
    days[i].orders += 1
    if (order.status !== 'cancelled') days[i].revenue += Number(order.price) || 0
  }

  return days
}
