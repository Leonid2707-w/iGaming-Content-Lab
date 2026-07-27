import { motion, useReducedMotion } from 'motion/react'
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Globe2,
  Image,
  Send,
  Smartphone,
  Sparkles,
  Video,
  type LucideIcon,
} from 'lucide-react'
import {
  formatServicePrice,
  serviceCategories,
  type StandardService,
} from '@/config/content/services'
import type { VideoExampleGroupId } from '@/config/content/videoExamples'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { VideoExamplesTrigger } from '@/components/video/VideoExamplesTrigger'
import { useOrderModal } from '@/context/OrderModalContext'
import { useServices } from '@/context/ServicesContext'
import {
  cardHover,
  duration,
  easeOutSoft,
  fadeUp,
  staggerContainer,
} from '@/lib/motion'

const iconMap: Record<string, LucideIcon> = {
  video: Video,
  send: Send,
  calendar: CalendarDays,
  sparkles: Sparkles,
  youtube: Video,
  image: Image,
  briefcase: BriefcaseBusiness,
  globe: Globe2,
  smartphone: Smartphone,
}

const portfolioServiceIds = new Set<VideoExampleGroupId>(['video-creative', 'ai-video'])

function ServiceCard({ service, index }: { service: StandardService; index: number }) {
  const { openOrder } = useOrderModal()
  const reduceMotion = useReducedMotion()
  const Icon = iconMap[service.icon] ?? BriefcaseBusiness
  const price = formatServicePrice(service)
  const portfolioId = portfolioServiceIds.has(service.id as VideoExampleGroupId)
    ? (service.id as VideoExampleGroupId)
    : null

  return (
    <motion.article
      className="card-premium group relative z-0 flex h-full flex-col overflow-visible p-6 hover:z-20"
      variants={fadeUp}
      transition={{
        duration: duration.base,
        ease: easeOutSoft,
        delay: reduceMotion ? 0 : (index % 3) * 0.06,
      }}
      whileHover={reduceMotion ? undefined : cardHover}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-icl-accent-soft text-icl-accent transition-transform duration-300 group-hover:scale-[1.04]">
          <Icon size={22} />
        </span>
        <div className="text-right">
          {price.isCustom ? (
            <span className="rounded-full bg-icl-surface-alt px-3 py-1.5 text-xs font-medium text-icl-muted">
              {price.primary}
            </span>
          ) : (
            <>
              <p className="font-display text-2xl font-bold text-icl-text">
                {price.primary}
              </p>
              {price.secondary && (
                <p className="text-xs text-icl-subtle">{price.secondary}</p>
              )}
            </>
          )}
        </div>
      </div>

      <h3 className="mb-2 font-display text-lg font-semibold text-icl-text">
        {service.title}
      </h3>
      <p className="mb-5 flex-1 text-sm leading-relaxed text-icl-muted">
        {service.description}
      </p>

      <ul className="mb-6 space-y-2.5 border-t border-icl-border pt-5">
        {service.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5 text-sm text-icl-muted">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-icl-accent-soft text-icl-accent">
              <Check size={12} />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-2.5">
        {portfolioId && (
          <VideoExamplesTrigger
            groupId={portfolioId}
            title={`Примеры · ${service.title}`}
          />
        )}
        <Button
          variant="outline-dark"
          className="w-full"
          onClick={() => openOrder({ serviceId: service.id })}
        >
          Заказать
        </Button>
      </div>
    </motion.article>
  )
}

export function StandardServices() {
  const reduceMotion = useReducedMotion()
  const { enabledServices } = useServices()

  return (
    <Section
      id="services"
      eyebrow="Услуги"
      title="Контент-производство под задачи iGaming"
      subtitle="От отдельных постов и креативов до регулярного ведения каналов. Масштабируем команду под объём и GEO."
      className="section-muted bg-dot-pattern"
      revealContent={false}
    >
      <div className="space-y-16">
        {serviceCategories.map((category) => {
          const services = enabledServices.filter(
            (service) => service.category === category.id,
          )
          if (services.length === 0) return null

          return (
            <div key={category.id}>
              <div className="mb-6 flex items-center gap-4">
                <h3 className="font-display text-xl font-semibold text-icl-text">
                  {category.label}
                </h3>
                <div className="h-px flex-1 bg-icl-border" />
                <span className="text-xs text-icl-subtle">{services.length} услуг</span>
              </div>

              <motion.div
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                variants={reduceMotion ? undefined : staggerContainer}
                initial={reduceMotion ? false : 'hidden'}
                whileInView="visible"
                viewport={{ once: true, amount: 0.12 }}
              >
                {services.map((service, index) => (
                  <ServiceCard key={service.id} service={service} index={index} />
                ))}
              </motion.div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
