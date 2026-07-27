import { siteConfig } from '@/config/site'
import { Section } from '@/components/ui/Section'
import { Card } from '@/components/ui/Card'
import { useOrderModal } from '@/context/OrderModalContext'

const contacts = [
  {
    label: 'Email',
    value: siteConfig.contactEmail,
    href: `mailto:${siteConfig.contactEmail}`,
  },
  {
    label: 'Telegram',
    value: siteConfig.contactTelegram,
    href: `https://t.me/${siteConfig.contactTelegram.replace('@', '')}`,
    external: true,
  },
  {
    label: 'Домен',
    value: siteConfig.domain,
    href: undefined,
  },
]

export function Contact() {
  const { openOrder } = useOrderModal()

  return (
    <Section id="contact" eyebrow="Контакты" title="Связаться с iCL" className="section-muted">
      <div className="grid gap-5 sm:grid-cols-3">
        {contacts.map((item) => (
          <Card key={item.label} hover className="text-center sm:text-left">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-icl-subtle">
              {item.label}
            </h3>
            {item.href ? (
              <a
                href={item.href}
                className="glow-link font-display font-semibold text-icl-accent hover:text-icl-accent-hover"
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
              >
                {item.value}
              </a>
            ) : (
              <p className="font-display font-semibold text-icl-text">{item.value}</p>
            )}
          </Card>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-icl-muted">
        Для заказов используйте{' '}
        <button
          type="button"
          onClick={() => openOrder()}
          className="glow-link font-medium text-icl-accent hover:underline"
        >
          форму на сайте
        </button>{' '}
        — так заявка сразу попадёт координатору.
      </p>
    </Section>
  )
}
