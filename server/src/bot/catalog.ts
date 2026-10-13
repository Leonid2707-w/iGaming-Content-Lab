import type { BotService } from './types.js'

/** Used when the admin catalog in Supabase (`site_services`) is empty or unavailable. */
export const FALLBACK_SERVICES: BotService[] = [
  {
    id: 'telegram-post',
    title: 'Telegram-посты',
    description: 'Тексты и визуальная подача постов в стиле вашего канала.',
    priceMode: 'numeric',
    price: 2.5,
    unitId: 'per_piece',
    unit: 'piece',
    unitLabel: 'за штуку',
    minimum: 1,
    maximum: 1000,
    step: 1,
  },
  {
    id: 'telegram-management',
    title: 'Ведение Telegram-каналов',
    description: 'Контент-план, публикации, поддержание стиля и тематики канала.',
    priceMode: 'numeric',
    price: 10,
    unitId: 'monthly',
    unit: 'month',
    unitLabel: 'в месяц',
  },
  {
    id: 'social-ig-youtube',
    title: 'Ведение Instagram / YouTube',
    description: 'Регулярное ведение Instagram и YouTube: контент-план и публикации.',
    priceMode: 'numeric',
    price: 85,
    pricePrefix: 'от',
    unitId: 'monthly',
    unit: 'month',
    unitLabel: 'в месяц',
  },
  {
    id: 'video-creative',
    title: 'Видео-креативы',
    description: 'Рекламные видео-креативы под ваши офферы и площадки.',
    priceMode: 'numeric',
    price: 10,
    unitId: 'per_piece',
    unit: 'piece',
    unitLabel: 'за 10 штук',
    minimum: 10,
    maximum: 1000,
    step: 5,
  },
  {
    id: 'ai-video',
    title: 'AI-видеокреативы',
    description: 'Видеокреативы, созданные с помощью AI-инструментов.',
    priceMode: 'numeric',
    price: 15,
    unitId: 'per_piece',
    unit: 'piece',
    unitLabel: 'за 10 штук',
    minimum: 10,
    maximum: 1000,
    step: 5,
  },
  {
    id: 'youtube-video',
    title: 'YouTube-видео 3–10 минут',
    description: 'Сценарий, монтаж и оформление роликов для YouTube.',
    priceMode: 'numeric',
    price: 80,
    pricePrefix: 'от',
    unitId: 'per_piece',
    unit: 'piece',
    unitLabel: 'за видео',
    minimum: 1,
    maximum: 25,
    step: 1,
  },
  {
    id: 'custom',
    title: 'Индивидуальные задачи',
    description: 'Любая контент-задача, которой нет в каталоге.',
    priceMode: 'text',
    priceText: 'Индивидуально',
    unitId: 'custom',
    unit: 'project',
    unitLabel: 'индивидуально',
  },
]

function num(value: unknown): number | undefined {
  const n = typeof value === 'string' && value.trim() ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeCatalog(raw: Record<string, unknown>[] | null | undefined): BotService[] {
  if (!raw?.length) return FALLBACK_SERVICES
  const services: BotService[] = []
  for (const item of raw) {
    const id = str(item.id)
    const title = str(item.title)
    if (!id || !title || item.enabled === false) continue
    const unit = item.unit === 'piece' || item.unit === 'month' ? item.unit : 'project'
    services.push({
      id,
      title,
      description: str(item.description),
      priceMode: item.priceMode === 'text' ? 'text' : 'numeric',
      price: num(item.price),
      pricePrefix: str(item.pricePrefix) || undefined,
      priceText: str(item.priceText) || undefined,
      unitId: str(item.unitId) || 'custom',
      unit,
      unitLabel: str(item.unitLabel),
      minimum: num(item.minimum),
      maximum: num(item.maximum),
      step: num(item.step),
    })
  }
  return services.length ? services : FALLBACK_SERVICES
}

export function formatUsd(value: number): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

function hasNumericPrice(service: BotService): service is BotService & { price: number } {
  return service.priceMode === 'numeric' && typeof service.price === 'number' && service.unitId !== 'custom'
}

/** How many pieces the catalog price covers ("за 10 штук" → 10). */
export function packSize(service: BotService): number {
  if (service.unitId === 'per_5') return 5
  if (service.unitId === 'per_10') return 10
  const match = service.unitLabel.match(/за\s+(\d+)\s*(шт|штук)/i)
  return match ? Math.max(1, Number(match[1])) : 1
}

export function isPerPiece(service: BotService): boolean {
  return hasNumericPrice(service) && service.unit === 'piece'
}

export function quantityLimits(service: BotService) {
  const min = Math.max(1, Math.floor(service.minimum ?? 1))
  const max = Math.max(min, Math.floor(service.maximum ?? 1000))
  const step = Math.max(1, Math.floor(service.step ?? 1))
  return { min, max, step }
}

export function validateQuantity(service: BotService, quantity: number): string | null {
  const { min, max, step } = quantityLimits(service)
  if (!Number.isInteger(quantity)) return 'Введите целое число.'
  if (quantity < min) return `Минимальный заказ — ${min} шт.`
  if (quantity > max) return `Максимальный заказ — ${max} шт.`
  if ((quantity - min) % step !== 0) return `Количество должно идти с шагом ${step} (например, ${min}, ${min + step}, ${min + step * 2}).`
  return null
}

export function quantityPresets(service: BotService): number[] {
  const { min, max, step } = quantityLimits(service)
  const candidates = [min, min * 2, min * 5, min * 10].map((value) => {
    const snapped = min + Math.round((value - min) / step) * step
    return Math.min(max, snapped)
  })
  return [...new Set(candidates)]
}

export function formatServicePrice(service: BotService): string {
  if (!hasNumericPrice(service)) return service.priceText || 'Индивидуально'
  const amount = formatUsd(service.price)
  return [service.pricePrefix, amount, service.unitLabel].filter(Boolean).join(' ')
}

export function quoteOrder(service: BotService, quantity?: number) {
  if (!hasNumericPrice(service)) {
    return {
      price: null,
      priceLabel: service.priceText || 'Индивидуально',
      quantityLabel: undefined as string | undefined,
    }
  }
  if (service.unit === 'piece' && quantity) {
    const total = Math.round(((service.price * quantity) / packSize(service)) * 100) / 100
    const prefix = service.pricePrefix ? `${service.pricePrefix} ` : ''
    return {
      price: total,
      priceLabel: `${prefix}${formatUsd(total)} за ${quantity} шт.`,
      quantityLabel: `${quantity} шт.`,
    }
  }
  return {
    price: service.price,
    priceLabel: formatServicePrice(service),
    quantityLabel: undefined as string | undefined,
  }
}
