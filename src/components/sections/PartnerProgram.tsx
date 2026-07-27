import { partnerProgram } from '@/config/content/partner'
import { siteConfig } from '@/config/site'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { IconCheck } from '@/components/icons'

const partnerTelegram = siteConfig.contactTelegram.replace(/^@/, '')
const partnerHref = `https://t.me/${partnerTelegram}?text=${encodeURIComponent(
  'Здравствуйте! Хочу обсудить партнёрскую программу iCL.',
)}`

export function PartnerProgram() {
  return (
    <Section
      id="partner"
      eyebrow="Партнёрская программа"
      title={partnerProgram.title}
      subtitle={partnerProgram.description}
      className="relative overflow-hidden section-muted"
    >
      <div className="pointer-events-none absolute -right-32 top-0 h-64 w-64 rounded-full bg-icl-accent/5 blur-3xl" />

      <div className="relative grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h3 className="mb-5 font-display text-lg font-semibold text-icl-text">Преимущества</h3>
          <ul className="mb-10 space-y-4">
            {partnerProgram.benefits.map((item) => (
              <li
                key={item}
                className="interactive-glow group -mx-2 flex items-start gap-3 rounded-xl border border-transparent px-2 py-2 text-sm text-icl-muted"
              >
                <span className="interactive-icon mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-icl-accent/10">
                  <IconCheck className="h-3 w-3 text-icl-accent" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <h3 className="mb-5 font-display text-lg font-semibold text-icl-text">Как это работает</h3>
          <ol className="space-y-4">
            {partnerProgram.howItWorks.map((step, index) => (
              <li
                key={step}
                className="interactive-glow group -mx-2 flex gap-4 rounded-xl border border-transparent px-2 py-2"
              >
                <span className="interactive-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-icl-accent font-display text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="pt-1.5 text-sm leading-relaxed text-icl-muted">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <Card className="border-icl-accent/20 shadow-elevated">
            <h3 className="mb-3 font-display text-xl font-semibold text-icl-text">Стать партнёром</h3>
            <p className="mb-6 text-sm leading-relaxed text-icl-muted">
              Напишите нам в Telegram — обсудим условия и формат сотрудничества. Заявки принимаем
              напрямую, без формы на сайте.
            </p>
            <Button href={partnerHref} className="w-full" target="_blank" rel="noreferrer">
              Написать в Telegram {siteConfig.contactTelegram}
            </Button>
            <p className="mt-4 text-center text-xs text-icl-subtle">
              Или на почту{' '}
              <a href={`mailto:${siteConfig.contactEmail}`} className="text-icl-accent hover:underline">
                {siteConfig.contactEmail}
              </a>
            </p>
          </Card>
        </div>
      </div>
    </Section>
  )
}
