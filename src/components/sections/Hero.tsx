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
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[min(100%,640px)] -translate-x-1/2 rounded-full bg-icl-accent/[0.07] blur-[100px]"
        aria-hidden="true"
      />

      <div className="container-icl relative py-12 sm:py-20 lg:py-28">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <ScrollReveal className="max-w-xl" variant="left">
            <Badge className="mb-4 sm:mb-6">iGaming Content Lab</Badge>

            <h1 className="mb-4 font-display text-[1.85rem] font-bold leading-[1.12] tracking-tight sm:mb-6 sm:text-5xl lg:text-[3.25rem]">
              Забираем контент на себя —{' '}
              <span className="text-gradient">вы масштабируетесь</span>
            </h1>

            <p className="mb-4 text-base leading-relaxed text-icl-muted sm:mb-5 sm:text-lg">
              {siteConfig.description}
            </p>

            <p className="mb-7 flex items-start gap-2 text-sm text-icl-subtle sm:mb-10 sm:items-center">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-icl-accent sm:mt-0" />
              Производство контента для вебмастеров и команд в iGaming.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Button onClick={() => openOrder()} className="min-h-11 w-full sm:w-auto">
                Оформить заказ
                <ArrowRight size={16} />
              </Button>
              <Button href="/#services" variant="outline-dark" className="min-h-11 w-full sm:w-auto">
                Смотреть услуги
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal className="mx-auto w-full max-w-md sm:max-w-xl lg:max-w-none" delay={120} variant="right">
            <HeroVisual />
          </ScrollReveal>
        </div>

        <div className="-mx-4 mt-12 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mt-20 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:border-t sm:border-icl-border sm:px-0 sm:pb-0 sm:pt-10">
          {clientBenefits.map((item, index) => (
            <ScrollReveal
              key={item.label}
              delay={160 + index * 80}
              variant="scale"
              className="w-[72%] shrink-0 snap-center sm:w-auto sm:shrink"
            >
              <dl className="interactive-card h-full rounded-2xl border border-icl-border bg-icl-card/70 px-4 py-4 backdrop-blur-sm sm:px-5">
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
