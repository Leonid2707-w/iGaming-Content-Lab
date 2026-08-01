import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { FormField, inputClass } from '@/components/ui/FormField'
import {
  formatServicePriceLine,
  serviceCategories,
  type PriceMode,
  type StandardService,
} from '@/config/content/services'
import { PRICE_UNITS } from '@/config/priceUnits'
import { useServices } from '@/context/ServicesContext'

export function AdminServicesPage() {
  const {
    services,
    updateService,
    setServiceUnit,
    toggleService,
    resetServices,
    syncing,
    syncError,
  } = useServices()
  const [selectedId, setSelectedId] = useState(services[0]?.id ?? '')
  const [savedFlash, setSavedFlash] = useState(false)

  const selected = useMemo(
    () => services.find((service) => service.id === selectedId) ?? services[0],
    [selectedId, services],
  )

  function patch(partial: Partial<StandardService>) {
    if (!selected) return
    updateService(selected.id, partial)
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1200)
  }

  if (!selected) {
    return <p className="text-icl-muted">Нет услуг для редактирования.</p>
  }

  const preview = formatServicePriceLine(selected)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-icl-text">
            Управление услугами
          </h1>
          <p className="mt-2 text-sm text-icl-muted">
            Название, цена, единица расчёта и видимость на сайте. Цены «Ведение Telegram» и
            «Telegram-посты» автоматически участвуют в расчёте заказа ведения Telegram.
          </p>
          <p className="mt-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-700 dark:text-sky-300">
            Каталог синхронизируется с Supabase (`site_services`). Нужна миграция
            `005_site_services_partners.sql`. Локальный кэш — fallback.
            {syncing ? ' Сохранение в облако…' : ''}
            {syncError ? ` Ошибка облака: ${syncError}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedFlash && (
            <span className="text-xs font-medium text-emerald-500">Сохранено</span>
          )}
          <Button type="button" variant="outline-dark" onClick={resetServices}>
            Сбросить к умолчанию
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          {serviceCategories.map((category) => {
            const items = services.filter((service) => service.category === category.id)
            return (
              <div key={category.id} className="rounded-2xl border border-icl-border bg-icl-card p-3">
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-icl-subtle">
                  {category.label}
                </p>
                <ul className="space-y-1">
                  {items.map((service) => (
                    <li key={service.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(service.id)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                          selected.id === service.id
                            ? 'bg-icl-accent-soft text-icl-accent'
                            : 'text-icl-muted hover:bg-icl-surface-alt hover:text-icl-text'
                        }`}
                      >
                        <span className="truncate pr-2">{service.title}</span>
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            service.enabled ? 'bg-emerald-500' : 'bg-icl-subtle'
                          }`}
                          title={service.enabled ? 'Включена' : 'Выключена'}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </aside>

        <section className="rounded-2xl border border-icl-border bg-icl-card p-5 sm:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-icl-border pb-5">
            <div>
              <h2 className="font-display text-xl font-semibold text-icl-text">
                {selected.title}
              </h2>
              <p className="mt-1 text-sm text-icl-muted">ID: {selected.id}</p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-icl-muted">
              <span>Показывать на сайте</span>
              <button
                type="button"
                role="switch"
                aria-checked={selected.enabled}
                onClick={() => toggleService(selected.id)}
                className={`relative h-7 w-12 rounded-full transition ${
                  selected.enabled ? 'bg-icl-accent' : 'bg-icl-surface-alt'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                    selected.enabled ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </label>
          </div>

          <div className="grid gap-5">
            <FormField label="Название услуги" htmlFor="service-title" required>
              <input
                id="service-title"
                className={inputClass}
                value={selected.title}
                onChange={(event) => patch({ title: event.target.value })}
              />
            </FormField>

            <FormField label="Описание" htmlFor="service-description">
              <textarea
                id="service-description"
                rows={4}
                className={inputClass}
                value={selected.description}
                onChange={(event) => patch({ description: event.target.value })}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Тип цены" htmlFor="price-mode">
                <select
                  id="price-mode"
                  className={inputClass}
                  value={selected.priceMode}
                  onChange={(event) =>
                    patch({ priceMode: event.target.value as PriceMode })
                  }
                >
                  <option value="numeric">Числовая</option>
                  <option value="text">Текстовая / индивидуально</option>
                </select>
              </FormField>

              <FormField label="Единица расчёта" htmlFor="price-unit">
                <select
                  id="price-unit"
                  className={inputClass}
                  value={selected.unitId}
                  onChange={(event) =>
                    setServiceUnit(selected.id, event.target.value as StandardService['unitId'])
                  }
                  disabled={selected.priceMode === 'text'}
                >
                  {PRICE_UNITS.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {selected.priceMode === 'numeric' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Цена (число)" htmlFor="price-value" hint="Например: 1 или 90">
                  <input
                    id="price-value"
                    type="number"
                    min={0}
                    step="0.1"
                    className={inputClass}
                    value={selected.price ?? ''}
                    onChange={(event) => {
                      const value = event.target.value
                      patch({
                        price: value === '' ? undefined : Number(value),
                        priceMode: 'numeric',
                      })
                    }}
                  />
                </FormField>
                <FormField
                  label="Префикс"
                  htmlFor="price-prefix"
                  hint="Например: от. Можно оставить пустым."
                >
                  <input
                    id="price-prefix"
                    className={inputClass}
                    value={selected.pricePrefix ?? ''}
                    onChange={(event) =>
                      patch({ pricePrefix: event.target.value || undefined })
                    }
                    placeholder="от"
                  />
                </FormField>
              </div>
            ) : (
              <FormField
                label="Текстовая стоимость"
                htmlFor="price-text"
                hint="Например: Индивидуально"
              >
                <input
                  id="price-text"
                  className={inputClass}
                  value={selected.priceText ?? ''}
                  onChange={(event) =>
                    patch({ priceText: event.target.value, priceMode: 'text' })
                  }
                  placeholder="Индивидуально"
                />
              </FormField>
            )}

            <div className="rounded-2xl border border-dashed border-icl-border bg-icl-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-icl-subtle">
                Превью на сайте
              </p>
              <p className="mt-3 font-display text-lg font-semibold text-icl-text">
                {selected.title}
              </p>
              <p className="mt-2 text-icl-accent">{preview}</p>
              <p className="mt-3 text-sm leading-relaxed text-icl-muted">
                {selected.description}
              </p>
              {(selected.id === 'telegram-management' || selected.id === 'telegram-post') && (
                <p className="mt-4 rounded-xl border border-icl-border bg-icl-card px-3 py-2 text-xs text-icl-muted">
                  Эта цена используется в авторасчёте заказа «Ведение соцсетей → Telegram».
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
