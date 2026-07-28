import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { FormField, inputClass } from '@/components/ui/FormField'
import { normalizeTelegramUsername } from '@/config/auth'
import { useAuth } from '@/context/AuthContext'

function metaString(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key]
  return typeof value === 'string' ? value : ''
}

export function CabinetProfilePage() {
  const { profile, user, updateProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [telegram, setTelegram] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const metaName = metaString(user?.user_metadata, 'full_name')
    const metaTelegram = metaString(user?.user_metadata, 'telegram_username')
    setFullName(profile?.full_name || metaName || '')
    setTelegram(
      normalizeTelegramUsername(profile?.telegram_username || metaTelegram || ''),
    )
  }, [profile, user])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setError('')
    setSaving(true)
    const result = await updateProfile({
      full_name: fullName,
      telegram_username: telegram,
    })
    setSaving(false)
    if (!result.ok) {
      setError(result.error || 'Не удалось сохранить')
      return
    }
    setMessage('Профиль обновлён')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-icl-text">Профиль</h1>
        <p className="mt-2 text-sm text-icl-muted">
          Данные из регистрации подставляются автоматически. При необходимости их можно изменить.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-icl-border bg-icl-card p-5 sm:p-6"
      >
        <FormField label="Имя" htmlFor="profile-name" required>
          <input
            id="profile-name"
            className={inputClass}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </FormField>

        <FormField label="Telegram" htmlFor="profile-tg" required>
          <input
            id="profile-tg"
            className={inputClass}
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
          />
        </FormField>

        {message && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? 'Сохраняем…' : 'Сохранить изменения'}
        </Button>
      </form>
    </div>
  )
}
