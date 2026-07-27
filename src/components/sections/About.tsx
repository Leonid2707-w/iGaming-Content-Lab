import { siteConfig } from '@/config/site'
import { orderTypes } from '@/config/content/process'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { IconCheck } from '@/components/icons'
import { useOrderModal } from '@/context/OrderModalContext'

const values = [
  'Специализация на iGaming-контенте',
  'Производство материалов под разные GEO',
  'AI-инструменты с обязательным контролем специалиста',
  'Гибкое масштабирование команды под объём',
  'Единая система контроля качества',
]

export function About() {
  const { openOrder } = useOrderModal()

  return (
    <Section
      id="about"
      eyebrow="О проекте"
      title="iCL — ваш контент-отдел на аутсорсе"
      className="section-light"
    >
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <p className="mb-5 text-lg leading-relaxed text-icl-muted">{siteConfig.description}</p>
          <p className="mb-8 leading-relaxed text-icl-muted">
            Клиент приходит с задачей, которую хочет делегировать. iCL распределяет её между
            сотрудниками-специалистами и выдаёт результат в лучшем виде.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => openOrder()}>Оформить заказ</Button>
            <Button href="/#partner" variant="outline-dark">
              Партнёрская программа
            </Button>
          </div>
        </div>

        <div className="space-y-5">
          <Card hover className="group border-icl-accent/15 bg-gradient-to-br from-icl-card to-icl-surface-alt">
            <h3 className="mb-6 font-display text-lg font-semibold text-icl-text">
              Почему выбирают iCL
            </h3>
            <ul className="space-y-4">
              {values.map((value) => (
                <li key={value} className="flex items-start gap-3">
                  <span className="interactive-icon mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-icl-accent-soft">
                    <IconCheck className="h-3 w-3 text-icl-accent" />
                  </span>
                  <span className="text-sm leading-relaxed text-icl-muted">{value}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card hover>
            <h3 className="mb-4 font-display font-semibold text-icl-text">Два пути заказа</h3>
            {orderTypes.map((type) => (
              <p key={type.title} className="mb-3 text-sm text-icl-muted last:mb-0">
                <strong className="font-medium text-icl-text">{type.title}:</strong>{' '}
                {type.description}
              </p>
            ))}
          </Card>
        </div>
      </div>
    </Section>
  )
}
