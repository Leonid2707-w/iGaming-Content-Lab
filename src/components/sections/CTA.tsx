import { Button } from '@/components/ui/Button'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { IconArrowRight } from '@/components/icons'
import { useOrderModal } from '@/context/OrderModalContext'

export function CTA() {
  const { openOrder } = useOrderModal()

  return (
    <section className="relative overflow-hidden border-y border-icl-border bg-icl-surface py-24 text-icl-text">
      <div className="pointer-events-none absolute inset-0 bg-mesh-dark" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-50" aria-hidden="true" />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-icl-accent/15 blur-[80px]"
        aria-hidden="true"
      />

      <div className="container-icl relative">
        <ScrollReveal className="text-center" variant="scale">
          <h2 className="mb-5 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Готовы делегировать контент?
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-lg text-icl-muted">
            Оформите стандартный заказ за 2 минуты или опишите нестандартную задачу — мы возьмём
            производство на себя.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={() => openOrder()}>
              Оформить заказ
              <IconArrowRight />
            </Button>
            <Button href="/#partner" variant="outline-dark">
              Стать партнёром
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
