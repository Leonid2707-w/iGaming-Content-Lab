import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { BrandLogo } from '@/components/ui/BrandLogo'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-icl-bg text-icl-text">
      <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-60" />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8 sm:px-6">
        <Link to="/" className="mb-8 inline-flex w-fit items-center">
          <BrandLogo className="h-8 sm:h-9" />
        </Link>

        <div className="my-auto rounded-[28px] border border-icl-border bg-icl-card p-6 shadow-card sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-icl-text">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-icl-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 border-t border-icl-border pt-5 text-sm text-icl-muted">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
