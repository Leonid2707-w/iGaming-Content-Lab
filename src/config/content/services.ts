import {
  getPriceUnit,
  unitIdToServiceUnit,
  type PriceUnitId,
} from '@/config/priceUnits'

export type ServiceUnit = 'piece' | 'month' | 'project'
export type ServiceCategory = 'social' | 'video' | 'additional'
export type PriceMode = 'numeric' | 'text'

export interface StandardService {
  id: string
  title: string
  description: string
  category: ServiceCategory
  enabled: boolean
  /** numeric — число + единица; text — произвольный текст / индивидуально */
  priceMode: PriceMode
  price?: number
  pricePrefix?: string
  /** Текст цены при priceMode = text или пустой цене */
  priceText?: string
  unitId: PriceUnitId
  unit: ServiceUnit
  unitLabel: string
  features: string[]
  icon: string
  minimum?: number
  maximum?: number
  step?: number
}

export function createServiceDefaults(): StandardService[] {
  return [
    {
      id: 'telegram-post',
      title: 'Telegram-посты',
      description:
        'Тексты и визуальная подача постов в стиле вашего канала и под конкретную аудиторию.',
      category: 'social',
      enabled: true,
      priceMode: 'numeric',
      price: 2.5,
      unitId: 'per_piece',
      unit: 'piece',
      unitLabel: 'за штуку',
      minimum: 5,
      step: 1,
      icon: 'send',
      features: ['От 5 постов', 'Стиль бренда', 'Редакторский контроль'],
    },
    {
      id: 'telegram-management',
      title: 'Ведение Telegram-каналов',
      description:
        'Полное ведение Telegram-канала: контент-план, публикации, поддержание стиля и тематики.',
      category: 'social',
      enabled: true,
      priceMode: 'numeric',
      price: 10,
      unitId: 'monthly',
      unit: 'month',
      unitLabel: 'в месяц',
      icon: 'calendar',
      features: ['Контент-план', 'Публикации', 'Ежедневная работа'],
    },
    {
      id: 'social-ig-youtube',
      title: 'Ведение Instagram / YouTube',
      description:
        'Регулярное ведение Instagram и YouTube: контент-план, публикации и адаптация под площадку.',
      category: 'social',
      enabled: true,
      priceMode: 'numeric',
      price: 85,
      pricePrefix: 'от',
      unitId: 'monthly',
      unit: 'month',
      unitLabel: 'в месяц',
      icon: 'smartphone',
      features: ['Instagram и YouTube', 'Контент-план', 'Регулярные публикации'],
    },
    {
      id: 'video-creative',
      title: 'Видео-креативы',
      description:
        'Геймплейные рекламные креативы с использованием игрового процесса, музыки и текста.',
      category: 'video',
      enabled: true,
      priceMode: 'numeric',
      price: 10,
      unitId: 'per_piece',
      unit: 'piece',
      unitLabel: 'за 10 штук',
      minimum: 10,
      maximum: 1000,
      step: 5,
      icon: 'video',
      features: ['Геймплей', 'Музыка и текст', 'Рекламные форматы'],
    },
    {
      id: 'ai-video',
      title: 'AI-видеокреативы',
      description:
        'AI-креативы с использованием стримеров, геймплея и AI-элементов.',
      category: 'video',
      enabled: true,
      priceMode: 'numeric',
      price: 15,
      unitId: 'per_piece',
      unit: 'piece',
      unitLabel: 'за 10 штук',
      minimum: 10,
      maximum: 1000,
      step: 5,
      icon: 'sparkles',
      features: ['Стримеры', 'Геймплей', 'AI-элементы'],
    },
    {
      id: 'youtube-video',
      title: 'YouTube-видео 3–10 минут',
      description: 'Создание длинных видео для YouTube.',
      category: 'video',
      enabled: true,
      priceMode: 'numeric',
      price: 80,
      pricePrefix: 'от',
      unitId: 'per_piece',
      unit: 'piece',
      unitLabel: 'за видео',
      icon: 'youtube',
      features: ['3–10 минут', 'Полный цикл', 'Под ваши ТЗ'],
    },
    {
      id: 'ad-design',
      title: 'Рекламные материалы',
      description: 'Создание дополнительных материалов для продвижения проектов.',
      category: 'additional',
      enabled: true,
      priceMode: 'text',
      priceText: 'Индивидуально',
      unitId: 'custom',
      unit: 'project',
      unitLabel: 'индивидуально',
      icon: 'image',
      features: ['Баннеры', 'Превью', 'Адаптация размеров'],
    },
    {
      id: 'content-adaptation',
      title: 'Анализ и адаптация контента',
      description:
        'Помощь в адаптации существующего контента под разные GEO, площадки и рекламные форматы.',
      category: 'additional',
      enabled: true,
      priceMode: 'text',
      priceText: 'Индивидуально',
      unitId: 'custom',
      unit: 'project',
      unitLabel: 'индивидуально',
      icon: 'globe',
      features: ['Разные GEO', 'Разные площадки', 'Рекламные форматы'],
    },
    {
      id: 'custom',
      title: 'Индивидуальные задачи',
      description: 'Выполнение нестандартных задач по запросу клиента.',
      category: 'additional',
      enabled: true,
      priceMode: 'text',
      priceText: 'Индивидуально',
      unitId: 'custom',
      unit: 'project',
      unitLabel: 'индивидуально',
      icon: 'briefcase',
      features: ['Оценка задачи', 'Гибкая команда', 'Персональный процесс'],
    },
  ]
}

