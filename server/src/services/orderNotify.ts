import { getOrderById, updateOrderTelegramResult } from '../db/orders.js'
import { syncOrderToSheets } from './googleSheets.js'
import { sendTelegramOrderNotification } from './telegram.js'

export async function notifyOrder(orderId: string) {
  let order = await getOrderById(orderId)
  if (!order) throw new Error('Заявка не найдена')
  const telegram = await sendTelegramOrderNotification(order)
  order = await updateOrderTelegramResult(order.id, {
    sent: telegram.ok,
    error: telegram.error,
  })
  if (!telegram.ok) console.warn('[orders.telegram]', telegram.error)
  void syncOrderToSheets(order)
  return { order, telegram }
}
