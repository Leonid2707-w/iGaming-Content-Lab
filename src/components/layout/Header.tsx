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

  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileOpen])

  function closeMobile() {
    setMobileOpen(false)
  }

  const accountHref = isAuthenticated ? '/cabinet' : '/login'
  const accountLabel = isAuthenticated ? 'Кабинет' : 'Войти'

  return (
    <header
      className={`safe-pt sticky top-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen
          ? 'border-b border-icl-border bg-icl-bg/95 shadow-soft backdrop-blur-xl'
          : 'border-b border-transparent bg-icl-bg/70 backdrop-blur-md'
      }`}
    >
      <div className="container-icl flex h-14 items-center justify-between gap-3 sm:h-[4.25rem]">
        <Link to="/" className="group flex min-w-0 items-center" onClick={closeMobile}>
          <BrandLogo className="h-7 transition duration-300 group-hover:scale-[1.03] sm:h-9" />
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

        <div className="flex items-center gap-2 lg:hidden">
          {!loading && (
            <Button
              to={accountHref}
              variant="ghost"
              className="!px-3 !py-2 !text-xs"
              onClick={closeMobile}
            >
              {accountLabel}
            </Button>
          )}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-icl-border text-icl-text transition hover:bg-icl-surface-alt"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="safe-pb max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-icl-border bg-icl-surface/98 px-4 py-4 backdrop-blur-xl lg:hidden"
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
                  className="block rounded-xl px-4 py-3.5 text-base font-medium text-icl-text transition hover:bg-icl-surface-alt"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-3 border-t border-icl-border px-1 pt-4">
            <ThemeToggle />
            <Button
              className="min-h-11 flex-1"
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
