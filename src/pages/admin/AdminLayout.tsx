import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Clapperboard,
  LayoutDashboard,
  LogOut,
  Package,
  Shield,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAdminAuth } from '@/context/AdminAuthContext'
import type { AdminPermission } from '@/config/adminPermissions'
import { clsx } from 'clsx'

const nav: {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  anyOf: AdminPermission[]
  ownerOnly?: boolean
}[] = [
  {
    to: '/admin',
    label: 'Обзор',
    icon: LayoutDashboard,
    end: true,
    anyOf: [
      'orders.view',
      'services.list',
      'services.prices',
      'analytics.visits',
      'analytics.orders',
    ],
  },
  {
    to: '/admin/stats',
    label: 'Статистика',
    icon: BarChart3,
    anyOf: [
      'analytics.visits',
      'analytics.orders',
      'analytics.registrations',
      'analytics.finance',
    ],
  },
  {
    to: '/admin/services',
    label: 'Услуги',
    icon: Package,
    anyOf: ['services.prices', 'services.units', 'services.list'],
  },
  {
    to: '/admin/portfolio',
    label: 'Примеры работ',
    icon: Clapperboard,
    anyOf: ['site.examples', 'site.videos', 'site.images'],
  },
  {
    to: '/admin/users',
    label: 'Пользователи',
    icon: Users,
    anyOf: ['users.view', 'users.block', 'users.delete'],
  },
  {
    to: '/admin/orders',
    label: 'Заявки',
    icon: ShoppingBag,
    anyOf: ['orders.view', 'orders.status', 'orders.delete'],
  },
  {
    to: '/admin/admins',
    label: 'Администраторы',
    icon: Shield,
    anyOf: ['admins.create', 'admins.delete', 'admins.permissions'],
  },
]

export function AdminLayout() {
  const { isAuthenticated, openLoginModal, logout, canAny, isOwner, admin } = useAdminAuth()
  const navigate = useNavigate()

  const visibleNav = useMemo(
    () =>
      nav.filter((item) => {
        if (isOwner) return true
        return canAny(...item.anyOf)
      }),
    [canAny, isOwner],
  )

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex,nofollow'
    document.head.appendChild(meta)
    return () => {
      meta.remove()
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) openLoginModal()
  }, [isAuthenticated, openLoginModal])

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-icl-bg px-4 text-center text-icl-muted">
        <p>Требуется авторизация администратора.</p>
        <p className="max-w-sm text-sm text-icl-subtle">
          Это служебный вход (не кабинет клиента). Нажмите кнопку ниже или используйте горячую
          клавишу Ctrl+Shift+H.
        </p>
        <button
          type="button"
          onClick={() => openLoginModal()}
          className="rounded-xl bg-icl-accent px-5 py-2.5 text-sm font-medium text-white"
        >
          Войти как администратор
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-sm text-icl-accent hover:underline"
        >
          На главную
        </button>
      </div>
    )
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-icl-bg text-icl-text">
      <header className="sticky top-0 z-40 border-b border-icl-border bg-icl-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <BrandLogo className="h-8" />
            <span className="hidden rounded-full border border-icl-border px-3 py-1 text-xs font-medium text-icl-muted sm:inline">
              Админ-панель
            </span>
            {admin ? (
              <span className="truncate text-xs text-icl-subtle">
                {admin.displayName || admin.login}
                {isOwner ? ' · Владелец' : ''}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => navigate('/')}
              className="hidden rounded-xl border border-icl-border px-3 py-2 text-xs font-medium text-icl-muted transition hover:bg-icl-surface-alt hover:text-icl-text sm:inline"
            >
              На сайт
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-icl-border px-3 py-2 text-xs font-medium text-icl-muted transition hover:bg-icl-surface-alt hover:text-icl-text"
            >
              <LogOut size={14} />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-2xl border border-icl-border bg-icl-card p-3">
          <nav className="space-y-1">
            {visibleNav.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'bg-icl-accent-soft text-icl-accent'
                        : 'text-icl-muted hover:bg-icl-surface-alt hover:text-icl-text',
                    )
                  }
                >
                  <Icon size={16} />
                  <span className="flex-1">{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
