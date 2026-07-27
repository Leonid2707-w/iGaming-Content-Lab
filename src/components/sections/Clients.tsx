import { audience } from '@/config/content/features'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function Clients() {
  return (
    <section className="relative border-y border-icl-border bg-icl-surface py-12">
      <div className="container-icl">
        <ScrollReveal>
          <p className="mb-8 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-icl-subtle">
            Для кого iCL
          </p>
        </ScrollReveal>
        <ScrollReveal delay={100} variant="scale">
          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {audience.map((item) => (
              <li
                key={item}
                className="interactive-glow rounded-full border border-icl-border bg-icl-card px-5 py-2 text-sm font-medium text-icl-muted hover:-translate-y-1 hover:text-icl-text"
              >
                {item}
              </li>
            ))}
          </ul>
        </ScrollReveal>
      </div>
    </section>
  )
}
