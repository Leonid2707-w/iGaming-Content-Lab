import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'motion/react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  FileImage,
  Link2,
  Plus,
  Send,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FormField, inputClass } from '@/components/ui/FormField'
import { submitOrderRequest } from '@/api/orders'
import {
  calcSocialCreativeMonthly,
  calcTelegramManagementMonthly,
  orderServiceIds,
  socialPlatforms,
  type SocialPlatformId,
  type StandardService,
} from '@/config/content/services'
import {
  calcVideoPackTotal,
  snapVideoQuantity,
  VIDEO_EXAMPLE_GROUPS,
  type VideoExampleGroupId,
} from '@/config/content/videoExamples'
import { VideoExamplesBlock } from '@/components/video/VideoExamplesBlock'
import { useAuth } from '@/context/AuthContext'
import { useOrderModal } from '@/context/OrderModalContext'
import { useServices } from '@/context/ServicesContext'
import { useVideoExamples } from '@/context/VideoExamplesContext'
import {
  duration,
  easeOutSoft,
  modalBackdrop,
  modalPanel,
  stepSlide,
  transitionBase,
  transitionFast,
} from '@/lib/motion'

type Step = 'service' | 'details' | 'success'

const choices = [
  {
    id: 'video-creative',
    title: 'Видео-креативы',
    description: 'Геймплейные рекламные ролики с музыкой и текстом.',
    icon: Video,
  },
  {
    id: 'telegram-post',
    title: 'Telegram-посты',
    description: 'Тексты и оформление публикаций для канала.',
    icon: Send,
  },
  {
    id: 'youtube-video',
    title: 'YouTube',
    description: 'Видео 3–10 минут с полным циклом производства.',
    icon: Video,
  },
  {
    id: 'social-management',
    title: 'Ведение соцсетей',
    description: 'Telegram или Instagram / YouTube — выберите одну платформу.',
    icon: Share2,
  },
  {
    id: 'custom',
    title: 'Другое',
    description: 'Индивидуальная задача вне стандартного каталога.',
    icon: CircleHelp,
  },
] as const

const quantityServices = new Set(['telegram-post'])
const SOCIAL_ORDER_ID = 'social-management'
const VIDEO_ORDER_ID = 'video-creative'
const WEEKLY_MIN = 3
const WEEKLY_MAX = 35
const PER_DAY_MIN = 1
const PER_DAY_MAX = 50

type IgCreativeType = 'gameplay' | 'ai'
type VideoOrderType = VideoExampleGroupId

const igCreativeOptions = [
  {
    id: 'gameplay' as const,
    title: 'Видеокреатив',
    description: 'Геймплейные креативы с игровым процессом, музыкой и текстом.',
    icon: Video,
  },
  {
    id: 'ai' as const,
    title: 'AI-видеокреатив',
    description: 'Креативы со стримерами, геймплеем и AI-элементами.',
    icon: Sparkles,
  },
]

const videoTypeOptions = [
  {
    id: 'video-creative' as const,
    title: 'Видео-креативы',
    description: 'Геймплейные рекламные ролики с музыкой и текстом.',
    icon: Video,
  },
  {
    id: 'ai-video' as const,
    title: 'AI-видеокреативы',
    description: 'Креативы со стримерами, геймплеем и AI-элементами.',
    icon: Sparkles,
  },
]

function normalizeChoice(serviceId?: string) {
  if (!serviceId) return undefined
  if (serviceId === 'telegram-management' || serviceId === 'social-ig-youtube') {
    return SOCIAL_ORDER_ID
  }
  if (serviceId === 'ai-video') return VIDEO_ORDER_ID
  if (orderServiceIds.includes(serviceId as (typeof orderServiceIds)[number])) {
    return serviceId
  }
  return 'custom'
}

function defaultVideoType(serviceId?: string): VideoOrderType | undefined {
  if (serviceId === 'ai-video') return 'ai-video'
  if (serviceId === 'video-creative') return 'video-creative'
  return undefined
}

function defaultPlatform(serviceId?: string): SocialPlatformId | undefined {
  if (serviceId === 'telegram-management') return 'telegram'
  if (serviceId === 'social-ig-youtube') return 'instagram-youtube'
  return undefined
}

function getDefaultQuantity(service?: StandardService) {
  return service?.minimum ?? 1
}

