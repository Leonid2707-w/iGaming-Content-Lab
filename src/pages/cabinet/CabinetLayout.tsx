import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ClipboardList, LogOut, UserRound } from 'lucide-react'
import { clsx } from 'clsx'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { useAuth } from '@/context/AuthContext'

const nav = [
  { to: '/cabinet', label: 'Профиль', icon: UserRound, end: true },
  { to: '/cabinet/orders', label: 'Мои заказы', icon: ClipboardList, end: false },
]

export function CabinetLayout() {
  return (
    <RequireAuth>
      <CabinetShell />
    </RequireAuth>
  )
}

function CabinetShell() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-icl-bg text-icl-text">
      <header className="safe-pt sticky top-0 z-40 border-b border-icl-border bg-icl-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <a href="/" className="shrink-0">
              <BrandLogo className="h-7 sm:h-8" />
            </a>
            <span className="hidden truncate rounded-full border border-icl-border px-3 py-1 text-xs font-medium text-icl-muted sm:inline">
              Личный кабинет
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden max-w-[10rem] truncate text-sm text-icl-muted md:inline">
              {profile?.full_name || 'Кабинет'}
            </span>
            <ThemeToggle />
            <button
              type="button"
              onClick={async () => {
                await logout()
                navigate('/')
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-icl-border px-3 py-2 text-xs font-medium text-icl-muted transition hover:bg-icl-surface-alt hover:text-icl-text"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-2xl border border-icl-border bg-icl-card p-2 sm:p-3">
          <nav className="flex gap-1 sm:flex-col sm:space-y-1 sm:gap-0">
            {nav.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    clsx(
                      'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition sm:flex-none sm:justify-start sm:gap-3',
                      isActive
                        ? 'bg-icl-accent-soft text-icl-accent'
                        : 'text-icl-muted hover:bg-icl-surface-alt hover:text-icl-text',
                    )
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </aside>
        <main className="min-w-0 pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