/** Значения по умолчанию (иммутабельный снимок для сброса). */
export const defaultServices = createServiceDefaults()

/** @deprecated используйте ServicesContext; оставлено для совместимости импортов */
export const standardServices = defaultServices

export function getServiceById(id: string, list: StandardService[] = defaultServices) {
  return list.find((s) => s.id === id)
}

export const serviceCategories: { id: ServiceCategory; label: string }[] = [
  { id: 'social', label: 'Контент для соцсетей' },
  { id: 'video', label: 'Видео' },
  { id: 'additional', label: 'Дополнительно' },
]

export const orderServiceIds = [
  'video-creative',
  'telegram-post',
  'youtube-video',
  'social-management',
  'custom',
] as const

export type OrderServiceId = (typeof orderServiceIds)[number]

export const socialPlatforms = [
  {
    id: 'telegram',
    label: 'Telegram',
    serviceId: 'telegram-management',
  },
  {
    id: 'instagram-youtube',
    label: 'Instagram / YouTube',
    serviceId: 'social-ig-youtube',
  },
] as const

export type SocialPlatformId = (typeof socialPlatforms)[number]['id']

export const socialCreativeTypes = [
  {
    id: 'gameplay',
    title: 'Видео-креатив',
    description: 'Геймплейные креативы с игровым процессом, музыкой и текстом.',
  },
  {
    id: 'ai',
    title: 'AI-видеокреатив',
    description: 'Креативы со стримерами, геймплеем и AI-элементами.',
  },
  {
    id: 'custom',
    title: 'Свой креатив',
    description: 'Ваш стиль и референсы — стоимость согласуем после брифа.',
  },
] as const

export type SocialCreativeTypeId = (typeof socialCreativeTypes)[number]['id']

/** Ведение Telegram: management + (creative × creativesPerWeek × 4) */
export function calcTelegramManagementMonthly(
  managementPrice: number,
  creativePrice: number,
  creativesPerWeek: number,
): number {
  const weekly = Math.max(0, Math.round(creativesPerWeek))
  return managementPrice + creativePrice * weekly * 4
}

export function calcGameplayCreativeMonthly(perDay: number): number {
  const n = Math.max(1, Math.min(50, Math.round(perDay)))
  if (n <= 10) return 50 + (n - 1) * 30
  return 320 + (n - 10) * 20
}

export function calcAiCreativeMonthly(perDay: number): number {
  const n = Math.max(1, Math.min(50, Math.round(perDay)))
  if (n <= 10) return 65 + (n - 1) * 45
  return 470 + (n - 10) * 35
}

export function calcSocialCreativeMonthly(
  type: SocialCreativeTypeId,
  perDay: number,
): number | undefined {
  if (type === 'gameplay') return calcGameplayCreativeMonthly(perDay)
  if (type === 'ai') return calcAiCreativeMonthly(perDay)
  return undefined
}

function formatNumberPrice(value: number) {
  return value % 1 === 0 ? `${value}$` : `${value.toFixed(1)}$`
}

/** Отображение цены на публичном сайте: «1$ / штука» или «Индивидуально» */
export function formatServicePrice(service: StandardService): {
  primary: string
  secondary?: string
  isCustom: boolean
} {
  const unit = getPriceUnit(service.unitId)

  if (
    service.priceMode === 'text' ||
    service.unitId === 'custom' ||
    !unit.isNumeric ||
    service.price == null
  ) {
    return {
      primary: service.priceText?.trim() || 'Индивидуально',
      isCustom: true,
    }
  }

  const amount = formatNumberPrice(service.price)
  const withPrefix = service.pricePrefix ? `${service.pricePrefix} ${amount}` : amount

  if (service.id === 'video-creative' || service.id === 'ai-video') {
    return {
      primary: withPrefix,
      secondary: '/ 10 шт',
      isCustom: false,
    }
  }

  return {
    primary: withPrefix,
    secondary: `/ ${unit.shortLabel}`,
    isCustom: false,
  }
}

export function formatServicePriceLine(service: StandardService) {
  const formatted = formatServicePrice(service)
  if (formatted.isCustom || !formatted.secondary) return formatted.primary
  return `${formatted.primary} ${formatted.secondary}`
}

export function formatPlatformPriceLabel(service?: StandardService) {
  if (!service) return 'индивидуально'
  return formatServicePriceLine(service)
}

export function applyUnitToService(
  service: StandardService,
  unitId: PriceUnitId,
): StandardService {
  const unit = getPriceUnit(unitId)
  const next: StandardService = {
    ...service,
    unitId,
    unit: unitIdToServiceUnit(unitId),
    unitLabel: unit.label,
  }

  if (!unit.isNumeric) {
    next.priceMode = 'text'
    next.price = undefined
    next.priceText = next.priceText?.trim() || 'Индивидуально'
  } else if (next.priceMode === 'text' && next.price == null) {
    next.priceMode = 'numeric'
  }

  return next
}
