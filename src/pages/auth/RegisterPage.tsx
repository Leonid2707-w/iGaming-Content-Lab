import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { FormField, inputClass } from '@/components/ui/FormField'
import { isValidEmail, isValidPassword } from '@/config/auth'
import { useAuth } from '@/context/AuthContext'

export function RegisterPage() {
  const { register, isAuthenticated, configured } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [telegram, setTelegram] = useState('')
  const [consentTerms, setConsentTerms] = useState(false)
  const [consentPrivacy, setConsentPrivacy] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = useMemo(() => {
    return (
      configured &&
      !submitting &&
      Boolean(fullName.trim()) &&
      isValidEmail(email) &&
      isValidPassword(password) &&
      password === passwordConfirm &&
      Boolean(telegram.trim()) &&
      consentTerms &&
      consentPrivacy
    )
  }, [
    configured,
    submitting,
    fullName,
    email,
    password,
    passwordConfirm,
    telegram,
    consentTerms,
    consentPrivacy,
  ])

  if (isAuthenticated) {
    return <Navigate to="/cabinet" replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!canSubmit) {
      if (!fullName.trim()) return setError('Укажите имя.')
      if (!isValidEmail(email)) return setError('Укажите корректный email.')
      if (!isValidPassword(password)) return setError('Пароль должен быть не короче 8 символов.')
      if (password !== passwordConfirm) return setError('Пароли не совпадают.')
      if (!telegram.trim()) return setError('Укажите Telegram username.')
      if (!consentTerms || !consentPrivacy) return setError('Примите обязательные соглашения.')
      return
    }

    setSubmitting(true)
    try {
      const result = await register({
        email,
        password,
        fullName,
        telegramUsername: telegram,
        consentTerms,
        consentPrivacy,
      })

      if (!result.ok) {
        setError(result.error || 'Не удалось зарегистрироваться')
        return
      }

      if (result.warning) {
        navigate('/login', { replace: true, state: { notice: result.warning } })
        return
      }

      navigate('/cabinet', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось зарегистрироваться')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Регистрация"
      subtitle="Создайте аккаунт, чтобы оформлять заказы и видеть их историю в личном кабинете."
      showBack
      footer={
        <p>
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-medium text-icl-accent hover:underline">
            Войти
          </Link>
        </p>
      }
    >
      {!configured && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Регистрация временно недоступна: сервер не отвечает. Обновите страницу или попробуйте позже.
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Имя" htmlFor="reg-name" required>
          <input
            id="reg-name"
            className={inputClass}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
        </FormField>

        <FormField label="Email" htmlFor="reg-email" required>
          <input
            id="reg-email"
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </FormField>

        <FormField label="Telegram Username" htmlFor="reg-tg" required hint="С @ или без — сохраним как @username">
          <input
            id="reg-tg"
            className={inputClass}
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="@username"
            autoComplete="off"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Пароль" htmlFor="reg-password" required hint="Минимум 8 символов">
            <input
              id="reg-password"
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </FormField>
          <FormField label="Подтверждение пароля" htmlFor="reg-password-2" required>
            <input
              id="reg-password-2"
              type="password"
              className={inputClass}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </FormField>
        </div>

        <div className="space-y-3 rounded-2xl border border-icl-border bg-icl-surface px-4 py-3">
          <label className="flex items-start gap-3 text-sm text-icl-muted">
            <input
              type="checkbox"
              className="mt-1"
              checked={consentTerms}
              onChange={(e) => setConsentTerms(e.target.checked)}
            />
            <span>
              Я принимаю{' '}
              <Link to="/legal/terms" className="text-icl-accent hover:underline" target="_blank">
                Пользовательское соглашение
              </Link>
              .
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-icl-muted">
            <input
              type="checkbox"
              className="mt-1"
              checked={consentPrivacy}
              onChange={(e) => setConsentPrivacy(e.target.checked)}
            />
            <span>
              Я согласен(на) с{' '}
              <Link
                to="/legal/personal-data"
                className="text-icl-accent hover:underline"
                target="_blank"
              >
                Политикой обработки персональных данных
              </Link>
              .
            </span>
          </label>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {submitting ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
        </Button>
      </form>
    </AuthShell>
  )
}
