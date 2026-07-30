import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, RefreshCw } from 'lucide-react'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/api/orders'
import { fetchAdminStats, type AdminStats } from '@/api/stats'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/FormField'
import { useAdminAuth } from '@/context/AdminAuthContext'

type Preset = '7d' | '30d' | '90d' | 'all' | 'custom'

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: '#0ea5e9',
  in_progress: '#f59e0b',
  done: '#10b981',
  cancelled: '#ef4444',
}

function toInputDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value))
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function formatDayLabel(isoDate: string) {
  const [, month, day] = isoDate.split('-')
  return `${day}.${month}`
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-icl-border bg-icl-card px-3 py-2 text-xs shadow-card">
      <p className="mb-1 font-medium text-icl-text">{label}</p>
      {payload.map((item) => (
        <p key={String(item.name)} style={{ color: item.color }} className="text-icl-muted">
          {item.name}: {formatNumber(Number(item.value) || 0)}
        </p>
      ))}
    </div>
  )
}

export function AdminStatsPage() {
  const { apiToken } = useAdminAuth()
  const [preset, setPreset] = useState<Preset>('30d')
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - 29)
    return toInputDate(d)
  })
  const [to, setTo] = useState(() => toInputDate(new Date()))
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!apiToken) {
      setError('Нужно войти заново, чтобы открыть статистику.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const params =
        preset === 'custom'
          ? { from: `${from}T00:00:00.000Z`, to: `${to}T23:59:59.999Z` }
          : { preset }
      const result = await fetchAdminStats(apiToken, params)
      setStats(result.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки статистики')
    } finally {
      setLoading(false)
    }
  }, [apiToken, from, preset, to])

  useEffect(() => {
    void load()
  }, [load])

  const dailyChart = useMemo(
    () =>
      (stats?.daily || []).map((point) => ({
        ...point,
        label: formatDayLabel(point.date),
      })),
    [stats],
  )

  const statusChart = useMemo(() => {
    if (!stats) return []
    return (Object.keys(stats.orders.byStatus) as OrderStatus[]).map((status) => ({
      name: ORDER_STATUS_LABELS[status],
      value: stats.orders.byStatus[status],
      color: STATUS_COLORS[status],
    }))
  }, [stats])

  const presets: Array<{ id: Preset; label: string }> = [
    { id: '7d', label: '7 дней' },
    { id: '30d', label: '30 дней' },
    { id: '90d', label: '90 дней' },
    { id: 'all', label: 'Всё время' },
    { id: 'custom', label: 'Период' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-icl-text">Статистика</h1>
          <p className="mt-2 text-sm text-icl-muted">
            Посещения сайта и заказы за выбранный период.
          </p>
        </div>
        <Button type="button" variant="outline-dark" onClick={() => void load()}>
          <RefreshCw size={14} />
          Обновить
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-icl-border bg-icl-card p-4">
        <div className="flex flex-wrap gap-2">
          {presets.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPreset(item.id)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                preset === item.id
                  ? 'bg-icl-accent text-white'
                  : 'border border-icl-border text-icl-muted hover:bg-icl-surface-alt hover:text-icl-text'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {preset === 'custom' ? (
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-icl-subtle">
              С
              <input
                type="date"
                className={`${inputClass} mt-1 w-auto`}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="text-xs text-icl-subtle">
              По
              <input
                type="date"
                className={`${inputClass} mt-1 w-auto`}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      ) : null}

      {loading && !stats ? (
        <div className="rounded-2xl border border-icl-border bg-icl-card p-8 text-center text-sm text-icl-muted">
          Загрузка статистики…
        </div>
      ) : null}

      {stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Посещения" value={formatNumber(stats.visits.total)} />
            <MetricCard label="Уникальные посещения" value={formatNumber(stats.visits.unique)} />
            <MetricCard label="Заказы" value={formatNumber(stats.orders.total)} />
            <MetricCard
              label="Конверсия"
              value={`${stats.conversionRate.toFixed(1)}%`}
              hint="заказы / уникальные"
            />
            <MetricCard label="Сумма заказов" value={formatMoney(stats.orders.revenueTotal)} />
            <MetricCard label="Выполнено (сумма)" value={formatMoney(stats.orders.revenueDone)} />
            <MetricCard label="Средний чек" value={formatMoney(stats.orders.avgCheck)} />
            <MetricCard
              label="Новые / в работе"
              value={`${stats.orders.byStatus.new} / ${stats.orders.byStatus.in_progress}`}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-2xl border border-icl-border bg-icl-card p-5">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-icl-text">
                <BarChart3 size={18} className="text-icl-accent" />
                Посещения по дням
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyChart}>
                    <defs>
                      <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="uniqueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-icl-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="currentColor" className="text-icl-subtle" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="currentColor" className="text-icl-subtle" />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="visits"
                      name="Посещения"
                      stroke="#6366f1"
                      fill="url(#visitsFill)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="uniqueVisits"
                      name="Уникальные"
                      stroke="#06b6d4"
                      fill="url(#uniqueFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-icl-border bg-icl-card p-5">
              <h2 className="mb-4 font-display text-lg font-semibold text-icl-text">Заказы по дням</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-icl-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="currentColor" className="text-icl-subtle" />
                    <YAxis allowDecimals={false} yAxisId="left" tick={{ fontSize: 11 }} stroke="currentColor" className="text-icl-subtle" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                      className="text-icl-subtle"
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="orders" name="Заказы" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    <Bar yAxisId="right" dataKey="revenue" name="Сумма" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-2xl border border-icl-border bg-icl-card p-5">
              <h2 className="mb-4 font-display text-lg font-semibold text-icl-text">Статусы заказов</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChart}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {statusChart.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-icl-border bg-icl-card p-5">
              <h2 className="mb-4 font-display text-lg font-semibold text-icl-text">По услугам</h2>
              {stats.orders.byService.length === 0 ? (
                <p className="text-sm text-icl-muted">Заказов за период нет.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-icl-subtle">
                      <tr>
                        <th className="pb-3 pr-4 font-medium">Услуга</th>
                        <th className="pb-3 pr-4 font-medium">Заказов</th>
                        <th className="pb-3 font-medium">Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.orders.byService.map((row) => (
                        <tr key={row.service} className="border-t border-icl-border/70">
                          <td className="py-3 pr-4 text-icl-text">{row.service}</td>
                          <td className="py-3 pr-4 text-icl-muted">{row.count}</td>
                          <td className="py-3 text-icl-muted">{formatMoney(row.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <section className="rounded-2xl border border-icl-border bg-icl-card p-5">
            <h2 className="mb-4 font-display text-lg font-semibold text-icl-text">Популярные страницы</h2>
            {stats.visits.topPaths.length === 0 ? (
              <p className="text-sm text-icl-muted">
                Пока нет данных по посещениям. Откройте публичные страницы сайта — трекер начнёт
                писать статистику автоматически.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {stats.visits.topPaths.map((row) => (
                  <div
                    key={row.path}
                    className="flex items-center justify-between rounded-xl border border-icl-border/70 bg-icl-surface-alt/40 px-3 py-2 text-sm"
                  >
                    <span className="truncate text-icl-text">{row.path}</span>
                    <span className="ml-3 shrink-0 font-medium text-icl-accent">{row.count}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
      <p className="text-xs uppercase tracking-[0.12em] text-icl-subtle">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-icl-text sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-icl-subtle">{hint}</p> : null}
    </div>
  )
}
