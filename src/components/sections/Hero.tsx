import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { clientBenefits } from '@/config/content/stats'
import { siteConfig } from '@/config/site'
import { useOrderModal } from '@/context/OrderModalContext'
import { HeroVisual } from '@/components/sections/HeroVisual'

export function Hero() {
  const { openOrder } = useOrderModal()

  return (
    <section className="relative overflow-hidden bg-icl-bg text-icl-text">
      <div className="pointer-events-none absolute inset-0 bg-mesh-dark" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-60" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-icl-accent/[0.07] blur-[120px]"
        aria-hidden="true"
      />

      <div className="container-icl relative py-20 lg:py-28">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <ScrollReveal className="max-w-xl" variant="left">
            <Badge className="mb-6">iGaming Content Lab</Badge>

            <h1 className="mb-6 font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              Забираем контент на себя —{' '}
              <span className="text-gradient">вы масштабируетесь</span>
            </h1>

            <p className="mb-5 text-lg leading-relaxed text-icl-muted">
              {siteConfig.description}
            </p>

            <p className="mb-10 flex items-center gap-2 text-sm text-icl-subtle">
              <CheckCircle2 size={16} className="text-icl-accent" />
              Производство контента для вебмастеров и команд в iGaming.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button onClick={() => openOrder()}>
                Оформить заказ
                <ArrowRight size={16} />
              </Button>
              <Button href="/#services" variant="outline-dark">
                Смотреть услуги
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal className="mx-auto w-full max-w-xl lg:max-w-none" delay={120} variant="right">
            <HeroVisual />
          </ScrollReveal>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-4 border-t border-icl-border pt-10 sm:grid-cols-4">
          {clientBenefits.map((item, index) => (
            <ScrollReveal key={item.label} delay={160 + index * 80} variant="scale">
              <dl className="interactive-card h-full rounded-2xl border border-icl-border bg-icl-card/70 px-5 py-4 backdrop-blur-sm">
                <dt className="font-display text-sm font-semibold text-icl-text sm:text-base">
                  {item.value}
                </dt>
                <dd className="mt-1 text-xs text-icl-muted sm:text-sm">{item.label}</dd>
              </dl>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
