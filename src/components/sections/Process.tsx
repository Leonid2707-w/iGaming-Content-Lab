import { orderTypes, processSteps } from '@/config/content/process'
import { Section } from '@/components/ui/Section'
import { Card } from '@/components/ui/Card'

export function Process() {
  return (
    <Section
      id="process"
      eyebrow="Как работает iCL"
      title="Два типа заказа — один процесс производства"
      subtitle="Стандартные услуги оформляются с фиксированной ценой. Нестандартные — через заявку с согласованием."
      className="section-muted"
    >
      <div className="mb-14 grid gap-5 sm:grid-cols-2">
        {orderTypes.map((type, i) => (
          <Card
            key={type.title}
            hover
            className="border-icl-accent/20"
          >
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-icl-subtle">
              {i === 0 ? 'Вариант A' : 'Вариант B'}
            </p>
            <h3 className="mb-2 font-display text-lg font-semibold text-icl-text">
              {type.title}
            </h3>
            <p className="text-sm leading-relaxed text-icl-muted">{type.description}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {processSteps.map((step) => (
          <div
            key={step.step}
            className="card-premium interactive-card group p-6"
          >
            <span className="interactive-icon mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-icl-accent-soft font-display text-sm font-bold text-icl-accent group-hover:bg-icl-accent group-hover:text-white">
              {step.step}
            </span>
            <h3 className="mb-2 font-display font-semibold text-icl-text">{step.title}</h3>
            <p className="text-sm leading-relaxed text-icl-muted">{step.description}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
