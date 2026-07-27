import { Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { VideoExampleGroupId } from '@/config/content/videoExamples'
import { useVideoExamples } from '@/context/VideoExamplesContext'
import { VideoCarouselModal } from '@/components/video/VideoCarouselModal'
import { VideoExamplesPopover } from '@/components/video/VideoExamplesPopover'

interface VideoExamplesTriggerProps {
  groupId: VideoExampleGroupId
  title?: string
  className?: string
}

export function VideoExamplesTrigger({
  groupId,
  title = 'Примеры работ',
  className = '',
}: VideoExamplesTriggerProps) {
  const { getExamples } = useVideoExamples()
  const examples = getExamples(groupId).filter((item) => item.src)
  const rootRef = useRef<HTMLDivElement>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)

  useEffect(() => {
    if (!popoverOpen) return

    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current
      if (!root) return
      if (!root.contains(event.target as Node)) {
        setPopoverOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [popoverOpen])

  if (!examples.length) return null

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setPopoverOpen(true)
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse' && !fullscreenOpen) {
          setPopoverOpen(false)
        }
      }}
    >
      <VideoExamplesPopover
        open={popoverOpen && !fullscreenOpen}
        items={examples}
        onClose={() => setPopoverOpen(false)}
        onSelect={(index) => {
          setStartIndex(index)
          setFullscreenOpen(true)
          setPopoverOpen(false)
        }}
      />

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setPopoverOpen((value) => !value)
        }}
        className="group/examples inline-flex w-full items-center justify-center gap-2 rounded-xl border border-icl-border bg-icl-surface px-3 py-2.5 text-sm font-semibold text-icl-text transition hover:border-icl-accent/45 hover:bg-icl-accent-soft hover:text-icl-accent"
        aria-expanded={popoverOpen}
        aria-haspopup="dialog"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-icl-accent-soft text-icl-accent transition group-hover/examples:bg-icl-accent group-hover/examples:text-white">
          <Play size={13} className="ml-0.5" fill="currentColor" />
        </span>
        Смотреть примеры
      </button>

      <VideoCarouselModal
        open={fullscreenOpen}
        items={examples}
        startIndex={startIndex}
        title={title}
        onClose={() => setFullscreenOpen(false)}
      />
    </div>
  )
}
