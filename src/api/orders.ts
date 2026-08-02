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

export type OrderUploadSlot = {
  name: string
  path: string
  mime: string
  size: number
  signedUrl: string
  token: string
}

type SubmitOrderResult = {
  ok: boolean
  needsFinalize?: boolean
  order?: {
    id: string
    publicId: string
    telegramSent: boolean
    filesCount?: number
    linksCount?: number
  }
  uploadSlots?: OrderUploadSlot[]
  warning?: string
  error?: string
  code?: string
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 413) {
    throw new Error(
      'Файл слишком большой для сервера (лимит хостинга). Попробуйте файл меньше или без вложений — мы уже поддерживаем прямую загрузку до 50 МБ.',
    )
  }
  let data: T & { ok?: boolean; error?: string }
  try {
    data = (await response.json()) as T & { ok?: boolean; error?: string }
  } catch {
    throw new Error(response.status === 413 ? 'Слишком большой запрос (HTTP 413)' : `HTTP ${response.status}`)
  }
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `HTTP ${response.status}`)
  }
  return data
}

export async function submitOrderJson(
  payload: Record<string, unknown>,
  accessToken?: string | null,
) {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  return parseJson<SubmitOrderResult>(response)
}

export async function uploadToSignedSlot(
  slot: OrderUploadSlot,
  file: File,
  onProgress?: (percent: number) => void,
) {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', slot.signedUrl)
    xhr.setRequestHeader('Content-Type', file.type || slot.mime || 'application/octet-stream')
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return
      onProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
        return
      }
      reject(new Error(`Не удалось загрузить «${file.name}» (HTTP ${xhr.status})`))
    }
    xhr.onerror = () => reject(new Error(`Сеть недоступна при загрузке «${file.name}»`))
    xhr.send(file)
  })
}

export async function finalizeOrderRequest(
  orderId: string,
  files: { name: string; path: string; mime: string; size: number }[],
  accessToken?: string | null,
) {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const response = await fetch(`${API_BASE}/orders/${orderId}/finalize`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ files }),
  })
  return parseJson<SubmitOrderResult>(response)
}

/** Full flow: create order → upload files to Supabase → finalize notifications. */
export async function submitOrderWithFiles(
  payload: Record<string, unknown>,
  files: File[],
  accessToken?: string | null,
  onProgress?: (percent: number) => void,
) {
  const create = await submitOrderJson(
    {
      ...payload,
      files: files.map((file) => ({
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
      })),
    },
    accessToken,
  )

  if (!create.ok || !create.order) {
    throw new Error(create.error || 'Не удалось создать заявку')
  }

  if (!create.needsFinalize || !create.uploadSlots?.length) {
    onProgress?.(100)
    return create
  }

  onProgress?.(5)

  const uploaded: { name: string; path: string; mime: string; size: number }[] = []
  const slots = create.uploadSlots
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i]
    const file =
      files.find((item) => item.name === slot.name && item.size === slot.size) || files[i]
    if (!file) continue
    await uploadToSignedSlot(slot, file, (filePercent) => {
      const overall = Math.round(((i + filePercent / 100) / slots.length) * 100)
      onProgress?.(overall)
    })
    uploaded.push({
      name: slot.name,
      path: slot.path,
      mime: slot.mime,
      size: slot.size,
    })
  }

  const finalized = await finalizeOrderRequest(create.order.id, uploaded, accessToken)
  onProgress?.(100)
  if (create.warning && finalized.ok) {
    return { ...finalized, warning: create.warning }
  }
  return finalized
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
