import { features, notIcl } from '@/config/content/features'
import { Section } from '@/components/ui/Section'
import { Card } from '@/components/ui/Card'

export function Features() {
  return (
    <Section
      eyebrow="Почему iCL"
      title="Контент без рутины для iGaming"
      subtitle="На создание и публикацию контента уходит время, которое можно потратить на трафик. iCL решает эту проблему."
      className="section-light"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {features.map((feature, index) => (
          <Card key={feature.title} hover className="group">
            <div className="flex gap-5">
              <div className="interactive-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-icl-accent font-display text-sm font-bold text-white shadow-soft">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div>
                <h3 className="mb-2 font-display text-lg font-semibold text-icl-text">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-icl-muted">{feature.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="interactive-glow mt-8 overflow-hidden rounded-2xl border border-icl-border bg-icl-card p-5 shadow-card sm:p-8">
        <h3 className="mb-4 font-display text-lg font-semibold text-icl-text sm:mb-5">
          Чем iCL не является
        </h3>
        <ul className="grid gap-3 sm:grid-cols-3">
          {notIcl.map((item) => (
            <li
              key={item}
              className="interactive-glow flex items-start gap-3 rounded-xl border border-icl-border bg-icl-surface-alt px-3 py-3 text-sm text-icl-muted hover:-translate-y-0.5 sm:px-4"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs text-red-400">
                ×
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
