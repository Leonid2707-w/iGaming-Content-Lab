import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/FormField'
import { useAdminAuth } from '@/context/AdminAuthContext'

interface AdminUserRow {
  id: string
  userId: string
  email: string
  fullName: string
  telegramUsername: string
  accountStatus: 'active' | 'blocked'
  createdAt: string
  lastSignInAt: string | null
}

export function AdminUsersPage() {
  const { apiToken } = useAdminAuth()
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<AdminUserRow | null>(null)
  const [statusBusy, setStatusBusy] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const load = useCallback(async () => {
    if (!apiToken) return
    setLoading(true)
    setError('')
    try {
      const query = new URLSearchParams({ search: debouncedSearch, sort, status })
      const response = await fetch(`/api/admin/users?${query}`, {
        headers: { Authorization: `Bearer ${apiToken}` },
      })
      const data = (await response.json()) as {
        ok: boolean
        users?: AdminUserRow[]
        error?: string
      }
      if (!data.ok) throw new Error(data.error || 'Ошибка загрузки')
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [apiToken, debouncedSearch, sort, status])

  useEffect(() => {
    void load()
  }, [load])

  async function setUserStatus(userId: string, nextStatus: 'active' | 'blocked') {
    if (!apiToken) return
    const label = nextStatus === 'blocked' ? 'заблокировать' : 'разблокировать'
    if (!window.confirm(`Точно ${label} этого пользователя?`)) return

    setStatusBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = (await response.json()) as { ok: boolean; error?: string }
      if (!data.ok) {
        setError(data.error || 'Не удалось обновить статус')
        return
      }
      await load()
      setSelected((current) =>
        current && current.userId === userId
          ? { ...current, accountStatus: nextStatus }
          : current,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить статус')
    } finally {
      setStatusBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-icl-text">Пользователи</h1>
        <p className="mt-2 text-sm text-icl-muted">
          Поиск, просмотр профилей, блокировка и разблокировка аккаунтов.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className={`${inputClass} max-w-xs`}
          placeholder="Поиск…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={inputClass} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
        </select>
        <select
          className={inputClass}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Все статусы</option>
          <option value="active">Активные</option>
          <option value="blocked">Заблокированные</option>
        </select>
        <Button type="button" variant="outline-dark" onClick={() => void load()}>
          Обновить
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}
      {loading && <p className="text-sm text-icl-muted">Загрузка…</p>}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="overflow-x-auto rounded-2xl border border-icl-border bg-icl-card">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-icl-border text-[11px] uppercase tracking-[0.08em] text-icl-subtle">
              <tr>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Имя</th>
                <th className="px-3 py-3">Telegram</th>
                <th className="px-3 py-3">Регистрация</th>
                <th className="px-3 py-3">Вход</th>
                <th className="px-3 py-3">Статус</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.userId}
                  className="cursor-pointer border-b border-icl-border/70 last:border-0 hover:bg-icl-surface-alt/60"
                  onClick={() => setSelected(user)}
                >
                  <td className="px-3 py-3 text-icl-text">{user.email}</td>
                  <td className="px-3 py-3 text-icl-muted">{user.fullName || '—'}</td>
                  <td className="px-3 py-3 text-icl-muted">{user.telegramUsername || '—'}</td>
                  <td className="px-3 py-3 text-icl-muted">
                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-3 py-3 text-icl-muted">
                    {user.lastSignInAt
                      ? new Date(user.lastSignInAt).toLocaleDateString('ru-RU')
                      : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        user.accountStatus === 'blocked'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}
                    >
                      {user.accountStatus === 'blocked' ? 'Заблокирован' : 'Активен'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && users.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-icl-muted">Пользователи не найдены.</p>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-icl-border bg-icl-card p-5">
          {selected ? (
            <div className="space-y-3 text-sm">
              <h2 className="font-display text-lg font-semibold text-icl-text">Профиль</h2>
              <p>
                <span className="text-icl-subtle">ID:</span> {selected.userId}
              </p>
              <p>
                <span className="text-icl-subtle">Email:</span> {selected.email}
              </p>
              <p>
                <span className="text-icl-subtle">Имя:</span> {selected.fullName || '—'}
              </p>
              <p>
                <span className="text-icl-subtle">Telegram:</span>{' '}
                {selected.telegramUsername || '—'}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {selected.accountStatus === 'active' ? (
                  <Button
                    type="button"
                    variant="outline-dark"
                    disabled={statusBusy}
                    onClick={() => void setUserStatus(selected.userId, 'blocked')}
                  >
                    Заблокировать
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline-dark"
                    disabled={statusBusy}
                    onClick={() => void setUserStatus(selected.userId, 'active')}
                  >
                    Разблокировать
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-icl-muted">Выберите пользователя в таблице.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
