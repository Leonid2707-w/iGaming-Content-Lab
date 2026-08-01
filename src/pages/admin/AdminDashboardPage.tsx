import { Link } from 'react-router-dom'
import {
  BarChart3,
  Clapperboard,
  Package,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { AdminAuthError, fetchAdminOrders, type OrderDto } from '@/api/orders'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { useServices } from '@/context/ServicesContext'

const cards = [
  {
    to: '/admin/stats',
    title: 'Статистика',
    description: 'Посещения, уникальные визиты, заказы и графики по датам.',
    icon: BarChart3,
  },
  {
    to: '/admin/services',
    title: 'Управление услугами',
    description: 'Цены, описания, включение и выключение услуг.',
    icon: Package,
  },
  {
    to: '/admin/portfolio',
    title: 'Примеры работ',
    description: 'Видео-примеры и тарифы для видеокреативов.',
    icon: Clapperboard,
  },
  {
    to: '/admin/users',
    title: 'Пользователи',
    description: 'Поиск, профили, блокировка аккаунтов.',
    icon: Users,
  },
  {
    to: '/admin/orders',
    title: 'Управление заявками',
    description: 'Просмотр заказов и статусы.',
    icon: ShoppingBag,
  },
]

export function AdminDashboardPage() {
  const { services, enabledServices } = useServices()
  const { apiToken, logout, openLoginModal } = useAdminAuth()
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [ordersError, setOrdersError] = useState('')

  useEffect(() => {
    if (!apiToken) return
    let cancelled = false
    void (async () => {
      try {
        const result = await fetchAdminOrders(apiToken, { sort: 'newest' })
        if (!cancelled) {
          setOrders(result.orders || [])
          setOrdersError('')
        }
      } catch (error) {
        if (cancelled) return
        if (error instanceof AdminAuthError) {
          logout()
          openLoginModal()
          setOrdersError('Сессия истекла — войдите снова.')
          return
        }
        setOrdersError(error instanceof Error ? error.message : 'Не удалось загрузить заявки')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiToken, logout, openLoginModal])

  const newOrders = orders.filter((item) => item.status === 'new').length
  const inProgress = orders.filter((item) => item.status === 'in_progress').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-icl-text">Обзор</h1>
        <p className="mt-2 text-sm text-icl-muted">
          Сводка по услугам и актуальным заявкам.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-icl-subtle">Услуг активны</p>
          <p className="mt-2 font-display text-3xl font-semibold text-icl-accent">
            {enabledServices.length}
          </p>
          <p className="mt-1 text-xs text-icl-muted">из {services.length}</p>
        </div>
        <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-icl-subtle">Заявок всего</p>
          <p className="mt-2 font-display text-3xl font-semibold text-icl-text">{orders.length}</p>
        </div>
        <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-icl-subtle">Новые</p>
          <p className="mt-2 font-display text-3xl font-semibold text-sky-500">{newOrders}</p>
        </div>
        <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-icl-subtle">В работе</p>
          <p className="mt-2 font-display text-3xl font-semibold text-amber-500">{inProgress}</p>
        </div>
      </div>

      {ordersError ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500" role="alert">
          {ordersError}
        </p>
      ) : null}

      <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-icl-text">Последние заявки</h2>
          <Link to="/admin/orders" className="text-sm text-icl-accent hover:underline">
            Все заявки
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-icl-muted">Заявок пока нет.</p>
        ) : (
          <ul className="divide-y divide-icl-border">
            {orders.slice(0, 5).map((order) => (
              <li key={order.id}>
                <Link
                  to={`/admin/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm transition hover:text-icl-accent"
                >
                  <span className="font-medium text-icl-text">{order.public_id}</span>
                  <span className="text-icl-muted">{order.service_title}</span>
                  <span className="text-icl-subtle">{order.client_telegram}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.to}
              to={card.to}
              className="rounded-2xl border border-icl-border bg-icl-card p-5 transition hover:border-icl-accent/40 hover:shadow-card"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-icl-accent-soft text-icl-accent">
                <Icon size={18} />
              </div>
              <h2 className="font-display text-lg font-semibold text-icl-text">{card.title}</h2>
              <p className="mt-2 text-sm text-icl-muted">{card.description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
