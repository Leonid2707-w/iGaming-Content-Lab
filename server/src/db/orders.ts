import { getSupabase } from './supabase.js'
import type {
  CreateOrderInput,
  OrderFile,
  OrderRecord,
  OrderStatus,
  OrderStatusHistory,
} from '../types/order.js'

function mapOrder(row: Record<string, unknown>): OrderRecord {
  return {
    id: String(row.id),
    public_id: String(row.public_id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    user_id: (row.user_id as string | null) ?? null,
    client_telegram: String(row.client_telegram),
    service_id: (row.service_id as string | null) ?? null,
    service_title: String(row.service_title),
    platform: (row.platform as string | null) ?? null,
    quantity_label: (row.quantity_label as string | null) ?? null,
    price: row.price == null ? null : Number(row.price),
    price_label: (row.price_label as string | null) ?? null,
    description: String(row.description ?? ''),
    references_text: String(row.references_text ?? ''),
    links: Array.isArray(row.links) ? (row.links as string[]) : [],
    files: Array.isArray(row.files) ? (row.files as OrderFile[]) : [],
    meta: (row.meta as Record<string, unknown>) ?? {},
    status: row.status as OrderStatus,
    telegram_sent: Boolean(row.telegram_sent),
    telegram_error: (row.telegram_error as string | null) ?? null,
  }
}

function generatePublicId() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `ICL-${stamp}-${rand}`
}

export async function createOrder(
  input: CreateOrderInput,
  files: OrderFile[] = [],
): Promise<OrderRecord> {
  const supabase = getSupabase()
  const publicId = generatePublicId()

  const { data, error } = await supabase
    .from('orders')
    .insert({
      public_id: publicId,
      user_id: input.userId ?? null,
      client_telegram: input.clientTelegram,
      service_id: input.serviceId ?? null,
      service_title: input.serviceTitle,
      platform: input.platform ?? null,
      quantity_label: input.quantityLabel ?? null,
      price: input.price ?? null,
      price_label: input.priceLabel ?? null,
      description: input.description,
      references_text: input.referencesText ?? '',
      links: input.links ?? [],
      files,
      meta: input.meta ?? {},
      status: 'new',
    })
    .select('*')
    .single()

  if (error || !data) {
    const msg = error?.message || 'Не удалось сохранить заявку'
    if (/fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(msg)) {
      throw new Error(
        'Не удалось подключиться к Supabase. Проверьте SUPABASE_URL в .env (должен быть https://xxxx.supabase.co) и что проект запущен.',
      )
    }
    if (/user_id|schema cache|profiles/i.test(msg)) {
      throw new Error(
        'В Supabase не применена миграция auth (нет колонки orders.user_id / таблицы profiles). Откройте SQL Editor и выполните файл supabase/migrations/002_auth_profiles.sql',
      )
    }
    throw new Error(msg)
  }

  await supabase.from('order_status_history').insert({
    order_id: data.id,
    status: 'new',
    note: 'Заявка создана',
  })

  return mapOrder(data)
}

export async function updateOrderFiles(orderId: string, files: OrderFile[]) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('orders')
    .update({ files, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message || 'Не удалось сохранить файлы заявки')
  return mapOrder(data as Record<string, unknown>)
}

export async function updateOrderTelegramResult(
  orderId: string,
  result: { sent: boolean; error?: string },
) {
  const supabase = getSupabase()
  await supabase
    .from('orders')
    .update({
      telegram_sent: result.sent,
      telegram_error: result.error ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
}

export async function listOrders(params: {
  search?: string
  sort?: string
  status?: string
}) {
  const supabase = getSupabase()
  let query = supabase.from('orders').select('*')

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.search?.trim()) {
    const q = params.search.trim()
    query = query.or(
      `public_id.ilike.%${q}%,client_telegram.ilike.%${q}%,service_title.ilike.%${q}%`,
    )
  }

  switch (params.sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'price_asc':
      query = query.order('price', { ascending: true, nullsFirst: false })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false, nullsFirst: false })
      break
    case 'status':
      query = query.order('status', { ascending: true }).order('created_at', { ascending: false })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapOrder(row as Record<string, unknown>))
}

export async function getOrderById(id: string) {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapOrder(data as Record<string, unknown>) : null
}

export async function getOrderHistory(orderId: string): Promise<OrderStatusHistory[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('order_status_history')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as OrderStatusHistory[]
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, note = '') {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message || 'Не удалось обновить статус')

  await supabase.from('order_status_history').insert({
    order_id: orderId,
    status,
    note: note || `Статус изменён на «${status}»`,
  })

  return mapOrder(data as Record<string, unknown>)
}

export async function deleteOrder(orderId: string) {
  const supabase = getSupabase()
  const order = await getOrderById(orderId)
  if (!order) return null

  const { rm } = await import('node:fs/promises')
  const { dirname } = await import('node:path')
  const { resolveLocalUploadPath } = await import('../services/storage.js')

  for (const file of order.files) {
    if (/^[0-9a-f-]{36}\//i.test(file.path)) {
      const [fileId, ...rest] = file.path.split('/')
      try {
        const diskFile = resolveLocalUploadPath(fileId, rest.join('/'))
        await rm(diskFile, { force: true })
        await rm(dirname(diskFile), { recursive: true, force: true })
      } catch {
        // ignore missing local files
      }
    } else if (file.path) {
      await supabase.storage.from('order-files').remove([file.path]).catch(() => undefined)
    }
  }

  const { error } = await supabase.from('orders').delete().eq('id', orderId)
  if (error) throw new Error(error.message)
  return order
}
