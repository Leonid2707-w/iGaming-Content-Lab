import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Clapperboard,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { useEffect } from 'react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { clsx } from 'clsx'

const nav = [
  { to: '/admin', label: 'Обзор', icon: LayoutDashboard, end: true },
  { to: '/admin/stats', label: 'Статистика', icon: BarChart3 },
  { to: '/admin/services', label: 'Услуги', icon: Package },
  { to: '/admin/portfolio', label: 'Примеры работ', icon: Clapperboard },
  { to: '/admin/users', label: 'Пользователи', icon: Users },
  { to: '/admin/orders', label: 'Заявки', icon: ShoppingBag },
  { to: '/admin/content', label: 'Контент', icon: FileText, soon: true },
  { to: '/admin/settings', label: 'Настройки', icon: Settings, soon: true },
]

export function AdminLayout() {
  const { isAuthenticated, openLoginModal, logout } = useAdminAuth()
  const navigate = useNavigate()

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
          <div className="flex items-center gap-4">
            <BrandLogo className="h-8" />
            <span className="hidden rounded-full border border-icl-border px-3 py-1 text-xs font-medium text-icl-muted sm:inline">
              Админ-панель
            </span>
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
            {nav.map((item) => {
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
                  {'soon' in item && item.soon ? (
                    <span className="rounded-full bg-icl-surface-alt px-2 py-0.5 text-[10px] uppercase tracking-wide text-icl-subtle">
                      Скоро
                    </span>
                  ) : null}
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
