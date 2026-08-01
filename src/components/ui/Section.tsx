import type { ReactNode } from 'react'
import { SectionHeader } from './SectionHeader'
import { ScrollReveal } from './ScrollReveal'

interface SectionProps {
  id?: string
  eyebrow?: string
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
  headerAlign?: 'left' | 'center'
  revealContent?: boolean
}

export function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className = '',
  headerAlign = 'left',
  revealContent = true,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`relative scroll-mt-20 py-14 sm:py-20 lg:py-28 ${className}`}
    >
      <div className="container-icl">
        {title && (
          <ScrollReveal>
            <SectionHeader
              eyebrow={eyebrow}
              title={title}
              subtitle={subtitle}
              align={headerAlign}
            />
          </ScrollReveal>
        )}
        {revealContent ? (
          <ScrollReveal delay={80}>{children}</ScrollReveal>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
