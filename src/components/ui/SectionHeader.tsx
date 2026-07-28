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
    <div className={`mb-8 max-w-2xl sm:mb-12 lg:mb-14 ${alignClass} ${className}`}>
      {eyebrow && (
        <div className={`mb-3 sm:mb-4 ${align === 'center' ? 'flex justify-center' : ''}`}>
          <Badge variant={dark ? 'dark' : 'default'}>{eyebrow}</Badge>
        </div>
      )}
      <h2 className="text-[1.65rem] font-bold tracking-tight text-icl-text sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-base leading-relaxed text-icl-muted sm:mt-5 sm:text-lg">
          {subtitle}
        </p>
      )}
      <div
        className={`mt-4 h-1 w-12 rounded-full bg-icl-accent sm:mt-6 ${
          align === 'center' ? 'mx-auto' : ''
        }`}
        aria-hidden="true"
      />
    </div>
  )
}
