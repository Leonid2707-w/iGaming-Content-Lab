import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { navLinks } from '@/config/navigation'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { IconClose, IconMenu } from '@/components/icons'
import { useAuth } from '@/context/AuthContext'
import { useOrderModal } from '@/context/OrderModalContext'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { openOrder } = useOrderModal()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function closeMobile() {
    setMobileOpen(false)
  }

  const accountHref = isAuthenticated ? '/cabinet' : '/login'
  const accountLabel = isAuthenticated ? 'Кабинет' : 'Войти'

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-icl-border bg-icl-bg/90 shadow-soft backdrop-blur-xl'
          : 'border-b border-transparent bg-icl-bg/70 backdrop-blur-md'
      }`}
    >
      <div className="container-icl flex h-[4.25rem] items-center justify-between">
        <Link to="/" className="group flex items-center">
          <BrandLogo className="h-8 transition duration-300 group-hover:scale-[1.03] sm:h-9" />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-8 lg:flex">
          <ul className="flex gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="nav-link"
                  onClick={(event) => {
                    if (link.href === '/#order') {
                      event.preventDefault()
                      openOrder()
                    }
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <ThemeToggle />
          {!loading && (
            <Button to={accountHref} variant="outline-dark" className="!px-4 !py-2 !text-xs">
              {accountLabel}
            </Button>
          )}
          <Button onClick={() => openOrder()} className="!px-5 !py-2 !text-xs">
            Заказать
          </Button>
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-icl-border text-icl-text transition hover:bg-icl-surface-alt lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <IconClose /> : <IconMenu />}
        </button>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-icl-border bg-icl-surface/95 px-4 py-5 backdrop-blur-xl lg:hidden"
        >
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(event) => {
                    if (link.href === '/#order') {
                      event.preventDefault()
                      openOrder()
                    }
                    closeMobile()
                  }}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-icl-muted transition hover:bg-icl-surface-alt hover:text-icl-text"
                >
                  {link.label}
                </a>
              </li>
            ))}
            {!loading && (
              <li>
                <Link
                  to={accountHref}
                  onClick={closeMobile}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-icl-muted transition hover:bg-icl-surface-alt hover:text-icl-text"
                >
                  {accountLabel}
                </Link>
              </li>
            )}
          </ul>
          <div className="mt-4 flex items-center gap-3 px-1">
            <ThemeToggle />
            <Button
              className="flex-1"
              onClick={() => {
                openOrder()
                closeMobile()
              }}
            >
              Заказать
            </Button>
          </div>
        </nav>
      )}
    </header>
  )
}
