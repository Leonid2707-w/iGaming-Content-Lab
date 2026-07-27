import { ArrowDown, ArrowUp, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { uploadPortfolioVideo } from '@/api/portfolio'
import { Button } from '@/components/ui/Button'
import { FormField, inputClass } from '@/components/ui/FormField'
import {
  VIDEO_EXAMPLE_GROUPS,
  VIDEO_MAX_BYTES,
  type VideoExampleGroupId,
} from '@/config/content/videoExamples'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { useVideoExamples } from '@/context/VideoExamplesContext'

function formatBytes(size: number) {
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function AdminPortfolioPage() {
  const { apiToken } = useAdminAuth()
  const {
    getExamples,
    getSettings,
    updateSettings,
    updateExample,
    removeExampleMedia,
    moveExample,
    resetExamples,
  } = useVideoExamples()
  const [groupId, setGroupId] = useState<VideoExampleGroupId>('video-creative')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState(false)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const examples = getExamples(groupId)
  const settings = getSettings(groupId)
  const groupMeta = VIDEO_EXAMPLE_GROUPS.find((item) => item.id === groupId)

  function flashSaved() {
    setFlash(true)
    window.setTimeout(() => setFlash(false), 1200)
  }

  async function handleUpload(exampleId: string, file?: File | null) {
    if (!file || !apiToken) return
    if (!file.type.startsWith('video/')) {
      setError('Нужен видеофайл (mp4/webm).')
      return
    }
    if (file.size > VIDEO_MAX_BYTES) {
      setError(`Максимальный размер — ${formatBytes(VIDEO_MAX_BYTES)}.`)
      return
    }

    setBusyId(exampleId)
    setError('')
    try {
      const result = await uploadPortfolioVideo(apiToken, file)
      if (!result.ok || !result.file) {
        setError(result.error || 'Не удалось загрузить видео')
        return
      }
      updateExample(groupId, exampleId, {
        src: result.file.src,
        poster: '',
      })
      flashSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-icl-text">
            Примеры работ
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-icl-muted">
            Управление видео-примерами и тарифами для «Видео-креативы» и «AI-видеокреативы».
            Максимум 3 ролика в каждой услуге, до 50 MB на файл.
          </p>
          <p className="mt-3 max-w-2xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            Загрузка файла идёт на сервер, но названия/порядок/цены примеров пока хранятся в
            localStorage этого браузера.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {flash && (
            <span className="text-xs font-medium text-emerald-500">Сохранено</span>
          )}
          <Button type="button" variant="outline-dark" onClick={resetExamples}>
            Сбросить к умолчанию
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {VIDEO_EXAMPLE_GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => setGroupId(group.id)}
            className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              groupId === group.id
                ? 'border-icl-accent bg-icl-accent-soft text-icl-accent'
                : 'border-icl-border bg-icl-card text-icl-muted hover:text-icl-text'
            }`}
          >
            {group.title}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4 rounded-2xl border border-icl-border bg-icl-card p-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-icl-text">
              {groupMeta?.title}
            </h2>
            <p className="mt-1 text-sm text-icl-muted">{groupMeta?.description}</p>
          </div>

          <ul className="space-y-4">
            {examples.map((example, index) => (
              <li
                key={example.id}
                className="rounded-2xl border border-icl-border bg-icl-surface p-4"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="h-28 w-20 overflow-hidden rounded-xl bg-icl-surface-alt sm:h-32 sm:w-24">
                    {example.poster || example.src ? (
                      example.poster ? (
                        <img
                          src={example.poster}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={example.src}
                          muted
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-icl-subtle">
                        Нет видео
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <FormField label="Название" htmlFor={`title-${example.id}`}>
                      <input
                        id={`title-${example.id}`}
                        className={inputClass}
                        value={example.title}
                        onChange={(event) => {
                          updateExample(groupId, example.id, { title: event.target.value })
                          flashSaved()
                        }}
                      />
                    </FormField>
                    <p className="truncate text-xs text-icl-subtle">
                      {example.src || 'Файл не загружен'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={(node) => {
                          fileRefs.current[example.id] = node
                        }}
                        type="file"
                        accept="video/mp4,video/webm,video/*"
                        className="hidden"
                        onChange={(event) => {
                          void handleUpload(example.id, event.target.files?.[0])
                          event.currentTarget.value = ''
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline-dark"
                        className="!px-3 !py-2 !text-xs"
                        disabled={busyId === example.id || !apiToken}
                        onClick={() => fileRefs.current[example.id]?.click()}
                      >
                        <Upload size={14} />
                        {example.src ? 'Заменить' : 'Загрузить'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline-dark"
                        className="!px-3 !py-2 !text-xs"
                        disabled={index === 0}
                        onClick={() => {
                          moveExample(groupId, example.id, 'up')
                          flashSaved()
                        }}
                      >
                        <ArrowUp size={14} />
                      </Button>
                      <Button
                        type="button"
                        variant="outline-dark"
                        className="!px-3 !py-2 !text-xs"
                        disabled={index === examples.length - 1}
                        onClick={() => {
                          moveExample(groupId, example.id, 'down')
                          flashSaved()
                        }}
                      >
                        <ArrowDown size={14} />
                      </Button>
                      <Button
                        type="button"
                        variant="outline-dark"
                        className="!px-3 !py-2 !text-xs text-red-500"
                        disabled={!example.src}
                        onClick={() => {
                          removeExampleMedia(groupId, example.id)
                          flashSaved()
                        }}
                      >
                        <Trash2 size={14} />
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="h-fit space-y-4 rounded-2xl border border-icl-border bg-icl-card p-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-icl-text">
              Тариф и ползунок
            </h2>
            <p className="mt-1 text-sm text-icl-muted">
              Формула: количество / 10 × цена за 10 штук.
            </p>
          </div>

          <FormField label="Цена за 10 штук ($)" htmlFor="price-per-10">
            <input
              id="price-per-10"
              type="number"
              min={0}
              step={0.5}
              className={inputClass}
              value={settings.pricePer10}
              onChange={(event) => {
                updateSettings(groupId, { pricePer10: Number(event.target.value) || 0 })
                flashSaved()
              }}
            />
          </FormField>
          <FormField label="Минимум" htmlFor="qty-min">
            <input
              id="qty-min"
              type="number"
              min={1}
              className={inputClass}
              value={settings.minimum}
              onChange={(event) => {
                updateSettings(groupId, { minimum: Number(event.target.value) || 1 })
                flashSaved()
              }}
            />
          </FormField>
          <FormField label="Максимум" htmlFor="qty-max">
            <input
              id="qty-max"
              type="number"
              min={1}
              className={inputClass}
              value={settings.maximum}
              onChange={(event) => {
                updateSettings(groupId, { maximum: Number(event.target.value) || 1 })
                flashSaved()
              }}
            />
          </FormField>
          <FormField label="Шаг" htmlFor="qty-step">
            <input
              id="qty-step"
              type="number"
              min={1}
              className={inputClass}
              value={settings.step}
              onChange={(event) => {
                updateSettings(groupId, { step: Number(event.target.value) || 1 })
                flashSaved()
              }}
            />
          </FormField>

          <div className="rounded-xl border border-icl-border bg-icl-surface px-4 py-3 text-sm text-icl-muted">
            Пример: 100 шт →{' '}
            <span className="font-semibold text-icl-accent">
              {(100 / 10) * settings.pricePer10}$
            </span>
          </div>
        </section>
      </div>
    </div>
  )
}
