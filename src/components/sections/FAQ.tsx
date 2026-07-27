import { faqItems } from '@/config/content/faq'
import { Section } from '@/components/ui/Section'
import { Accordion } from '@/components/ui/Accordion'

export function FAQ() {
  return (
    <Section
      id="faq"
      eyebrow="FAQ"
      title="Частые вопросы"
      subtitle="Не нашли ответ? Напишите нам в Telegram или через форму заказа."
      className="section-light"
    >
      <div className="mx-auto max-w-3xl">
        <Accordion items={faqItems} />
      </div>
    </Section>
  )
}
