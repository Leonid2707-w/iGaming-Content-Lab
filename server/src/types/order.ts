export type OrderStatus = 'new' | 'in_progress' | 'done' | 'cancelled'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  done: 'Выполнена',
  cancelled: 'Отменена',
}

export interface OrderFile {
  name: string
  path: string
  url: string
  mime: string
  size: number
}

export interface OrderRecord {
  id: string
  public_id: string
  created_at: string
  updated_at: string
  user_id: string | null
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
  files: OrderFile[]
  meta: Record<string, unknown>
  status: OrderStatus
  telegram_sent: boolean
  telegram_error: string | null
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: OrderStatus
  note: string
  created_at: string
}

export interface CreateOrderInput {
  userId?: string | null
  clientTelegram: string
  serviceId?: string
  serviceTitle: string
  platform?: string
  quantityLabel?: string
  price?: number | null
  priceLabel?: string
  description: string
  referencesText?: string
  links?: string[]
  meta?: Record<string, unknown>
}
