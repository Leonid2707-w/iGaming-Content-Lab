import { Badge } from './Badge'

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  dark?: boolean
  className?: string
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  dark = false,
  className = '',
}: SectionHeaderProps) {
  const alignClass = align === 'center' ? 'mx-auto text-center' : ''

  return (
    <div className={`mb-14 max-w-2xl ${alignClass} ${className}`}>
      {eyebrow && (
        <div className={`mb-4 ${align === 'center' ? 'flex justify-center' : ''}`}>
          <Badge variant={dark ? 'dark' : 'default'}>{eyebrow}</Badge>
        </div>
      )}
      <h2
        className="text-3xl font-bold tracking-tight text-icl-text sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 text-lg leading-relaxed text-icl-muted">
          {subtitle}
        </p>
      )}
      <div
        className={`mt-6 h-1 w-12 rounded-full bg-icl-accent ${
          align === 'center' ? 'mx-auto' : ''
        }`}
        aria-hidden="true"
      />
    </div>
  )
}
