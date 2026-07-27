import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Search } from 'lucide-react'
import {
  ORDER_STATUS_LABELS,
  deleteAdminOrder,
  fetchAdminOrders,
  type OrderDto,
  type OrderStatus,
} from '@/api/orders'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/FormField'
import { useAdminAuth } from '@/context/AdminAuthContext'

function formatDate(value: string) {
  return new Date(value).toLocaleString('ru-RU')
}

function statusClass(status: OrderStatus) {
  switch (status) {
    case 'new':
      return 'bg-sky-500/10 text-sky-500'
    case 'in_progress':
      return 'bg-amber-500/10 text-amber-500'
    case 'done':
      return 'bg-emerald-500/10 text-emerald-500'
    case 'cancelled':
      return 'bg-red-500/10 text-red-500'
    default:
      return 'bg-icl-surface-alt text-icl-muted'
  }
}

export function AdminOrdersPage() {
  const { apiToken, openLoginModal, logout } = useAdminAuth()
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!apiToken) {
      setError('Нужно войти заново, чтобы получить доступ к заявкам.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await fetchAdminOrders(apiToken, { search, sort, status })
      setOrders(result.orders || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки заявок')
    } finally {
      setLoading(false)
    }
  }, [apiToken, search, sort, status])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 250)
    return () => window.clearTimeout(timer)
  }, [load])

  const counts = useMemo(() => {
    return {
      total: orders.length,
      new: orders.filter((item) => item.status === 'new').length,
    }
  }, [orders])

  async function handleDelete(order: OrderDto) {
    if (!apiToken) return
    if (!window.confirm(`Удалить заявку ${order.public_id}?`)) return
    try {
      await deleteAdminOrder(apiToken, order.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить заявку')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-icl-text">Заявки</h1>
          <p className="mt-2 text-sm text-icl-muted">
            Всего: {counts.total}. Новых: {counts.new}.
          </p>
        </div>
        <Button type="button" variant="outline-dark" onClick={() => void load()}>
          <RefreshCw size={14} />
          Обновить
        </Button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-icl-border bg-icl-card p-4 sm:grid-cols-3">
        <label className="relative sm:col-span-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-icl-subtle" />
          <input
            className={`${inputClass} !pl-9`}
            placeholder="Поиск: ID, Telegram, услуга"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select className={inputClass} value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
          <option value="price_desc">По стоимости ↓</option>
          <option value="price_asc">По стоимости ↑</option>
          <option value="status">По статусу</option>
        </select>
        <select
          className={inputClass}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">Все статусы</option>
          <option value="new">Новая</option>
          <option value="in_progress">В работе</option>
          <option value="done">Выполнена</option>
          <option value="cancelled">Отменена</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">
          <p>{error}</p>
          {!apiToken && (
            <button
              type="button"
              className="mt-3 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium transition hover:bg-red-500/10"
              onClick={() => {
                logout()
                openLoginModal()
              }}
            >
              Войти снова
            </button>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-icl-border bg-icl-card">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-icl-border bg-icl-surface text-xs uppercase tracking-[0.12em] text-icl-subtle">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Дата</th>
                <th className="px-4 py-3 font-semibold">Клиент</th>
                <th className="px-4 py-3 font-semibold">Услуга</th>
                <th className="px-4 py-3 font-semibold">Стоимость</th>
                <th className="px-4 py-3 font-semibold">Статус</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-icl-muted">
                    Загрузка…
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-icl-muted">
                    Заявок пока нет
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-icl-border/70 last:border-0">
                    <td className="px-4 py-3 font-medium text-icl-text">{order.public_id}</td>
                    <td className="px-4 py-3 text-icl-muted">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-icl-text">{order.client_telegram}</td>
                    <td className="px-4 py-3 text-icl-muted">{order.service_title}</td>
                    <td className="px-4 py-3 text-icl-text">
                      {order.price_label || (order.price != null ? `${order.price}$` : '—')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(order.status)}`}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="rounded-lg border border-icl-border px-3 py-1.5 text-xs font-medium text-icl-muted transition hover:bg-icl-surface-alt hover:text-icl-text"
                        >
                          Открыть
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDelete(order)}
                          className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-500/10"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
