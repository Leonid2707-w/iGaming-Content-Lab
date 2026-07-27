import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Lock, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FormField, inputClass } from '@/components/ui/FormField'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { duration, easeOutSoft, modalBackdrop, modalPanel } from '@/lib/motion'

export function AdminLoginModal() {
  const { loginModalOpen, closeLoginModal, login, isAuthenticated } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const onAdminRoute = location.pathname.startsWith('/admin')

  function dismiss() {
    closeLoginModal()
    if (onAdminRoute && !isAuthenticated) {
      navigate('/', { replace: true })
    }
  }

  useEffect(() => {
    if (!loginModalOpen) return
    setUsername('')
    setPassword('')
    setError('')
    setSubmitting(false)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus())
    return () => {
      document.body.style.overflow = previous
    }
  }, [loginModalOpen])

  useEffect(() => {
    if (!loginModalOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeLoginModal()
        if (onAdminRoute && !isAuthenticated) {
          navigate('/', { replace: true })
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeLoginModal, isAuthenticated, loginModalOpen, navigate, onAdminRoute])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const result = await login(username, password)
      if (!result.ok) {
        setError(result.error ?? 'Ошибка входа')
        return
      }
      navigate('/admin')
    } finally {
      setSubmitting(false)
    }
  }

  if (typeof document === 'undefined') return null
  if (isAuthenticated && !loginModalOpen) return null

  const motionOff = !!reduceMotion

  return createPortal(
    <AnimatePresence>
      {loginModalOpen && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.button
            type="button"
            aria-label="Закрыть"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            variants={modalBackdrop}
            transition={{ duration: motionOff ? 0 : duration.base, ease: easeOutSoft }}
            onClick={dismiss}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-login-title"
            className="relative w-full max-w-md rounded-3xl border border-icl-border bg-icl-surface p-6 shadow-elevated sm:p-8"
            variants={modalPanel}
            transition={
              motionOff ? { duration: 0 } : { duration: duration.slow, ease: easeOutSoft }
            }
          >
            <button
              type="button"
              onClick={dismiss}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-icl-border text-icl-muted transition hover:bg-icl-surface-alt hover:text-icl-text"
              aria-label="Закрыть"
            >
              <X size={18} />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-icl-accent-soft text-icl-accent">
                <Lock size={20} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-icl-accent">
                  Служебный доступ
                </p>
                <h2 id="admin-login-title" className="text-xl font-semibold text-icl-text">
                  Вход в админ-панель
                </h2>
                <p className="mt-1 text-xs text-icl-subtle">
                  Это не вход в кабинет клиента. Учётные данные администратора.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Логин" htmlFor="admin-login" required>
                <input
                  id="admin-login"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className={inputClass}
                  placeholder="Логин"
                />
              </FormField>
              <FormField label="Пароль" htmlFor="admin-password" required>
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass}
                  placeholder="Пароль"
                />
              </FormField>

              {error && (
                <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Вход…' : 'Войти'}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
