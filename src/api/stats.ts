import type { OrderStatus } from '@/api/orders'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export type DailyStatsPoint = {
  date: string
  visits: number
  uniqueVisits: number
  orders: number
  revenue: number
}

export type AdminStats = {
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
  daily: DailyStatsPoint[]
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { ok?: boolean; error?: string }
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `HTTP ${response.status}`)
  }
  return data
}

export async function trackPageVisit(payload: {
  visitorId: string
  path: string
  referrer?: string
}) {
  try {
    await fetch(`${API_BASE}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch {
    // Analytics must never break the site UX.
  }
}

export async function fetchAdminStats(
  token: string,
  params: { from?: string; to?: string; preset?: string },
) {
  const query = new URLSearchParams()
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
  if (params.preset) query.set('preset', params.preset)

  const response = await fetch(`${API_BASE}/admin/stats?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return parseJson<{ ok: boolean; stats: AdminStats; error?: string }>(response)
}
