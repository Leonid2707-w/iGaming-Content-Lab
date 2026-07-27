import { useRef, useState, type UIEvent } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  LockKeyhole,
  Sparkles,
} from 'lucide-react'
import { projects } from '@/config/content/projects'
import { useOrderModal } from '@/context/OrderModalContext'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function Projects() {
  const { openOrder } = useOrderModal()
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  function scrollToProject(index: number) {
    const track = trackRef.current
    const card = track?.children.item(index) as HTMLElement | null
    if (!track || !card) return

    track.scrollTo({
      left: card.offsetLeft - track.offsetLeft,
      behavior: 'smooth',
    })
    setActiveIndex(index)
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const track = event.currentTarget
    const cards = Array.from(track.children) as HTMLElement[]
    if (!cards.length) return

    const nearest = cards.reduce(
      (best, card, index) => {
        const distance = Math.abs(card.offsetLeft - track.offsetLeft - track.scrollLeft)
        return distance < best.distance ? { index, distance } : best
      },
      { index: 0, distance: Number.POSITIVE_INFINITY },
    )
    setActiveIndex(nearest.index)
  }

  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="relative overflow-hidden border-b border-icl-border bg-icl-bg py-16 sm:py-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-25" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-icl-accent/[0.07] blur-3xl" aria-hidden="true" />

      <div className="container-icl relative">
        <ScrollReveal>
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-icl-accent">
                iCL Projects
              </p>
              <h2
                id="projects-title"
                className="max-w-2xl font-display text-2xl font-semibold tracking-tight text-icl-text sm:text-3xl lg:text-4xl"
              >
                Библиотека готовых работ
                <span className="text-gradient"> и достижений</span>
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-icl-muted sm:text-base">
                Реальные проекты: от потока AI-креативов до контент-систем и цифровых
                продуктов.
              </p>
            </div>

            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scrollToProject(Math.max(0, activeIndex - 1))}
                disabled={activeIndex === 0}
                aria-label="Предыдущий проект"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-icl-border bg-icl-card text-icl-muted transition hover:border-icl-accent/40 hover:text-icl-accent disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ArrowLeft size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() =>
                  scrollToProject(Math.min(projects.length - 1, activeIndex + 1))
                }
                disabled={activeIndex === projects.length - 1}
                aria-label="Следующий проект"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-icl-border bg-icl-card text-icl-muted transition hover:border-icl-accent/40 hover:text-icl-accent disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:gap-5 sm:px-6 lg:-mx-8 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {projects.map((project) => (
              <article
                key={project.id}
                className="group relative w-[88%] shrink-0 snap-start overflow-hidden rounded-3xl border border-icl-border/80 bg-icl-card shadow-card transition-all duration-500 sm:w-[70%] lg:w-[48%] xl:w-[42%]"
              >
                <div className="relative h-64 overflow-hidden bg-icl-surface-alt sm:h-72">
                  <img
                    src={project.image}
                    alt={project.imageAlt}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                    style={{ objectPosition: project.imagePosition }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />

                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/65 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/85 backdrop-blur-lg">
                    {project.confidential ? (
                      <LockKeyhole size={11} aria-hidden="true" />
                    ) : (
                      <Sparkles size={11} aria-hidden="true" />
                    )}
                    {project.badge}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300">
                        Project {project.number}
                      </p>
                      <p className="mt-1 text-xs font-medium text-white/65">{project.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl font-bold text-white">
                        {project.metric}
                      </p>
                      <p className="max-w-[145px] text-[10px] leading-snug text-white/60">
                        {project.metricLabel}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <h3 className="font-display text-xl font-semibold tracking-tight text-icl-text sm:text-2xl">
                    {project.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-icl-muted">
                    {project.description}
                  </p>

                  <ul className="mt-5 flex flex-wrap gap-2" aria-label="Направления проекта">
                    {project.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-icl-border bg-icl-surface-alt px-3 py-1 text-[11px] font-medium text-icl-muted"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() =>
                      openOrder({
                        serviceId: 'custom',
                        description: project.orderPrompt,
                      })
                    }
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-icl-accent transition hover:text-icl-accent-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-icl-accent/20"
                  >
                    Обсудить похожий проект
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2" aria-label="Навигация по проектам">
              {projects.map((project, index) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => scrollToProject(index)}
                  aria-label={`Открыть проект ${index + 1}`}
                  aria-current={activeIndex === index ? 'true' : undefined}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeIndex === index
                      ? 'w-8 bg-icl-accent'
                      : 'w-3 bg-icl-border hover:bg-icl-subtle'
                  }`}
                />
              ))}
            </div>

            <p className="max-w-xl text-right text-[11px] leading-relaxed text-icl-subtle">
              Часть работ не публикуется из-за NDA. Подробнее расскажем при личном
              общении.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

