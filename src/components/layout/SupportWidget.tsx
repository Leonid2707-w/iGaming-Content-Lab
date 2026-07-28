import { useEffect, useId, useRef, useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { Button } from '@/components/ui/Button'

export function SupportWidget() {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null
      if (!target) return
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open])

  return (
    <div className="safe-pb pointer-events-none fixed bottom-4 right-4 z-[80] sm:bottom-6 sm:right-6">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {open && (
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label="Поддержка"
            className="w-[min(18.5rem,calc(100vw-2rem))] rounded-2xl border border-icl-border bg-icl-surface p-4 shadow-elevated"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-base font-semibold text-icl-text">Поддержка</p>
                <p className="mt-1 text-sm text-icl-muted">Есть вопросы?</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-icl-subtle transition hover:bg-icl-surface-alt hover:text-icl-text"
                aria-label="Закрыть"
              >
                <X size={16} />
              </button>
            </div>
            <Button
              href={siteConfig.supportTelegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full !text-sm"
            >
              Перейти в Telegram
            </Button>
          </div>
        )}

        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label="Открыть поддержку"
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-icl-border bg-icl-accent text-white shadow-elevated transition hover:bg-icl-accent-hover"
        >
          {open ? <X size={22} /> : <MessageCircle size={22} />}
        </button>
      </div>
    </div>
  )
}
