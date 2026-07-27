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
      <header className="sticky top-0 z-40 border-b border-icl-border bg-icl-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <a href="/">
              <BrandLogo className="h-8" />
            </a>
            <span className="hidden rounded-full border border-icl-border px-3 py-1 text-xs font-medium text-icl-muted sm:inline">
              Личный кабинет
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-icl-muted md:inline">
              {profile?.full_name || profile?.email}
            </span>
            <ThemeToggle />
            <button
              type="button"
              onClick={async () => {
                await logout()
                navigate('/')
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-icl-border px-3 py-2 text-xs font-medium text-icl-muted transition hover:bg-icl-surface-alt hover:text-icl-text"
            >
              <LogOut size={14} />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
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
                  {item.label}
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
