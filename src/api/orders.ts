export type OrderStatus = 'new' | 'in_progress' | 'done' | 'cancelled'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  done: 'Выполнена',
  cancelled: 'Отменена',
}

export interface OrderFileDto {
  name: string
  path: string
  url: string
  mime: string
  size: number
}

export interface OrderDto {
  id: string
  public_id: string
  created_at: string
  updated_at: string
  client_telegram: string
  service_id: string | null
  service_title: string
  platform: string | null
  quantity_label: string | null
  price: number | null
  price_label: string | null
  description: string
  references_text: string
  links: string[]
  files: OrderFileDto[]
  meta: Record<string, unknown>
  status: OrderStatus
  telegram_sent: boolean
  telegram_error: string | null
}

export interface OrderHistoryDto {
  id: string
  order_id: string
  status: OrderStatus
  note: string
  created_at: string
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { ok?: boolean; error?: string }
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `HTTP ${response.status}`)
  }
  return data
}

export async function submitOrderRequest(formData: FormData, accessToken?: string | null) {
  const headers: HeadersInit = {}
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers,
    body: formData,
  })
  return parseJson<{
    ok: boolean
    order?: { id: string; publicId: string; telegramSent: boolean }
    warning?: string
    error?: string
    code?: string
  }>(response)
}

export async function adminLoginRequest(login: string, password: string) {
  const response = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  })
  return parseJson<{ ok: boolean; token?: string; error?: string }>(response)
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function fetchAdminOrders(
  token: string,
  params: { search?: string; sort?: string; status?: string },
) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.sort) query.set('sort', params.sort)
  if (params.status) query.set('status', params.status)

  const response = await fetch(`${API_BASE}/admin/orders?${query.toString()}`, {
    headers: authHeaders(token),
  })
  return parseJson<{ ok: boolean; orders: OrderDto[]; error?: string }>(response)
}

export async function fetchAdminOrder(token: string, id: string) {
  const response = await fetch(`${API_BASE}/admin/orders/${id}`, {
    headers: authHeaders(token),
  })
  return parseJson<{
    ok: boolean
    order: OrderDto
    history: OrderHistoryDto[]
    error?: string
  }>(response)
}

export async function updateAdminOrderStatus(
  token: string,
  id: string,
  status: OrderStatus,
  note?: string,
) {
  const response = await fetch(`${API_BASE}/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, note }),
  })
  return parseJson<{
    ok: boolean
    order: OrderDto
    history: OrderHistoryDto[]
    error?: string
  }>(response)
}

export async function deleteAdminOrder(token: string, id: string) {
  const response = await fetch(`${API_BASE}/admin/orders/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  return parseJson<{ ok: boolean; error?: string }>(response)
}
