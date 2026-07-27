import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { VideoExampleItem } from '@/config/content/videoExamples'

interface VideoExamplesPopoverProps {
  open: boolean
  items: VideoExampleItem[]
  onClose: () => void
  onSelect: (index: number) => void
}

export function VideoExamplesPopover({
  open,
  items,
  onClose,
  onSelect,
}: VideoExamplesPopoverProps) {
  const reduceMotion = useReducedMotion()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  function updateArrows() {
    const node = scrollerRef.current
    if (!node) return
    const max = node.scrollWidth - node.clientWidth
    setCanPrev(node.scrollLeft > 4)
    setCanNext(node.scrollLeft < max - 4)
  }

  useEffect(() => {
    if (!open) return
    const node = scrollerRef.current
    if (!node) return
    node.scrollLeft = 0
    updateArrows()
    const onScroll = () => updateArrows()
    node.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      node.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateArrows)
    }
  }, [open, items.length])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') scrollBy(-1)
      if (event.key === 'ArrowRight') scrollBy(1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose])

  function scrollBy(direction: -1 | 1) {
    const node = scrollerRef.current
    if (!node) return
    const amount = Math.max(140, node.clientWidth * 0.7) * direction
    node.scrollBy({ left: amount, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="Примеры работ"
          initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-[calc(100%+12px)] left-1/2 z-40 w-[min(100vw-2rem,320px)] -translate-x-1/2"
        >
          <div className="relative rounded-2xl border border-icl-border bg-icl-card p-3 shadow-card">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-icl-subtle">
                Примеры
              </p>
              <p className="text-[11px] text-icl-muted">{items.length} видео</p>
            </div>

            <div className="relative">
              <div
                ref={scrollerRef}
                className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(index)}
                    className="group relative h-[148px] w-[96px] shrink-0 snap-start overflow-hidden rounded-xl border border-icl-border bg-icl-surface-alt transition hover:border-icl-accent/50"
                    aria-label={`Открыть ${item.title}`}
                  >
                    {item.poster ? (
                      <img
                        src={item.poster}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs text-icl-subtle">
                        {index + 1}
                      </span>
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                    <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-md transition group-hover:scale-110">
                      <Play size={14} className="ml-0.5" fill="currentColor" />
                    </span>
                    <span className="absolute inset-x-0 bottom-0 truncate px-2 pb-2 text-[10px] font-medium text-white">
                      {item.title}
                    </span>
                  </button>
                ))}
              </div>

              {canPrev && (
                <button
                  type="button"
                  onClick={() => scrollBy(-1)}
                  aria-label="Назад"
                  className="absolute -left-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-icl-border bg-icl-card text-icl-text shadow-card transition hover:border-icl-accent/40 hover:text-icl-accent"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              {canNext && (
                <button
                  type="button"
                  onClick={() => scrollBy(1)}
                  aria-label="Вперёд"
                  className="absolute -right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-icl-border bg-icl-card text-icl-text shadow-card transition hover:border-icl-accent/40 hover:text-icl-accent"
                >
                  <ChevronRight size={16} />
                </button>
              )}
            </div>

            {/* Speech-bubble tip pointing to the button */}
            <span
              aria-hidden="true"
              className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-icl-border bg-icl-card"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
