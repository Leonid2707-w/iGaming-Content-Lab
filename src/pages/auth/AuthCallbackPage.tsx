import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { parseAuthHash } from '@/lib/authSession'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { applySession } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const fromHash = parseAuthHash(window.location.hash)
    if (!fromHash) {
      setError('Не удалось подтвердить сессию. Войдите снова.')
      return
    }

    void applySession(fromHash).then((result) => {
      if (!result.ok) {
        setError(result.error || 'Не удалось подтвердить сессию. Войдите снова.')
        return
      }
      window.history.replaceState(null, '', window.location.pathname)
      navigate('/cabinet', { replace: true })
    })
  }, [applySession, navigate])

  return (
    <AuthShell title="Подтверждение" subtitle="Завершаем вход…">
      {error ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
          <Button to="/login" className="w-full">
            Ко входу
          </Button>
          <p className="text-center text-sm text-icl-muted">
            <Link to="/" className="text-icl-accent hover:underline">
              На главную
            </Link>
          </p>
        </div>
      ) : (
        <p className="text-sm text-icl-muted">Подождите немного…</p>
      )}
    </AuthShell>
  )
}
