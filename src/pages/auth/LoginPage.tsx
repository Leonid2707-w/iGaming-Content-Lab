import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { FormField, inputClass } from '@/components/ui/FormField'
import { isValidEmail } from '@/config/auth'
import { useAuth } from '@/context/AuthContext'

export function LoginPage() {
  const { login, isAuthenticated, configured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/cabinet'
  const notice = (location.state as { notice?: string } | null)?.notice
  const reopenOrder = Boolean((location.state as { reopenOrder?: boolean } | null)?.reopenOrder)
  const serviceId = (location.state as { serviceId?: string } | null)?.serviceId

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return (
      <Navigate
        to={from}
        replace
        state={reopenOrder ? { reopenOrder: true, serviceId } : undefined}
      />
    )
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!isValidEmail(email)) return setError('Укажите корректный email.')
    if (!password) return setError('Введите пароль.')

    setSubmitting(true)
    try {
      const result = await login(email, password, rememberMe)
      if (!result.ok) {
        setError(result.error || 'Не удалось войти')
        return
      }
      navigate(from, {
        replace: true,
        state: reopenOrder ? { reopenOrder: true, serviceId } : undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Вход"
      subtitle="Войдите в аккаунт, чтобы оформлять заказы и открыть личный кабинет."
      footer={
        <p>
          Нет аккаунта?{' '}
          <Link to="/register" className="font-medium text-icl-accent hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      }
    >
      {!configured && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Вход временно недоступен: сервер не отвечает. Обновите страницу или попробуйте позже.
        </div>
      )}

      {notice && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          {notice}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Email" htmlFor="login-email" required>
          <input
            id="login-email"
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </FormField>
        <FormField label="Пароль" htmlFor="login-password" required>
          <input
            id="login-password"
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </FormField>

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-icl-muted">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Запомнить меня
          </label>
          <Link to="/forgot-password" className="font-medium text-icl-accent hover:underline">
            Забыли пароль?
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={submitting || !configured}>
          {submitting ? 'Входим…' : 'Войти'}
        </Button>
      </form>
    </AuthShell>
  )
}
