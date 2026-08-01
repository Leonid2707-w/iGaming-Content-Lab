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

type SubmitOrderResult = {
  ok: boolean
  order?: { id: string; publicId: string; telegramSent: boolean }
  warning?: string
  error?: string
  code?: string
}

function xhrSubmitOrder(
  formData: FormData,
  accessToken: string | null | undefined,
  onProgress?: (percent: number) => void,
): Promise<SubmitOrderResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}/orders`)
    if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return
      onProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || '{}') as SubmitOrderResult
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data)
          return
        }
        reject(new Error(data.error || `HTTP ${xhr.status}`))
      } catch {
        reject(new Error(`HTTP ${xhr.status}`))
      }
    }
    xhr.onerror = () => reject(new Error('Сеть недоступна'))
    xhr.send(formData)
  })
}

export async function submitOrderRequest(
  formData: FormData,
  accessToken?: string | null,
  options?: { onProgress?: (percent: number) => void; retries?: number },
) {
  const retries = options?.retries ?? 1
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      options?.onProgress?.(0)
      const result = await xhrSubmitOrder(formData, accessToken, options?.onProgress)
      options?.onProgress?.(100)
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Ошибка отправки')
      const retryable = /сеть|network|failed|HTTP 5/i.test(lastError.message)
      if (!retryable || attempt >= retries) break
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)))
    }
  }
  throw lastError || new Error('Не удалось отправить заявку')
}

export class AdminAuthError extends Error {
  constructor(message = 'Сессия администратора истекла') {
    super(message)
    this.name = 'AdminAuthError'
  }
}

async function parseAdminJson<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new AdminAuthError()
  }
  return parseJson<T>(response)
}

export async function adminLoginRequest(login: string, password: string) {
  const response = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  })
  return parseJson<{
    ok: boolean
    token?: string
    error?: string
    admin?: {
      id: string
      login: string
      displayName: string
      isOwner: boolean
      permissions: string[]
    }
  }>(response)
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
  return parseAdminJson<{ ok: boolean; orders: OrderDto[]; error?: string }>(response)
}

export async function fetchAdminOrder(token: string, id: string) {
  const response = await fetch(`${API_BASE}/admin/orders/${id}`, {
    headers: authHeaders(token),
  })
  return parseAdminJson<{
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
  return parseAdminJson<{
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
  return parseAdminJson<{ ok: boolean; error?: string }>(response)
}

export async function resendAdminOrderTelegram(token: string, id: string) {
  const response = await fetch(`${API_BASE}/admin/orders/${id}/resend-telegram`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  return parseAdminJson<{ ok: boolean; order?: OrderDto; error?: string }>(response)
}
