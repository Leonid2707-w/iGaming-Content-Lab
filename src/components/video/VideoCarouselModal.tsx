import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { VideoExampleItem } from '@/config/content/videoExamples'
import { duration, easeOutSoft, modalBackdrop, modalPanel } from '@/lib/motion'

interface VideoCarouselModalProps {
  open: boolean
  items: VideoExampleItem[]
  startIndex?: number
  title?: string
  onClose: () => void
}

export function VideoCarouselModal({
  open,
  items,
  startIndex = 0,
  title = 'Примеры работ',
  onClose,
}: VideoCarouselModalProps) {
  const reduceMotion = useReducedMotion()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [index, setIndex] = useState(startIndex)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [direction, setDirection] = useState(0)

  const current = items[index]

  useEffect(() => {
    if (!open) return
    setIndex(Math.min(Math.max(0, startIndex), Math.max(0, items.length - 1)))
    setDirection(0)
  }, [open, startIndex, items.length])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') goPrev()
      if (event.key === 'ArrowRight') goNext()
      if (event.key === ' ') {
        event.preventDefault()
        togglePlay()
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previous?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, items.length, onClose])

  useEffect(() => {
    if (!open || !current) return
    setPlaying(true)
    setProgress(0)
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    void video.play().catch(() => setPlaying(false))
  }, [open, current])

  function goPrev() {
    if (items.length < 2) return
    setDirection(-1)
    setIndex((value) => (value - 1 + items.length) % items.length)
  }

  function goNext() {
    if (items.length < 2) return
    setDirection(1)
    setIndex((value) => (value + 1) % items.length)
  }

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play()
    else video.pause()
  }

  if (typeof document === 'undefined') return null

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir >= 0 ? 48 : -48,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir >= 0 ? -48 : 48,
      opacity: 0,
    }),
  }

  return createPortal(
    <AnimatePresence>
      {open && current && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6"
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={reduceMotion ? { duration: 0 } : { duration: duration.base, ease: easeOutSoft }}
        >
          <button
            type="button"
            aria-label="Закрыть"
            className="absolute inset-0 bg-slate-950/82 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={modalPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={
              reduceMotion ? { duration: 0 } : { duration: duration.base, ease: easeOutSoft }
            }
            className="relative z-10 flex max-h-[min(92vh,920px)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300/85">
                  {title}
                </p>
                <h3 className="mt-1 truncate font-display text-lg font-semibold text-white">
                  {current.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
                  {index + 1} / {items.length}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 bg-black">
              <div className="relative mx-auto flex h-[min(58vh,560px)] w-full items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={current.id + current.src}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
                    }
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <video
                      ref={videoRef}
                      src={current.src}
                      poster={current.poster || undefined}
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-contain"
                      onPlay={() => setPlaying(true)}
                      onPause={() => setPlaying(false)}
                      onTimeUpdate={(event) => {
                        const video = event.currentTarget
                        if (!video.duration) return
                        setProgress((video.currentTime / video.duration) * 100)
                      }}
                      onEnded={goNext}
                      onClick={togglePlay}
                    />
                  </motion.div>
                </AnimatePresence>

                {items.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goPrev}
                      aria-label="Предыдущий пример"
                      className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/45 p-2.5 text-white backdrop-blur transition hover:bg-black/65 sm:left-4"
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      aria-label="Следующий пример"
                      className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/45 p-2.5 text-white backdrop-blur transition hover:bg-black/65 sm:right-4"
                    >
                      <ChevronRight size={22} />
                    </button>
                  </>
                )}
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/50 to-transparent px-4 pb-4 pt-20">
                <div className="pointer-events-auto mx-auto flex max-w-3xl items-center gap-3">
                  <button
                    type="button"
                    className="rounded-full bg-white/15 p-2.5 text-white backdrop-blur transition hover:bg-white/25"
                    onClick={togglePlay}
                    aria-label={playing ? 'Пауза' : 'Смотреть'}
                  >
                    {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20"
                    aria-label="Прогресс воспроизведения"
                    onClick={(event) => {
                      const video = videoRef.current
                      if (!video?.duration) return
                      const rect = event.currentTarget.getBoundingClientRect()
                      const ratio = Math.min(
                        1,
                        Math.max(0, (event.clientX - rect.left) / rect.width),
                      )
                      video.currentTime = ratio * video.duration
                    }}
                  >
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-500"
                      style={{ width: `${progress}%` }}
                    />
                  </button>

                  <button
                    type="button"
                    className="rounded-full bg-white/15 p-2.5 text-white backdrop-blur transition hover:bg-white/25"
                    onClick={() => {
                      const video = videoRef.current
                      if (!video) return
                      video.muted = !video.muted
                      setMuted(video.muted)
                    }}
                    aria-label={muted ? 'Включить звук' : 'Выключить звук'}
                  >
                    {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {items.length > 1 && (
              <div className="border-t border-white/10 px-4 py-4 sm:px-5">
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {items.map((item, itemIndex) => {
                    const active = itemIndex === index
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setDirection(itemIndex > index ? 1 : -1)
                          setIndex(itemIndex)
                        }}
                        className={`group relative h-20 w-14 shrink-0 overflow-hidden rounded-xl border transition sm:h-24 sm:w-[4.5rem] ${
                          active
                            ? 'border-violet-400 ring-2 ring-violet-400/30'
                            : 'border-white/10 opacity-70 hover:opacity-100'
                        }`}
                        aria-label={`Открыть ${item.title}`}
                        aria-current={active}
                      >
                        {item.poster ? (
                          <img
                            src={item.poster}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/5 text-[10px] text-white/50">
                            {itemIndex + 1}
                          </div>
                        )}
                        <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
