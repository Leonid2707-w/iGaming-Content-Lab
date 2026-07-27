import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { FormField, inputClass } from '@/components/ui/FormField'
import { isValidPassword } from '@/config/auth'
import { useAuth } from '@/context/AuthContext'
import { parseAuthHash } from '@/lib/authSession'

export function ResetPasswordPage() {
  const { updatePassword, configured, applySession, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fromHash = parseAuthHash(window.location.hash)
    if (!fromHash) {
      setReady(isAuthenticated)
      setChecking(false)
      if (!isAuthenticated) {
        setError('Откройте эту страницу по ссылке из письма для сброса пароля.')
      }
      return
    }

    void applySession(fromHash).then((result) => {
      if (!result.ok) {
        setError(result.error || 'Ссылка для сброса пароля недействительна.')
        setReady(false)
      } else {
        window.history.replaceState(null, '', window.location.pathname)
        setReady(true)
      }
      setChecking(false)
    })
  }, [applySession, isAuthenticated])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!isValidPassword(password)) return setError('Пароль должен быть не короче 8 символов.')
    if (password !== passwordConfirm) return setError('Пароли не совпадают.')

    setSubmitting(true)
    try {
      const result = await updatePassword(password)
      if (!result.ok) {
        setError(result.error || 'Не удалось обновить пароль')
        return
      }
      navigate('/cabinet', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить пароль')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Новый пароль"
      subtitle="Задайте новый пароль для входа в аккаунт."
      footer={
        <p>
          <Link to="/forgot-password" className="font-medium text-icl-accent hover:underline">
            Запросить новую ссылку
          </Link>
          {' · '}
          <Link to="/login" className="font-medium text-icl-accent hover:underline">
            Войти
          </Link>
        </p>
      }
    >
      {checking ? (
        <p className="text-sm text-icl-muted">Проверяем ссылку…</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField label="Новый пароль" htmlFor="reset-password" required>
            <input
              id="reset-password"
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={!ready}
            />
          </FormField>
          <FormField label="Подтверждение" htmlFor="reset-password-2" required>
            <input
              id="reset-password-2"
              type="password"
              className={inputClass}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              disabled={!ready}
            />
          </FormField>
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={submitting || !configured || !ready}>
            {submitting ? 'Сохраняем…' : 'Сохранить пароль'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
