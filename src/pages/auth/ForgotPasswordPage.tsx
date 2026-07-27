import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { FormField, inputClass } from '@/components/ui/FormField'
import { isValidEmail } from '@/config/auth'
import { useAuth } from '@/context/AuthContext'

export function ForgotPasswordPage() {
  const { requestPasswordReset, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!isValidEmail(email)) return setError('Укажите корректный email.')
    setSubmitting(true)
    const result = await requestPasswordReset(email)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error || 'Не удалось отправить письмо')
      return
    }
    setDone(true)
  }

  return (
    <AuthShell
      title="Восстановление пароля"
      subtitle="Отправим ссылку для сброса пароля на ваш email."
      footer={
        <p>
          Вспомнили пароль?{' '}
          <Link to="/login" className="font-medium text-icl-accent hover:underline">
            Войти
          </Link>
        </p>
      }
    >
      {done ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-5 text-sm text-icl-muted">
          Если аккаунт с таким email существует, мы отправили письмо со ссылкой для сброса пароля.
          Проверьте почту и папку «Спам».
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField label="Email" htmlFor="forgot-email" required>
            <input
              id="forgot-email"
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </FormField>
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={submitting || !configured}>
            {submitting ? 'Отправляем…' : 'Отправить ссылку'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
