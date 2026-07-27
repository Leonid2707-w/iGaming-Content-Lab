import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { useOrderModal } from '@/context/OrderModalContext'

interface CabinetOrder {
  id: string
  public_id: string
  service_title: string
  price: number | null
  price_label: string | null
  status: string
  created_at: string
}

const statusLabel: Record<string, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  done: 'Выполнена',
  cancelled: 'Отменена',
}

export function CabinetOrdersPage() {
  const { accessToken } = useAuth()
  const { openOrder } = useOrderModal()
  const [orders, setOrders] = useState<CabinetOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch('/api/auth/orders', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const data = (await response.json()) as {
          ok: boolean
          orders?: CabinetOrder[]
          error?: string
        }
        if (cancelled) return
        if (!data.ok) {
          setError(data.error || 'Не удалось загрузить заказы')
          setOrders([])
        } else {
          setOrders(data.orders || [])
        }
      } catch {
        if (!cancelled) setError('Не удалось загрузить заказы')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [accessToken])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-icl-text">Мои заказы</h1>
          <p className="mt-2 text-sm text-icl-muted">
            Заявки, оформленные из вашего аккаунта.
          </p>
        </div>
        <Button type="button" onClick={() => openOrder()}>
          Новый заказ
        </Button>
      </div>

      {loading && <p className="text-sm text-icl-muted">Загрузка заказов…</p>}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="rounded-2xl border border-icl-border bg-icl-card p-8 text-center">
          <p className="text-sm text-icl-muted">Пока нет заказов, связанных с аккаунтом.</p>
          <button
            type="button"
            onClick={() => openOrder()}
            className="mt-3 inline-block text-sm font-medium text-icl-accent hover:underline"
          >
            Оформить первый заказ
          </button>
        </div>
      )}

      {orders.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-icl-border bg-icl-card">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-icl-border text-xs uppercase tracking-[0.08em] text-icl-subtle">
              <tr>
                <th className="px-4 py-3 font-semibold">Номер</th>
                <th className="px-4 py-3 font-semibold">Услуга</th>
                <th className="px-4 py-3 font-semibold">Стоимость</th>
                <th className="px-4 py-3 font-semibold">Дата</th>
                <th className="px-4 py-3 font-semibold">Статус</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-icl-border/70 last:border-0">
                  <td className="px-4 py-3 font-medium text-icl-text">{order.public_id}</td>
                  <td className="px-4 py-3 text-icl-muted">{order.service_title}</td>
                  <td className="px-4 py-3 text-icl-muted">
                    {order.price_label || (order.price != null ? `${order.price}$` : '—')}
                  </td>
                  <td className="px-4 py-3 text-icl-muted">
                    {new Date(order.created_at).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-icl-accent-soft px-2.5 py-1 text-xs font-medium text-icl-accent">
                      {statusLabel[order.status] || order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
