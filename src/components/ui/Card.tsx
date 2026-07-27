import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  variant?: 'default' | 'glass' | 'dark' | 'neon'
}

const variants = {
  default: 'card-premium',
  glass: 'glass rounded-2xl shadow-soft',
  dark: 'rounded-2xl border border-icl-border bg-icl-surface shadow-soft backdrop-blur-sm',
  neon: 'rounded-2xl border border-icl-accent/20 bg-icl-card shadow-elevated',
}

export function Card({ children, className = '', hover = false, variant = 'default' }: CardProps) {
  return (
    <div
      className={`p-6 ${variants[variant]} ${
        hover ? 'card-premium-hover interactive-card cursor-default' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