function isValidUrl(value: string) {
  try {
    const trimmed = value.trim()
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const url = new URL(withProtocol)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function normalizeClientLink(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function formatMoney(value: number) {
  return value % 1 === 0 ? value.toLocaleString('en-US') : value.toFixed(1)
}

export function OrderModal() {
  const {
    isOpen,
    initialServiceId,
    initialDescription,
    openOrder,
    closeOrder,
  } = useOrderModal()
  const { getService } = useServices()
  const { getSettings } = useVideoExamples()
  const {
    isAuthenticated,
    accessToken,
    profile,
    user,
    loading: authLoading,
  } = useAuth()
  const reduceMotion = useReducedMotion()
  const location = useLocation()
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('service')
  const [selectedId, setSelectedId] = useState<string>()
  const [platform, setPlatform] = useState<SocialPlatformId>()
  const [weeklyMode, setWeeklyMode] = useState<'fixed' | 'custom'>('fixed')
  const [weeklyCount, setWeeklyCount] = useState(10)
  const [weeklyCustomNote, setWeeklyCustomNote] = useState('')
  const [igCreativeType, setIgCreativeType] = useState<IgCreativeType>()
  const [videoType, setVideoType] = useState<VideoOrderType>()
  const [perDay, setPerDay] = useState(1)
  const [quantity, setQuantity] = useState(10)
  const [telegram, setTelegram] = useState('')
  const [description, setDescription] = useState('')
  const [references, setReferences] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [links, setLinks] = useState<string[]>([])
  const [linkDraft, setLinkDraft] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitWarning, setSubmitWarning] = useState('')
  const [submittedPublicId, setSubmittedPublicId] = useState('')

  const isSocial = selectedId === SOCIAL_ORDER_ID
  const isVideoOrder = selectedId === VIDEO_ORDER_ID
  const activeVideoType = isVideoOrder ? videoType : undefined
  const videoSettings = activeVideoType ? getSettings(activeVideoType) : undefined

  const selectedService = useMemo(() => {
    if (isSocial) return undefined
    if (isVideoOrder && activeVideoType) return getService(activeVideoType)
    return getService(selectedId ?? '')
  }, [activeVideoType, getService, isSocial, isVideoOrder, selectedId])

  const showQuantity = selectedId ? quantityServices.has(selectedId) : false
  const videoPackTotal =
    videoSettings && activeVideoType
      ? calcVideoPackTotal(quantity, videoSettings.pricePer10)
      : undefined

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === '#order') openOrder()
    }
    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    return () => window.removeEventListener('hashchange', openFromHash)
  }, [openOrder])

  useEffect(() => {
    const state = location.state as
      | { reopenOrder?: boolean; serviceId?: string | null }
      | null
    if (!state?.reopenOrder || !isAuthenticated || authLoading) return
    openOrder({ serviceId: state.serviceId || undefined })
    navigate(location.pathname + location.search + location.hash, {
      replace: true,
      state: null,
    })
  }, [
    authLoading,
    isAuthenticated,
    location.hash,
    location.pathname,
    location.search,
    location.state,
    navigate,
    openOrder,
  ])

  useEffect(() => {
    if (!isOpen) return

    const normalized = normalizeChoice(initialServiceId)
    const service = initialServiceId ? getService(initialServiceId) : undefined

    const initialVideoType = defaultVideoType(initialServiceId)
    const videoDefaults = initialVideoType
      ? getSettings(initialVideoType)
      : undefined

    setStep('service')
    setSelectedId(normalized)
    setPlatform(defaultPlatform(initialServiceId))
    setWeeklyMode('fixed')
    setWeeklyCount(10)
    setWeeklyCustomNote('')
    setIgCreativeType(undefined)
    setVideoType(initialVideoType)
    setPerDay(1)
    setQuantity(
      videoDefaults
        ? videoDefaults.minimum
        : getDefaultQuantity(service ?? getService(normalized ?? '')),
    )
    setTelegram('')
    setDescription(
      initialDescription ||
        (service &&
        initialServiceId &&
        initialServiceId !== 'telegram-management' &&
        initialServiceId !== 'social-ig-youtube' &&
        initialServiceId !== 'ai-video' &&
        !orderServiceIds.includes(initialServiceId as (typeof orderServiceIds)[number])
        ? `Интересует услуга: ${service.title}`
        : ''),
    )
    setReferences('')
    setFiles([])
    setLinks([])
    setLinkDraft('')
    setError('')
    setSubmitting(false)
    setSubmitWarning('')
    setSubmittedPublicId('')

    previousFocus.current = document.activeElement as HTMLElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => dialogRef.current?.focus())

    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus.current?.focus()
    }
  }, [getService, getSettings, initialDescription, initialServiceId, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const metaTg =
      typeof user?.user_metadata?.telegram_username === 'string'
        ? user.user_metadata.telegram_username
        : ''
    const next = profile?.telegram_username || metaTg
    if (next) setTelegram(next)
  }, [isOpen, profile?.telegram_username, user?.user_metadata?.telegram_username])

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeOrder()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href]',
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeOrder, isOpen])

  function handleClose() {
    if (window.location.hash === '#order') {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    }
    closeOrder()
  }

  function selectService(serviceId: string) {
    const service = getService(serviceId)
    setSelectedId(serviceId)
    setQuantity(getDefaultQuantity(service))
    if (serviceId !== SOCIAL_ORDER_ID) {
      setPlatform(undefined)
      setWeeklyMode('fixed')
      setWeeklyCount(10)
      setWeeklyCustomNote('')
      setIgCreativeType(undefined)
      setPerDay(1)
    }
    if (serviceId === VIDEO_ORDER_ID) {
      setVideoType(undefined)
    } else {
      setVideoType(undefined)
    }
    setError('')
  }

  function selectVideoType(nextType: VideoOrderType) {
    const settings = getSettings(nextType)
    setVideoType(nextType)
    setQuantity(settings.minimum)
    setError('')
  }

  function goToDetails() {
    if (!selectedId) {
      setError('Выберите услугу, чтобы продолжить.')
      return
    }
    if (isVideoOrder && !videoType) {
      setError('Выберите тип видеокреатива.')
      return
    }
    if (isSocial) {
      if (!platform) {
        setError('Выберите платформу.')
        return
      }
      if (platform === 'telegram' && weeklyMode === 'custom' && !weeklyCustomNote.trim()) {
        setError('Опишите необходимое количество контента.')
        return
      }
      if (platform === 'instagram-youtube' && !igCreativeType) {
        setError('Выберите тип креатива для Instagram / YouTube.')
        return
      }
    }
    setError('')
    setStep('details')
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const next = Array.from(event.target.files ?? [])
    if (!next.length) return
    setFiles((current) => {
      const merged = [...current]
      for (const file of next) {
        if (!merged.some((item) => item.name === file.name && item.size === file.size)) {
          merged.push(file)
        }
      }
      return merged.slice(0, 12)
    })
    event.target.value = ''
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, i) => i !== index))
  }

  function addLink() {
    const value = normalizeClientLink(linkDraft)
    if (!value) return
    if (!isValidUrl(value)) {
      setError('Укажите корректную ссылку (https://...).')
      return
    }
    if (links.includes(value)) {
      setError('Эта ссылка уже добавлена.')
      return
    }
    setLinks((current) => [...current, value])
    setLinkDraft('')
    setError('')
  }

  function removeLink(index: number) {
    setLinks((current) => current.filter((_, i) => i !== index))
  }

  async function submitOrder(event: FormEvent) {
    event.preventDefault()
    if (!telegram.trim() || !description.trim()) {
      setError('Укажите Telegram username и опишите задачу.')
      return
    }
    if (!selectedId) {
      setError('Выберите услугу.')
      return
    }

    const serviceTitle =
      (isVideoOrder && videoType
        ? VIDEO_EXAMPLE_GROUPS.find((item) => item.id === videoType)?.title
        : undefined) ||
      choices.find((choice) => choice.id === selectedId)?.title ||
      selectedService?.title ||
      'Заявка'

    const platformLabel = platform
      ? socialPlatforms.find((item) => item.id === platform)?.label || platform
      : undefined

    let quantityLabel: string | undefined
    if (showQuantity || isVideoOrder) quantityLabel = `${quantity} шт.`
    if (isSocial && platform === 'telegram' && weeklyMode === 'fixed') {
      quantityLabel = `${weeklyCount} креативов / неделю`
    }
    if (isSocial && platform === 'telegram' && weeklyMode === 'custom') {
      quantityLabel = 'Кастомный объём'
    }
    if (isSocial && platform === 'instagram-youtube' && igCreativeType) {
      const creativeTitle =
        igCreativeOptions.find((item) => item.id === igCreativeType)?.title || igCreativeType
      quantityLabel = `${creativeTitle}: ${perDay}/день`
    }

    const pieceTotalValue =
      selectedService?.price &&
      selectedService.unit === 'piece' &&
      !selectedService.pricePrefix &&
      showQuantity
        ? selectedService.price * quantity
        : undefined

    const telegramManagementPrice = getService('telegram-management')?.price ?? 10
    const telegramCreativePrice = getService('telegram-post')?.price ?? 2.5
    const telegramMonthlyTotal =
      isSocial && platform === 'telegram' && weeklyMode === 'fixed'
        ? calcTelegramManagementMonthly(
            telegramManagementPrice,
            telegramCreativePrice,
            weeklyCount,
          )
        : undefined
    const igYoutubeMonthlyTotal =
      isSocial && platform === 'instagram-youtube' && igCreativeType
        ? calcSocialCreativeMonthly(igCreativeType, perDay)
        : undefined
    const orderTotal =
      telegramMonthlyTotal ?? igYoutubeMonthlyTotal ?? videoPackTotal ?? pieceTotalValue

    const priceLabel =
      orderTotal !== undefined
        ? isSocial
          ? `${formatMoney(orderTotal)}$ / мес`
          : `${formatMoney(orderTotal)}$`
        : undefined

    const formData = new FormData()
    formData.set('clientTelegram', telegram.trim())
    formData.set('serviceId', isVideoOrder && videoType ? videoType : selectedId)
    formData.set('serviceTitle', serviceTitle)
    if (platformLabel) formData.set('platform', platformLabel)
    if (quantityLabel) formData.set('quantityLabel', quantityLabel)
    if (orderTotal !== undefined) formData.set('price', String(orderTotal))
    if (priceLabel) formData.set('priceLabel', priceLabel)
    formData.set('description', description.trim())
    formData.set('referencesText', references.trim())
    // Include unsubmitted draft link so it is not lost if user forgot "Добавить"
    const linksToSend = [...links]
    const draftNormalized = normalizeClientLink(linkDraft)
    if (draftNormalized && isValidUrl(draftNormalized) && !linksToSend.includes(draftNormalized)) {
      linksToSend.push(draftNormalized)
    }
    formData.set('links', JSON.stringify(linksToSend))
    if (linkDraft.trim()) formData.set('linkDraft', linkDraft.trim())
    formData.set(
      'meta',
      JSON.stringify({
        weeklyMode: isSocial && platform === 'telegram' ? weeklyMode : undefined,
        weeklyCount: isSocial && platform === 'telegram' ? weeklyCount : undefined,
        weeklyCustomNote:
          isSocial && platform === 'telegram' && weeklyMode === 'custom'
            ? weeklyCustomNote
            : undefined,
        igCreativeType:
          isSocial && platform === 'instagram-youtube' ? igCreativeType : undefined,
        perDay: isSocial && platform === 'instagram-youtube' ? perDay : undefined,
        videoType: isVideoOrder ? videoType : undefined,
        videoQuantity: isVideoOrder ? quantity : undefined,
        pricePer10: isVideoOrder && videoSettings ? videoSettings.pricePer10 : undefined,
      }),
    )
    for (const file of files) formData.append('files', file)

    setSubmitting(true)
    setError('')
    setSubmitWarning('')
    try {
      const result = await submitOrderRequest(formData, accessToken)
      if (!result.ok) {
        setError(result.error || 'Не удалось отправить заявку')
        return
      }
      setSubmittedPublicId(result.order?.publicId || '')
      setSubmitWarning(result.warning || '')
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить заявку')
    } finally {
      setSubmitting(false)
    }
  }

  if (typeof document === 'undefined') return null

  const pieceTotal =
    selectedService?.price &&
    selectedService.unit === 'piece' &&
    !selectedService.pricePrefix &&
    showQuantity
      ? selectedService.price * quantity
      : undefined

  const telegramManagementPrice = getService('telegram-management')?.price ?? 10
  const telegramCreativePrice = getService('telegram-post')?.price ?? 2.5
  const telegramMonthlyTotal =
    isSocial && platform === 'telegram' && weeklyMode === 'fixed'
      ? calcTelegramManagementMonthly(telegramManagementPrice, telegramCreativePrice, weeklyCount)
      : undefined
  const igYoutubeMonthlyTotal =
    isSocial && platform === 'instagram-youtube' && igCreativeType
      ? calcSocialCreativeMonthly(igCreativeType, perDay)
      : undefined
  const total = telegramMonthlyTotal ?? igYoutubeMonthlyTotal ?? videoPackTotal ?? pieceTotal
  const motionOff = !!reduceMotion

  function renderAttachmentBlocks(requiredHint?: string) {
    return (
      <>
        <FormField
          label="Стиль и описание"
          htmlFor="order-references"
          hint={requiredHint}
        >
          <textarea
            id="order-references"
            rows={3}
            value={references}
            onChange={(event) => setReferences(event.target.value)}
            className={inputClass}
            placeholder="Опишите стиль, тон или формат вашего креатива"
          />
        </FormField>

        <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-icl-text">
                <FileImage size={16} className="text-icl-accent" />
                Добавить файлы
              </p>
              <p className="mt-1 text-xs text-icl-muted">
                Фото, видео и аудио — до 12 файлов.
              </p>
            </div>
            <Button
              type="button"
              variant="outline-dark"
              className="!px-3 !py-2 !text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} />
              Загрузить
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
          {files.length > 0 ? (
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-icl-border bg-icl-surface px-3 py-2 text-sm"
                >
                  <span className="truncate text-icl-muted">
                    {file.name}
                    <span className="ml-2 text-xs text-icl-subtle">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="rounded-lg p-1.5 text-icl-subtle transition hover:bg-icl-surface-alt hover:text-icl-text"
                    aria-label={`Удалить ${file.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-icl-border bg-icl-surface px-4 py-8 text-sm text-icl-muted transition duration-300 hover:border-icl-accent/40 hover:text-icl-text"
            >
              <Upload size={18} />
              Выберите фото, видео или аудио
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
          <p className="mb-1 flex items-center gap-2 text-sm font-medium text-icl-text">
            <Link2 size={16} className="text-icl-accent" />
            Добавить ссылки
          </p>
          <p className="mb-4 text-xs text-icl-muted">
            Google Drive, YouTube, Telegram и другие ссылки.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              inputMode="url"
              value={linkDraft}
              onChange={(event) => setLinkDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addLink()
                }
              }}
              className={inputClass}
              placeholder="https://"
            />
            <Button type="button" variant="outline-dark" className="shrink-0" onClick={addLink}>
              <Plus size={16} />
              Добавить
            </Button>
          </div>
          {links.length > 0 && (
            <ul className="mt-4 space-y-2">
              {links.map((link, index) => (
                <li
                  key={link}
                  className="flex items-center justify-between gap-3 rounded-xl border border-icl-border bg-icl-surface px-3 py-2 text-sm"
                >
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-icl-accent hover:underline"
                  >
                    {link}
                  </a>
                  <button
                    type="button"
                    onClick={() => removeLink(index)}
                    className="rounded-lg p-1.5 text-icl-subtle transition hover:bg-icl-surface-alt hover:text-icl-text"
                    aria-label="Удалить ссылку"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </>
    )
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.button
            type="button"
            aria-label="Закрыть окно заказа"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[6px]"
            variants={modalBackdrop}
            transition={{ duration: motionOff ? 0 : duration.base, ease: easeOutSoft }}
            onClick={handleClose}
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
            tabIndex={-1}
            className="relative flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-icl-border bg-icl-surface shadow-elevated outline-none sm:max-h-[88vh] sm:rounded-3xl"
            variants={modalPanel}
            transition={
              motionOff ? { duration: 0 } : { duration: duration.slow, ease: easeOutSoft }
            }
          >
            <header className="flex items-center justify-between border-b border-icl-border px-5 py-4 sm:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-icl-accent">
                  Заказ контента
                </p>
                <h2 id="order-modal-title" className="mt-1 text-xl font-semibold text-icl-text">
                  {step === 'service' && 'Выберите услугу'}
                  {step === 'details' && 'Расскажите о задаче'}
                  {step === 'success' && 'Заявка принята'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-icl-border text-icl-muted transition duration-300 hover:bg-icl-surface-alt hover:text-icl-text"
                aria-label="Закрыть окно заказа"
              >
                <X size={20} />
              </button>
            </header>

            <div className="border-b border-icl-border px-5 py-3 sm:px-8">
              <div className="flex items-center gap-3 text-xs font-medium text-icl-muted">
                <span className={step === 'service' ? 'text-icl-accent' : 'text-icl-success'}>
                  {step === 'service' ? '1' : <Check size={14} />}
                </span>
                <div className="h-px flex-1 bg-icl-border" />
                <span
                  className={
                    step === 'details'
                      ? 'text-icl-accent'
                      : step === 'success'
                        ? 'text-icl-success'
                        : ''
                  }
                >
                  {step === 'success' ? <Check size={14} /> : '2'}
                </span>
                <div className="h-px flex-1 bg-icl-border" />
                <span className={step === 'success' ? 'text-icl-accent' : ''}>3</span>
              </div>
            </div>

            <div className="overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
              {authLoading ? (
                <p className="py-8 text-center text-sm text-icl-muted">Проверяем авторизацию…</p>
              ) : !isAuthenticated ? (
                <div className="space-y-5 py-4 text-center">
                  <div className="mx-auto max-w-md">
                    <h3 className="font-display text-xl font-semibold text-icl-text">
                      Войдите, чтобы оформить заказ
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-icl-muted">
                      Заявки сохраняются в личном кабинете. Войдите или зарегистрируйтесь, затем
                      продолжите оформление.
                    </p>
                  </div>
                  <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    <Button
                      to="/login"
                      state={{ from: '/', reopenOrder: true, serviceId: selectedId || initialServiceId }}
                      onClick={handleClose}
                    >
                      Войти
                    </Button>
                    <Button
                      to="/register"
                      state={{ from: '/', reopenOrder: true, serviceId: selectedId || initialServiceId }}
                      variant="outline-dark"
                      onClick={handleClose}
                    >
                      Зарегистрироваться
                    </Button>
                  </div>
                </div>
              ) : (
              <AnimatePresence mode="wait">
                {step === 'service' && (
                  <motion.div
                    key="service"
                    variants={stepSlide}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={motionOff ? { duration: 0 } : transitionBase}
                    className="space-y-6"
                  >
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                      {choices.map((choice, index) => {
                        const Icon = choice.icon
                        const active = selectedId === choice.id
                        return (
                          <motion.button
                            key={choice.id}
                            type="button"
                            onClick={() => selectService(choice.id)}
                            className={`group rounded-2xl border p-4 text-left transition-colors duration-300 ${
                              active
                                ? 'border-icl-accent bg-icl-accent-soft ring-2 ring-icl-accent/15'
                                : 'border-icl-border bg-icl-card hover:border-icl-accent/40'
                            }`}
                            initial={motionOff ? false : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: motionOff ? 0 : index * 0.04,
                              duration: duration.base,
                              ease: easeOutSoft,
                            }}
                            whileHover={motionOff ? undefined : { y: -3 }}
                          >
                            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-icl-accent-soft text-icl-accent transition-transform duration-300 group-hover:scale-[1.04]">
                              <Icon size={20} />
                            </span>
                            <span className="block font-display text-sm font-semibold text-icl-text">
                              {choice.title}
                            </span>
                            <span className="mt-2 block text-xs leading-relaxed text-icl-muted">
                              {choice.description}
                            </span>
                          </motion.button>
                        )
                      })}
                    </div>

                    {isVideoOrder && (
                      <motion.div
                        initial={motionOff ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={transitionFast}
                        className="space-y-5"
                      >
                        <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
                          <p className="mb-1 text-sm font-medium text-icl-text">
                            Тип видеокреатива
                          </p>
                          <p className="mb-4 text-xs text-icl-muted">
                            Выберите один формат — нельзя выбрать оба одновременно.
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {videoTypeOptions.map((option) => {
                              const Icon = option.icon
                              const active = videoType === option.id
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => selectVideoType(option.id)}
                                  aria-pressed={active}
                                  className={`rounded-2xl border p-4 text-left transition duration-300 ${
                                    active
                                      ? 'border-icl-accent bg-icl-accent-soft ring-2 ring-icl-accent/15'
                                      : 'border-icl-border bg-icl-surface hover:border-icl-accent/40'
                                  }`}
                                >
                                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-icl-accent-soft text-icl-accent">
                                    <Icon size={18} />
                                  </span>
                                  <span className="block text-sm font-semibold text-icl-text">
                                    {option.title}
                                  </span>
                                  <span className="mt-1.5 block text-xs leading-relaxed text-icl-muted">
                                    {option.description}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <AnimatePresence mode="wait">
                          {videoType && videoSettings && (
                            <motion.div
                              key={videoType}
                              initial={motionOff ? false : { opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={motionOff ? { duration: 0 } : transitionFast}
                              className="space-y-5"
                            >
                              <VideoExamplesBlock
                                groupId={videoType}
                                compact
                                subtitle="Откройте карусель примеров — тот же просмотрщик, что на сайте."
                              />

                              <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
                                <div className="mb-5 flex items-center justify-between gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-icl-text">
                                      Количество
                                    </p>
                                    <p className="mt-1 text-xs text-icl-muted">
                                      От {videoSettings.minimum} до {videoSettings.maximum}, шаг{' '}
                                      {videoSettings.step}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-display text-xl font-semibold text-icl-accent">
                                      {quantity} шт.
                                    </p>
                                    {videoPackTotal !== undefined && (
                                      <p className="mt-1 text-sm text-icl-muted">
                                        {formatMoney(videoPackTotal)}$
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <input
                                  type="range"
                                  min={videoSettings.minimum}
                                  max={videoSettings.maximum}
                                  step={videoSettings.step}
                                  value={quantity}
                                  onChange={(event) =>
                                    setQuantity(
                                      snapVideoQuantity(
                                        Number(event.target.value),
                                        videoSettings,
                                      ),
                                    )
                                  }
                                  className="range-input"
                                  aria-label="Количество видеокреативов"
                                />
                                <div className="mt-2 flex justify-between text-xs text-icl-subtle">
                                  <span>{videoSettings.minimum}</span>
                                  <span>{videoSettings.maximum}</span>
                                </div>
                                <p className="mt-4 rounded-xl border border-icl-border bg-icl-surface px-4 py-3 text-sm text-icl-muted">
                                  Тариф:{' '}
                                  <span className="font-medium text-icl-text">
                                    {videoSettings.pricePer10}$ / 10 шт
                                  </span>
                                  . Итого:{' '}
                                  <span className="font-display text-base font-semibold text-icl-accent">
                                    {formatMoney(videoPackTotal ?? 0)}$
                                  </span>
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {isSocial && (
                      <motion.div
                        initial={motionOff ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={transitionFast}
                        className="space-y-5"
                      >
                        <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
                          <p className="mb-1 text-sm font-medium text-icl-text">Платформа</p>
                          <p className="mb-4 text-xs text-icl-muted">
                            Выберите одну платформу для ведения контента.
                          </p>
                          <div className="flex flex-wrap gap-3">
                          {socialPlatforms.map((item) => {
                            const active = platform === item.id
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setPlatform(item.id)}
                                aria-pressed={active}
                                className={`rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition duration-300 ${
                                  active
                                    ? 'border-icl-accent bg-icl-accent-soft text-icl-accent'
                                    : 'border-icl-border bg-icl-surface text-icl-muted hover:border-icl-accent/40 hover:text-icl-text'
                                }`}
                              >
                                <span className="block">{item.label}</span>
                              </button>
                            )
                          })}
                          </div>
                        </div>

                        <AnimatePresence mode="wait">
                          {platform === 'telegram' && (
                            <motion.div
                              key="telegram-settings"
                              initial={motionOff ? false : { opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={motionOff ? { duration: 0 } : transitionFast}
                              className="rounded-2xl border border-icl-border bg-icl-card p-5"
                            >
                              <p className="mb-4 text-sm font-medium text-icl-text">
                                Сколько креативов в неделю выставлять
                              </p>
                              <div className="mb-5 flex flex-wrap gap-3">
                                {[
                                  ['fixed', 'Фиксированное количество'],
                                  ['custom', 'Кастомное количество'],
                                ].map(([mode, label]) => (
                                  <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setWeeklyMode(mode as 'fixed' | 'custom')}
                                    aria-pressed={weeklyMode === mode}
                                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition duration-300 ${
                                      weeklyMode === mode
                                        ? 'border-icl-accent bg-icl-accent-soft text-icl-accent'
                                        : 'border-icl-border bg-icl-surface text-icl-muted hover:border-icl-accent/40 hover:text-icl-text'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                              {weeklyMode === 'fixed' ? (
                                <>
                                  <p className="mb-4 font-display text-xl font-semibold text-icl-accent">
                                    {weeklyCount} креативов / неделю
                                  </p>
                                  <input
                                    type="range"
                                    min={WEEKLY_MIN}
                                    max={WEEKLY_MAX}
                                    step={1}
                                    value={weeklyCount}
                                    onChange={(event) => setWeeklyCount(Number(event.target.value))}
                                    className="range-input"
                                    aria-label="Количество креативов в неделю"
                                  />
                                  <div className="mt-2 flex justify-between text-xs text-icl-subtle">
                                    <span>{WEEKLY_MIN}</span>
                                    <span>{WEEKLY_MAX}</span>
                                  </div>
                                  <p className="mt-4 text-xs leading-relaxed text-icl-muted">
                                    Возможна корректировка количества публикаций по просьбе клиента
                                    (до ±2 постов). Дополнительная оплата не взимается.
                                  </p>
                                  {telegramMonthlyTotal !== undefined && (
                                    <p className="mt-4 rounded-xl border border-icl-border bg-icl-surface px-4 py-3 text-sm text-icl-muted">
                                      Итого:{' '}
                                      <span className="font-display text-base font-semibold text-icl-accent">
                                        {formatMoney(telegramMonthlyTotal)}$ / мес
                                      </span>
                                    </p>
                                  )}
                                </>
                              ) : (
                                <FormField
                                  label="Опишите необходимое количество контента"
                                  htmlFor="weekly-custom-note"
                                  required
                                >
                                  <textarea
                                    id="weekly-custom-note"
                                    rows={4}
                                    value={weeklyCustomNote}
                                    onChange={(event) => setWeeklyCustomNote(event.target.value)}
                                    className={inputClass}
                                    placeholder="Укажите примерное количество публикаций в неделю и тематику контента"
                                  />
                                </FormField>
                              )}
                            </motion.div>
                          )}

                          {platform === 'instagram-youtube' && (
                            <motion.div
                              key="instagram-youtube-settings"
                              initial={motionOff ? false : { opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={motionOff ? { duration: 0 } : transitionFast}
                              className="space-y-5"
                            >
                              <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
                                <p className="mb-1 text-sm font-medium text-icl-text">
                                  Тип креатива
                                </p>
                                <p className="mb-4 text-xs text-icl-muted">
                                  Выберите формат производства для Instagram / YouTube.
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {igCreativeOptions.map((option) => {
                                    const Icon = option.icon
                                    const active = igCreativeType === option.id
                                    return (
                                      <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setIgCreativeType(option.id)}
                                        className={`rounded-2xl border p-4 text-left transition duration-300 ${
                                          active
                                            ? 'border-icl-accent bg-icl-accent-soft ring-2 ring-icl-accent/15'
                                            : 'border-icl-border bg-icl-surface hover:border-icl-accent/40'
                                        }`}
                                      >
                                        <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-icl-accent-soft text-icl-accent">
                                          <Icon size={18} />
                                        </span>
                                        <span className="block text-sm font-semibold text-icl-text">
                                          {option.title}
                                        </span>
                                        <span className="mt-1.5 block text-xs leading-relaxed text-icl-muted">
                                          {option.description}
                                        </span>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>

                              {igCreativeType && (
                                <motion.div
                                  initial={motionOff ? false : { opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={motionOff ? { duration: 0 } : transitionFast}
                                  className="rounded-2xl border border-icl-border bg-icl-card p-5"
                                >
                                  <div className="mb-5 flex items-center justify-between gap-4">
                                    <div>
                                      <p className="text-sm font-medium text-icl-text">
                                        Сколько креативов в день?
                                      </p>
                                      <p className="mt-1 text-xs text-icl-muted">
                                        От {PER_DAY_MIN} до {PER_DAY_MAX}, шаг 1
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-display text-xl font-semibold text-icl-accent">
                                        {perDay} / день
                                      </p>
                                      {igYoutubeMonthlyTotal !== undefined && (
                                        <p className="mt-1 text-sm text-icl-muted">
                                          {formatMoney(igYoutubeMonthlyTotal)}$ / мес
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <input
                                    type="range"
                                    min={PER_DAY_MIN}
                                    max={PER_DAY_MAX}
                                    step={1}
                                    value={perDay}
                                    onChange={(event) => setPerDay(Number(event.target.value))}
                                    className="range-input"
                                    aria-label="Количество креативов в день"
                                  />
                                  <div className="mt-2 flex justify-between text-xs text-icl-subtle">
                                    <span>{PER_DAY_MIN}</span>
                                    <span>{PER_DAY_MAX}</span>
                                  </div>
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {step === 'details' && (
                  <motion.form
                    key="details"
                    onSubmit={submitOrder}
                    variants={stepSlide}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={motionOff ? { duration: 0 } : transitionBase}
                    className="grid gap-6 lg:grid-cols-[1fr_280px]"
                  >
                    <div className="space-y-5">
                      {isSocial && (
                        <div className="rounded-2xl border border-icl-border bg-icl-card px-4 py-3 text-sm text-icl-muted">
                          {platform && (
                            <p>
                              Платформа:{' '}
                              <span className="font-medium text-icl-text">
                                {socialPlatforms.find((item) => item.id === platform)?.label ??
                                  platform}
                              </span>
                            </p>
                          )}
                          {platform === 'telegram' && weeklyMode === 'fixed' && (
                            <p className="mt-1">
                              <span className="font-medium text-icl-text">
                                {weeklyCount} креативов / неделю
                              </span>
                            </p>
                          )}
                          {platform === 'instagram-youtube' && igCreativeType && (
                            <p className="mt-1">
                              Креатив:{' '}
                              <span className="font-medium text-icl-text">
                                {
                                  igCreativeOptions.find((item) => item.id === igCreativeType)
                                    ?.title
                                }
                              </span>
                              {` · ${perDay}/день`}
                            </p>
                          )}
                        </div>
                      )}

                      {showQuantity && selectedService && (
                        <div className="rounded-2xl border border-icl-border bg-icl-card p-5">
                          <div className="mb-5 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-medium text-icl-text">Количество</p>
                              <p className="mt-1 text-xs text-icl-muted">
                                От {selectedService.minimum ?? 1}
                                {selectedService.maximum
                                  ? `, шаг ${selectedService.step ?? 1}`
                                  : ''}
                              </p>
                            </div>
                            <p className="font-display text-xl font-semibold text-icl-accent">
                              {quantity}
                            </p>
                          </div>
                          {selectedService.maximum ? (
                            <>
                              <input
                                type="range"
                                min={selectedService.minimum ?? 1}
                                max={selectedService.maximum}
                                step={selectedService.step ?? 1}
                                value={quantity}
                                onChange={(event) => setQuantity(Number(event.target.value))}
                                className="range-input"
                                aria-label="Количество"
                              />
                              <div className="mt-2 flex justify-between text-xs text-icl-subtle">
                                <span>{selectedService.minimum}</span>
                                <span>{selectedService.maximum}</span>
                              </div>
                            </>
                          ) : (
                            <input
                              type="number"
                              min={selectedService.minimum ?? 1}
                              step={selectedService.step ?? 1}
                              value={quantity}
                              onChange={(event) =>
                                setQuantity(
                                  Math.max(
                                    selectedService.minimum ?? 1,
                                    Number(event.target.value),
                                  ),
                                )
                              }
                              className={inputClass}
                            />
                          )}
                        </div>
                      )}

                      <FormField label="Telegram username" htmlFor="order-telegram" required>
                        <input
                          id="order-telegram"
                          type="text"
                          value={telegram}
                          onChange={(event) => setTelegram(event.target.value)}
                          className={inputClass}
                          placeholder="@username"
                          autoComplete="off"
                        />
                      </FormField>

                      <FormField label="Описание задачи" htmlFor="order-description" required>
                        <textarea
                          id="order-description"
                          rows={4}
                          value={description}
                          onChange={(event) => setDescription(event.target.value)}
                          className={inputClass}
                          placeholder="Что нужно сделать, для какого GEO и в какие сроки?"
                        />
                      </FormField>

                      <FormField label="Примеры и референсы" htmlFor="order-references-extra">
                        <textarea
                          id="order-references-extra"
                          rows={3}
                          value={references}
                          onChange={(event) => setReferences(event.target.value)}
                          className={inputClass}
                          placeholder="Опишите стиль, тон или примеры, на которые ориентироваться"
                        />
                      </FormField>

                      {renderAttachmentBlocks()}
                    </div>

                    <aside className="h-fit rounded-2xl border border-icl-border bg-icl-card p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-icl-subtle">
                        Ваш заказ
                      </p>
                      <p className="mt-3 font-display font-semibold text-icl-text">
                        {(isVideoOrder && videoType
                          ? VIDEO_EXAMPLE_GROUPS.find((item) => item.id === videoType)?.title
                          : undefined) ||
                          choices.find((choice) => choice.id === selectedId)?.title}
                      </p>
                      {(showQuantity || isVideoOrder) && (
                        <p className="mt-2 text-sm text-icl-muted">Количество: {quantity}</p>
                      )}
                      {isVideoOrder && videoSettings && (
                        <p className="mt-2 text-sm text-icl-muted">
                          Тариф: {videoSettings.pricePer10}$ / 10 шт
                        </p>
                      )}
                      {isSocial && platform && (
                        <p className="mt-2 text-sm text-icl-muted">
                          Платформа:{' '}
                          {socialPlatforms.find((item) => item.id === platform)?.label ?? platform}
                        </p>
                      )}
                      {isSocial && platform === 'telegram' && weeklyMode === 'fixed' && (
                        <p className="mt-2 text-sm text-icl-muted">
                          {weeklyCount} креативов / неделю
                        </p>
                      )}
                      {isSocial && platform === 'instagram-youtube' && igCreativeType && (
                        <p className="mt-2 text-sm text-icl-muted">
                          {
                            igCreativeOptions.find((item) => item.id === igCreativeType)?.title
                          }
                          : {perDay}/день
                        </p>
                      )}
                      {(files.length > 0 || links.length > 0) && (
                        <p className="mt-2 text-sm text-icl-muted">
                          {files.length > 0 && `${files.length} файл(ов)`}
                          {files.length > 0 && links.length > 0 && ' · '}
                          {links.length > 0 && `${links.length} ссылк(и)`}
                        </p>
                      )}
                      {total !== undefined ? (
                        <p className="mt-5 border-t border-icl-border pt-5">
                          <span className="text-sm text-icl-muted">Предварительно</span>
                          <span className="mt-1 block font-display text-2xl font-semibold text-icl-accent">
                            {telegramMonthlyTotal !== undefined || igYoutubeMonthlyTotal !== undefined
                              ? `${formatMoney(total)}$ / мес`
                              : `$${formatMoney(total)}`}
                          </span>
                        </p>
                      ) : isSocial && platform === 'telegram' && weeklyMode === 'custom' ? (
                        <p className="mt-5 border-t border-icl-border pt-5 text-sm text-icl-muted">
                          Стоимость согласуем после уточнения объёма.
                        </p>
                      ) : selectedService?.pricePrefix && selectedService.price ? (
                        <p className="mt-5 border-t border-icl-border pt-5 text-sm text-icl-muted">
                          От ${selectedService.price} — уточним после брифа.
                        </p>
                      ) : (
                        <p className="mt-5 border-t border-icl-border pt-5 text-sm text-icl-muted">
                          Стоимость согласуем после уточнения задачи.
                        </p>
                      )}
                    </aside>
                  </motion.form>
                )}

                {step === 'success' && (
                  <motion.div
                    key="success"
                    variants={stepSlide}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={motionOff ? { duration: 0 } : transitionBase}
                    className="mx-auto max-w-lg py-10 text-center"
                  >
                    <motion.div
                      initial={motionOff ? false : { scale: 0.86, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: duration.base, ease: easeOutSoft }}
                      className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500"
                    >
                      <Check size={30} />
                    </motion.div>
                    <h3 className="text-2xl font-semibold text-icl-text">Спасибо!</h3>
                    <p className="mt-3 leading-relaxed text-icl-muted">
                      Ваша заявка успешно отправлена.
                      <br />
                      Мы свяжемся с вами в Telegram.
                    </p>
                    {submittedPublicId && (
                      <p className="mt-4 text-sm text-icl-subtle">
                        ID заявки: <span className="text-icl-text">{submittedPublicId}</span>
                      </p>
                    )}
                    {submitWarning && (
                      <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-600">
                        {submitWarning}
                      </p>
                    )}
                    <Button type="button" onClick={handleClose} className="mt-8">
                      Готово
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              )}

              {error && isAuthenticated && (
                <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">
                  {error}
                </p>
              )}
            </div>

            {step !== 'success' && isAuthenticated && (
              <footer className="flex items-center justify-between gap-3 border-t border-icl-border px-5 py-4 sm:px-8">
                {step === 'details' ? (
                  <Button type="button" variant="ghost" onClick={() => setStep('service')}>
                    <ArrowLeft size={16} />
                    Назад
                  </Button>
                ) : (
                  <span />
                )}

                {step === 'service' ? (
                  <Button type="button" onClick={goToDetails}>
                    Продолжить
                    <ArrowRight size={16} />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      dialogRef.current?.querySelector<HTMLFormElement>('form')?.requestSubmit()
                    }
                  >
                    {submitting ? 'Отправка…' : 'Отправить заявку'}
                    {!submitting && <ArrowRight size={16} />}
                  </Button>
                )}
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
