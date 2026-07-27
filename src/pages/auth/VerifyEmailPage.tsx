import { Link, useLocation } from 'react-router-dom'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'

export function VerifyEmailPage() {
  const { user, emailConfirmed, logout, refreshProfile } = useAuth()
  const location = useLocation()
  const state = location.state as { email?: string; warning?: string } | null
  const email = state?.email || user?.email || 'ваш email'

  if (emailConfirmed) {
    return (
      <AuthShell title="Email подтверждён" subtitle="Можно переходить в личный кабинет.">
        <Button to="/cabinet" className="w-full">
          Открыть кабинет
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Подтвердите email"
      subtitle="Мы отправили письмо со ссылкой подтверждения. До подтверждения доступ к личному кабинету ограничен."
      footer={
        <p>
          Не тот аккаунт?{' '}
          <button
            type="button"
            className="font-medium text-icl-accent hover:underline"
            onClick={() => void logout()}
          >
            Выйти
          </button>
          {' · '}
          <Link to="/login" className="font-medium text-icl-accent hover:underline">
            Войти
          </Link>
        </p>
      }
    >
      <div className="space-y-4 text-sm text-icl-muted">
        {state?.warning && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-700 dark:text-amber-400">
            {state.warning}
          </div>
        )}
        <p>
          Письмо отправлено на <span className="font-medium text-icl-text">{email}</span>.
          Проверьте «Входящие» и «Спам».
        </p>
        <p>
          После подтверждения войдите в аккаунт — кабинет откроется автоматически.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline-dark"
            className="w-full"
            onClick={() => void refreshProfile()}
          >
            Я подтвердил(а) email
          </Button>
          <Button to="/login" variant="outline-dark" className="w-full">
            Войти
          </Button>
        </div>
        <p className="text-xs text-icl-subtle">
          Нужна помощь? Напишите нам через раздел{' '}
          <Link to="/#contact" className="text-icl-accent hover:underline">
            Контакты
          </Link>
          .
        </p>
      </div>
    </AuthShell>
  )
}
