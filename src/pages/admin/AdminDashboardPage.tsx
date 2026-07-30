import { Link } from 'react-router-dom'
import {
  BarChart3,
  Clapperboard,
  FileText,
  Package,
  Settings,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { useServices } from '@/context/ServicesContext'

const cards = [
  {
    to: '/admin/stats',
    title: 'Статистика',
    description: 'Посещения, уникальные визиты, заказы и графики по датам.',
    icon: BarChart3,
    ready: true,
  },
  {
    to: '/admin/services',
    title: 'Управление услугами',
    description: 'Цены, описания, включение и выключение услуг.',
    icon: Package,
    ready: true,
  },
  {
    to: '/admin/portfolio',
    title: 'Примеры работ',
    description: 'Видео-примеры и тарифы для видеокреативов.',
    icon: Clapperboard,
    ready: true,
  },
  {
    to: '/admin/users',
    title: 'Пользователи',
    description: 'Поиск, профили, блокировка аккаунтов.',
    icon: Users,
    ready: true,
  },
  {
    to: '/admin/content',
    title: 'Управление контентом',
    description: 'Тексты сайта, блоки и преимущества.',
    icon: FileText,
    ready: false,
  },
  {
    to: '/admin/orders',
    title: 'Управление заявками',
    description: 'Просмотр заказов и статусы.',
    icon: ShoppingBag,
    ready: true,
  },
  {
    to: '/admin/settings',
    title: 'Настройки сайта',
    description: 'Тема, контакты и ссылки.',
    icon: Settings,
    ready: false,
  },
]

export function AdminDashboardPage() {
  const { services, enabledServices } = useServices()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-icl-text">Обзор</h1>
        <p className="mt-2 text-sm text-icl-muted">
          Служебная панель iCL. Разделы без ТЗ пока в каркасе.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-icl-subtle">Услуг всего</p>
          <p className="mt-2 font-display text-3xl font-semibold text-icl-text">{services.length}</p>
        </div>
        <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-icl-subtle">Активны</p>
          <p className="mt-2 font-display text-3xl font-semibold text-icl-accent">
            {enabledServices.length}
          </p>
        </div>
        <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-icl-subtle">Скрыты</p>
          <p className="mt-2 font-display text-3xl font-semibold text-icl-text">
            {services.length - enabledServices.length}
          </p>
        </div>
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
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-icl-accent-soft text-icl-accent">
                  <Icon size={18} />
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    card.ready
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-icl-surface-alt text-icl-subtle'
                  }`}
                >
                  {card.ready ? 'Готово' : 'Скоро'}
                </span>
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
