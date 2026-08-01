import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { partnerProgram } from '@/config/content/partner'
import { siteConfig } from '@/config/site'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormField, inputClass } from '@/components/ui/FormField'
import { IconCheck } from '@/components/icons'

const partnerTelegram = siteConfig.contactTelegram.replace(/^@/, '')
const partnerHref = `https://t.me/${partnerTelegram}?text=${encodeURIComponent(
  'Здравствуйте! Хочу обсудить партнёрскую программу iCL.',
)}`

export function PartnerProgram() {
  const [name, setName] = useState('')
  const [telegram, setTelegram] = useState('')
  const [audience, setAudience] = useState('')
  const [comment, setComment] = useState('')
  const [website, setWebsite] = useState('')
  const [consentPrivacy, setConsentPrivacy] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!consentPrivacy) {
      setError('Подтвердите согласие на обработку персональных данных.')
      return
    }
    setSubmitting(true)
    setError('')
    setSuccess(false)
    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, telegram, audience, comment, website }),
      })
      const data = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !data.ok) {
        throw new Error(data.error || `Ошибка ${response.status}`)
      }
      setSuccess(true)
      setName('')
      setTelegram('')
      setAudience('')
      setComment('')
      setConsentPrivacy(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить заявку')
    } finally {
      setSubmitting(false)
    }
  }

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
          <Card className="relative border-icl-accent/20 shadow-elevated">
            <h3 className="mb-3 font-display text-xl font-semibold text-icl-text">Стать партнёром</h3>
            <p className="mb-6 text-sm leading-relaxed text-icl-muted">
              Оставьте заявку — мы свяжемся в Telegram и обсудим условия.
            </p>

            {success ? (
              <div
                className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
                role="status"
                aria-live="polite"
              >
                Заявка отправлена. Мы напишем вам в Telegram.
              </div>
            ) : null}
            {error ? (
              <div
                className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-4">
              <FormField label="Имя" htmlFor="partner-name" required>
                <input
                  id="partner-name"
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </FormField>
              <FormField label="Telegram" htmlFor="partner-telegram" required>
                <input
                  id="partner-telegram"
                  className={inputClass}
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                  required
                />
              </FormField>
              <FormField label="Аудитория / ниша" htmlFor="partner-audience">
                <input
                  id="partner-audience"
                  className={inputClass}
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </FormField>
              <FormField label="Комментарий" htmlFor="partner-comment">
                <textarea
                  id="partner-comment"
                  className={`${inputClass} min-h-24 resize-y`}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </FormField>
              {/* Honeypot */}
              <div className="absolute -left-[9999px] opacity-0" aria-hidden="true">
                <label htmlFor="partner-website">Website</label>
                <input
                  id="partner-website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              <label className="flex items-start gap-3 text-sm text-icl-muted">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={consentPrivacy}
                  onChange={(e) => setConsentPrivacy(e.target.checked)}
                  required
                />
                <span>
                  Согласен на обработку данных по{' '}
                  <Link to="/legal/privacy" className="text-icl-accent hover:underline">
                    политике конфиденциальности
                  </Link>
                  .
                </span>
              </label>
              <Button type="submit" className="w-full" disabled={submitting || !consentPrivacy}>
                {submitting ? 'Отправка…' : 'Отправить заявку'}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-icl-subtle">
              Или напишите напрямую:{' '}
              <a href={partnerHref} className="text-icl-accent hover:underline" target="_blank" rel="noreferrer">
                {siteConfig.contactTelegram}
              </a>
            </p>
          </Card>
        </div>
      </div>
    </Section>
  )
}
