import { Link, type LinkProps } from 'react-router-dom'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'outline' | 'outline-dark' | 'ghost' | 'gold'

interface BaseProps {
  variant?: ButtonVariant
  className?: string
  children?: React.ReactNode
}

type ButtonAsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined
    to?: undefined
  }

type ButtonAsAnchor = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string
    to?: undefined
  }

type ButtonAsLink = BaseProps &
  Omit<LinkProps, 'className'> & {
    to: string
    href?: undefined
  }

type ButtonProps = ButtonAsButton | ButtonAsAnchor | ButtonAsLink

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-icl-accent text-white shadow-soft hover:bg-icl-accent-hover hover:shadow-glow border border-transparent',
  outline:
    'border border-icl-border text-icl-text bg-icl-card/50 hover:bg-icl-surface-alt hover:border-icl-accent/50 hover:shadow-glow backdrop-blur-sm',
  'outline-dark':
    'border border-icl-border text-icl-text bg-icl-card hover:border-icl-accent/50 hover:shadow-glow',
  ghost:
    'text-icl-muted hover:bg-icl-surface-alt hover:text-icl-text border border-transparent',
  gold:
    'bg-icl-accent text-white font-semibold shadow-soft hover:bg-icl-accent-hover hover:shadow-glow border border-transparent',
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-500 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-icl-accent/20 disabled:pointer-events-none disabled:opacity-60 disabled:hover:translate-y-0 ${variants[variant]} ${className}`

  if ('to' in props && props.to) {
    const { to, ...rest } = props
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }

  if ('href' in props && props.href) {
    const { href, ...rest } = props
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    )
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>

  return (
    <button
      {...buttonProps}
      type={buttonProps.type ?? 'button'}
      className={classes}
    >
      {children}
    </button>
  )
}
