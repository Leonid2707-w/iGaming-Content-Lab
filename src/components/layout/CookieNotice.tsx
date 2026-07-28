import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const STORAGE_KEY = 'icl-cookie-notice-accepted'

export function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== '1') {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  function accept() {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore storage errors
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Уведомление об использовании Cookie"
      className="safe-pb fixed inset-x-0 bottom-0 z-[90] p-3 sm:p-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-icl-border bg-icl-surface/95 p-4 shadow-elevated backdrop-blur-xl sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <p className="flex-1 text-xs leading-relaxed text-icl-muted sm:text-sm">
          Мы используем Cookie-файлы для работы сайта и обработки связанных технических данных.
          Подробности — в{' '}
          <Link to="/legal/personal-data" className="font-medium text-icl-accent hover:underline">
            Политике обработки персональных данных
          </Link>
          .
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" className="min-h-10 flex-1 !px-4 !py-2 !text-xs sm:flex-none" onClick={accept}>
            Понятно
          </Button>
          <button
            type="button"
            onClick={accept}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-icl-border text-icl-muted transition hover:bg-icl-surface-alt hover:text-icl-text"
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
