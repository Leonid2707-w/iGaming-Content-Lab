import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react'
import {
  AdminAuthError,
  ORDER_STATUS_LABELS,
  deleteAdminOrder,
  fetchAdminOrder,
  resendAdminOrderTelegram,
  updateAdminOrderStatus,
  type OrderDto,
  type OrderHistoryDto,
  type OrderStatus,
} from '@/api/orders'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/FormField'
import { useAdminAuth } from '@/context/AdminAuthContext'

function formatDate(value: string) {
  return new Date(value).toLocaleString('ru-RU')
}

function isImage(mime: string) {
  return mime.startsWith('image/')
}

function isVideo(mime: string) {
  return mime.startsWith('video/')
}

export function AdminOrderDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { apiToken, logout, openLoginModal, can } = useAdminAuth()
  const [order, setOrder] = useState<OrderDto | null>(null)
  const [history, setHistory] = useState<OrderHistoryDto[]>([])
  const [status, setStatus] = useState<OrderStatus>('new')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')

  const handleAuthError = useCallback(
    (err: unknown, fallback: string) => {
      if (err instanceof AdminAuthError) {
        logout()
        openLoginModal()
        setError('Сессия истекла — войдите снова.')
        return
      }
      setError(err instanceof Error ? err.message : fallback)
    },
    [logout, openLoginModal],
  )

  const load = useCallback(async () => {
    if (!apiToken || !id) return
    setLoading(true)
    setError('')
    try {
      const result = await fetchAdminOrder(apiToken, id)
      setOrder(result.order)
      setHistory(result.history || [])
      setStatus(result.order.status)
    } catch (err) {
      handleAuthError(err, 'Ошибка загрузки заявки')
    } finally {
      setLoading(false)
    }
  }, [apiToken, handleAuthError, id])

  useEffect(() => {
    void load()
  }, [load])

  async function handleStatusSave() {
    if (!apiToken || !order) return
    setSaving(true)
    setError('')
    try {
      const result = await updateAdminOrderStatus(apiToken, order.id, status)
      setOrder(result.order)
      setHistory(result.history || [])
    } catch (err) {
      handleAuthError(err, 'Не удалось обновить статус')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!apiToken || !order) return
    if (!window.confirm(`Удалить заявку ${order.public_id}?`)) return
    try {
      await deleteAdminOrder(apiToken, order.id)
      navigate('/admin/orders')
    } catch (err) {
      handleAuthError(err, 'Не удалось удалить заявку')
    }
  }

  async function handleResendTelegram() {
    if (!apiToken || !order) return
    setResending(true)
    setError('')
    try {
      const result = await resendAdminOrderTelegram(apiToken, order.id)
      if (result.order) setOrder(result.order)
      if (!result.ok) setError(result.error || 'Не удалось отправить в Telegram')
    } catch (err) {
      handleAuthError(err, 'Не удалось отправить в Telegram')
    } finally {
      setResending(false)
    }
  }

  if (loading) {
    return <p className="text-icl-muted">Загрузка заявки…</p>
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <p className="text-red-500">{error || 'Заявка не найдена'}</p>
        <Link to="/admin/orders" className="text-sm text-icl-accent hover:underline">
          Назад к списку
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 rounded-xl border border-icl-border px-3 py-2 text-sm text-icl-muted transition hover:bg-icl-surface-alt hover:text-icl-text"
          >
            <ArrowLeft size={14} />
            Назад
          </Link>
          <div>
            <h1 className="font-display text-2xl font-semibold text-icl-text">{order.public_id}</h1>
            <p className="text-sm text-icl-muted">{formatDate(order.created_at)}</p>
          </div>
        </div>
        {can('orders.delete') ? (
          <Button type="button" variant="outline-dark" onClick={() => void handleDelete()}>
            <Trash2 size={14} />
            Удалить
          </Button>
        ) : null}
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="space-y-4 rounded-2xl border border-icl-border bg-icl-card p-5">
          <h2 className="font-display text-lg font-semibold text-icl-text">Детали заявки</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-icl-subtle">Клиент</dt>
              <dd className="mt-1 text-icl-text">{order.client_telegram}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-icl-subtle">Услуга</dt>
              <dd className="mt-1 text-icl-text">{order.service_title}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-icl-subtle">Платформа</dt>
              <dd className="mt-1 text-icl-text">{order.platform || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-icl-subtle">Количество</dt>
              <dd className="mt-1 text-icl-text">{order.quantity_label || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-icl-subtle">Стоимость</dt>
              <dd className="mt-1 text-icl-accent">
                {order.price_label || (order.price != null ? `${order.price}$` : '—')}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-icl-subtle">Telegram уведомление</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-3 text-icl-muted">
                <span>
                  {order.telegram_sent ? 'Отправлено' : order.telegram_error || 'Не отправлено'}
                </span>
                {can('orders.status') ? (
                  <Button
                    type="button"
                    variant="outline-dark"
                    disabled={resending}
                    onClick={() => void handleResendTelegram()}
                  >
                    {resending ? 'Отправка…' : 'Повторить Telegram'}
                  </Button>
                ) : null}
              </dd>
            </div>
          </dl>

          <div>
            <h3 className="text-sm font-medium text-icl-text">Описание</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-icl-muted">
              {order.description || '—'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-icl-text">Референсы</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-icl-muted">
              {order.references_text || '—'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-icl-text">Ссылки</h3>
            {order.links.length ? (
              <ul className="mt-2 space-y-2">
                {order.links.map((link) => {
                  const href = /^https?:\/\//i.test(link) ? link : `https://${link}`
                  return (
                  <li key={link}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-icl-accent hover:underline"
                    >
                      {link}
                      <ExternalLink size={12} />
                    </a>
                  </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-icl-muted">—</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-icl-text">Файлы</h3>
            {order.files.length ? (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {order.files.map((file) => (
                  <div
                    key={file.path}
                    className="overflow-hidden rounded-xl border border-icl-border bg-icl-surface"
                  >
                    {isImage(file.mime) ? (
                      <div className="flex max-h-[420px] items-center justify-center bg-icl-bg/60 p-2">
                        <img
                          src={file.url}
                          alt={file.name}
                          className="max-h-[400px] w-full object-contain"
                        />
                      </div>
                    ) : isVideo(file.mime) ? (
                      <div className="flex items-center justify-center bg-black/90 p-2">
                        <video
                          src={file.url}
                          controls
                          className="max-h-[480px] w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-icl-muted">
                        {file.name}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 border-t border-icl-border px-3 py-2">
                      <span className="truncate text-xs text-icl-muted">{file.name}</span>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-icl-accent hover:underline"
                      >
                        Открыть
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-icl-muted">Файлы не прикреплены</p>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
            <h2 className="font-display text-lg font-semibold text-icl-text">Статус</h2>
            <select
              className={`${inputClass} mt-4`}
              value={status}
              disabled={!can('orders.status')}
              onChange={(event) => setStatus(event.target.value as OrderStatus)}
            >
              {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((key) => (
                <option key={key} value={key}>
                  {ORDER_STATUS_LABELS[key]}
                </option>
              ))}
            </select>
            {can('orders.status') ? (
              <Button
                type="button"
                className="mt-4 w-full"
                disabled={saving || status === order.status}
                onClick={() => void handleStatusSave()}
              >
                {saving ? 'Сохранение…' : 'Сохранить статус'}
              </Button>
            ) : (
              <p className="mt-3 text-xs text-icl-subtle">Нет права на изменение статуса.</p>
            )}
          </div>

          <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
            <h2 className="font-display text-lg font-semibold text-icl-text">История</h2>
            <ul className="mt-4 space-y-3">
              {history.length === 0 ? (
                <li className="text-sm text-icl-muted">История пуста</li>
              ) : (
                history.map((item) => (
                  <li key={item.id} className="rounded-xl border border-icl-border bg-icl-surface px-3 py-3">
                    <p className="text-sm font-medium text-icl-text">
                      {ORDER_STATUS_LABELS[item.status]}
                    </p>
                    <p className="mt-1 text-xs text-icl-muted">{formatDate(item.created_at)}</p>
                    {item.note && <p className="mt-2 text-xs text-icl-muted">{item.note}</p>}
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
