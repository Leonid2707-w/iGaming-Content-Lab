import { useCallback, useEffect, useState } from 'react'
import { Shield, Trash2, UserPlus } from 'lucide-react'
import {
  createAdminRequest,
  deleteAdminRequest,
  fetchAdmins,
  updateAdminRequest,
  type AdminDto,
} from '@/api/admins'
import { AdminAuthError } from '@/api/orders'
import { Button } from '@/components/ui/Button'
import { FormField, inputClass } from '@/components/ui/FormField'
import {
  ADMIN_PERMISSION_GROUPS,
  type AdminPermission,
} from '@/config/adminPermissions'
import { useAdminAuth } from '@/context/AdminAuthContext'

export function AdminAdminsPage() {
  const { apiToken, isOwner, can, canAny, logout, openLoginModal } = useAdminAuth()
  const [admins, setAdmins] = useState<AdminDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [permissions, setPermissions] = useState<AdminPermission[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const canManage = canAny('admins.create', 'admins.delete', 'admins.permissions') || isOwner

  const load = useCallback(async () => {
    if (!apiToken || !canManage) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await fetchAdmins(apiToken)
      setAdmins(result.admins || [])
    } catch (err) {
      if (err instanceof AdminAuthError) {
        logout()
        openLoginModal()
        setError('Сессия истекла — войдите снова.')
      } else {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки')
      }
    } finally {
      setLoading(false)
    }
  }, [apiToken, canManage, logout, openLoginModal])

  useEffect(() => {
    void load()
  }, [load])

  function togglePermission(key: AdminPermission) {
    setPermissions((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    )
  }

  function selectAdmin(admin: AdminDto) {
    if (admin.isOwner) {
      setSelectedId(admin.id)
      setLogin(admin.login)
      setDisplayName(admin.displayName)
      setIsActive(admin.isActive)
      setPermissions([])
      setPassword('')
      return
    }
    setSelectedId(admin.id)
    setLogin(admin.login)
    setDisplayName(admin.displayName)
    setIsActive(admin.isActive)
    setPermissions(admin.permissions)
    setPassword('')
  }

  function resetForm() {
    setSelectedId(null)
    setLogin('')
    setPassword('')
    setDisplayName('')
    setIsActive(true)
    setPermissions([])
  }

  async function handleCreate() {
    if (!apiToken || !isOwner) return
    setSaving(true)
    setError('')
    try {
      await createAdminRequest(apiToken, {
        login,
        password,
        displayName,
        isActive,
        permissions,
      })
      resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate() {
    if (!apiToken || !selectedId || !can('admins.permissions')) return
    setSaving(true)
    setError('')
    try {
      await updateAdminRequest(apiToken, selectedId, {
        displayName,
        isActive,
        permissions,
        password: password || undefined,
      })
      setPassword('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(admin: AdminDto) {
    if (!apiToken || !can('admins.delete')) return
    if (admin.isOwner) return
    if (!window.confirm(`Удалить администратора ${admin.login}?`)) return
    try {
      await deleteAdminRequest(apiToken, admin.id)
      if (selectedId === admin.id) resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить')
    }
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-icl-border bg-icl-card p-6 text-sm text-icl-muted">
        Нет доступа к разделу администраторов.
      </div>
    )
  }

  const selected = admins.find((item) => item.id === selectedId)
  const editingOwner = Boolean(selected?.isOwner)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-icl-text">Администраторы</h1>
        <p className="mt-2 text-sm text-icl-muted">
          Владелец имеет полный доступ. Остальным права выдаются независимо.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="rounded-2xl border border-icl-border bg-icl-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-icl-text">Список</h2>
            {isOwner ? (
              <Button type="button" variant="outline-dark" className="!px-3 !py-2 !text-xs" onClick={resetForm}>
                <UserPlus size={14} />
                Новый
              </Button>
            ) : null}
          </div>
          {loading ? (
            <p className="text-sm text-icl-muted">Загрузка…</p>
          ) : (
            <ul className="divide-y divide-icl-border">
              {admins.map((admin) => (
                <li key={admin.id} className="flex items-center gap-2 py-3">
                  <button
                    type="button"
                    onClick={() => selectAdmin(admin)}
                    className={`min-w-0 flex-1 rounded-xl px-3 py-2 text-left transition ${
                      selectedId === admin.id
                        ? 'bg-icl-accent-soft text-icl-accent'
                        : 'hover:bg-icl-surface-alt'
                    }`}
                  >
                    <p className="truncate text-sm font-medium text-icl-text">
                      {admin.login}
                      {admin.isOwner ? (
                        <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-icl-accent">
                          <Shield size={12} /> Владелец
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-icl-muted">
                      {admin.displayName || 'Без имени'} · {admin.isActive ? 'активен' : 'отключён'}
                    </p>
                  </button>
                  {!admin.isOwner && can('admins.delete') ? (
                    <button
                      type="button"
                      onClick={() => void handleDelete(admin)}
                      className="rounded-lg p-2 text-icl-subtle hover:bg-red-500/10 hover:text-red-500"
                      aria-label={`Удалить ${admin.login}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-icl-text">
            {selectedId ? (editingOwner ? 'Владелец (только просмотр)' : 'Редактирование') : 'Создание'}
          </h2>

          {editingOwner ? (
            <p className="mb-4 rounded-xl border border-icl-border bg-icl-surface px-4 py-3 text-sm text-icl-muted">
              Роль владельца нельзя удалить, заблокировать или изменить права. Пароль задаётся через{' '}
              <code className="text-icl-text">ADMIN_PASSWORD</code> в конфигурации сервера.
            </p>
          ) : null}

          <div className="space-y-4">
            <FormField label="Логин" htmlFor="admin-login" required>
              <input
                id="admin-login"
                className={inputClass}
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                disabled={Boolean(selectedId)}
                autoComplete="off"
              />
            </FormField>
            <FormField
              label={selectedId ? 'Новый пароль (опционально)' : 'Пароль'}
              htmlFor="admin-password"
              required={!selectedId}
            >
              <input
                id="admin-password"
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={editingOwner}
                autoComplete="new-password"
              />
            </FormField>
            <FormField label="Имя" htmlFor="admin-name">
              <input
                id="admin-name"
                className={inputClass}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={editingOwner}
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm text-icl-muted">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={editingOwner}
              />
              Активен
            </label>

            <div className="space-y-4">
              {ADMIN_PERMISSION_GROUPS.map((group) => (
                <fieldset
                  key={group.id}
                  disabled={editingOwner || (!isOwner && !can('admins.permissions') && Boolean(selectedId))}
                  className="rounded-xl border border-icl-border p-4 disabled:opacity-60"
                >
                  <legend className="px-1 text-sm font-semibold text-icl-text">{group.title}</legend>
                  <div className="mt-2 space-y-2">
                    {group.permissions.map((item) => (
                      <label key={item.key} className="flex items-start gap-2 text-sm text-icl-muted">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={permissions.includes(item.key)}
                          onChange={() => togglePermission(item.key)}
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>

            {!editingOwner ? (
              <div className="flex flex-wrap gap-3 pt-2">
                {!selectedId && isOwner ? (
                  <Button type="button" disabled={saving} onClick={() => void handleCreate()}>
                    {saving ? 'Создание…' : 'Создать администратора'}
                  </Button>
                ) : null}
                {selectedId && can('admins.permissions') ? (
                  <Button type="button" disabled={saving} onClick={() => void handleUpdate()}>
                    {saving ? 'Сохранение…' : 'Сохранить изменения'}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {!isOwner && !selectedId ? (
              <p className="text-sm text-icl-muted">Создавать администраторов может только владелец.</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
