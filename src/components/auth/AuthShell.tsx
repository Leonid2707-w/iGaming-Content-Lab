import { Link, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  showBack = false,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  showBack?: boolean
}) {
  const navigate = useNavigate()

  function handleBack() {
    const idx = (window.history.state as { idx?: number } | null)?.idx
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1)
      return
    }
    navigate('/')
  }

  return (
    <div className="relative min-h-screen bg-icl-bg text-icl-text">
      <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-60" />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col px-4 py-6 safe-pt safe-pb sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center gap-3 sm:mb-8">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-icl-border bg-icl-card text-icl-muted transition hover:bg-icl-surface-alt hover:text-icl-text"
              aria-label="Назад"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <Link to="/" className="inline-flex w-fit items-center">
            <BrandLogo className="h-8 sm:h-9" />
          </Link>
        </div>

        <div className="my-auto rounded-2xl border border-icl-border bg-icl-card p-5 shadow-card sm:rounded-[28px] sm:p-8">
          <h1 className="font-display text-xl font-semibold text-icl-text sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-icl-muted">{subtitle}</p>}
          <div className="mt-5 sm:mt-6">{children}</div>
          {footer && <div className="mt-5 border-t border-icl-border pt-4 text-sm text-icl-muted sm:mt-6 sm:pt-5">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
