import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'dark' | 'gold' | 'neon'
  className?: string
}

const variants = {
  default: 'border-icl-accent/30 bg-icl-accent/10 text-icl-accent',
  dark: 'border-icl-border bg-icl-card text-icl-muted',
  gold: 'border-icl-accent/30 bg-icl-accent/10 text-icl-accent',
  neon: 'border-icl-accent/30 bg-icl-accent/10 text-icl-accent',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
