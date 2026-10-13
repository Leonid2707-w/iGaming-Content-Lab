import { describe, expect, it } from 'vitest'
import {
  FALLBACK_SERVICES,
  formatServicePrice,
  normalizeCatalog,
  quantityPresets,
  quoteOrder,
  validateQuantity,
} from './catalog'

const byId = (id: string) => FALLBACK_SERVICES.find((s) => s.id === id)!

describe('bot catalog', () => {
  it('falls back to defaults and skips disabled services', () => {
    expect(normalizeCatalog(null)).toBe(FALLBACK_SERVICES)
    const list = normalizeCatalog([
      { id: 'a', title: 'A', enabled: false },
      { id: 'b', title: 'B', priceMode: 'numeric', price: '3', unit: 'piece', unitId: 'per_piece' },
    ])
    expect(list.map((s) => s.id)).toEqual(['b'])
    expect(list[0].price).toBe(3)
  })

  it('prices pack-based services per pack', () => {
    expect(quoteOrder(byId('video-creative'), 25)).toMatchObject({ price: 25, quantityLabel: '25 шт.' })
    expect(quoteOrder(byId('telegram-post'), 4)).toMatchObject({ price: 10, priceLabel: '$10 за 4 шт.' })
    expect(quoteOrder(byId('youtube-video'), 2).priceLabel).toBe('от $160 за 2 шт.')
  })

  it('handles monthly and individual pricing', () => {
    expect(formatServicePrice(byId('social-ig-youtube'))).toBe('от $85 в месяц')
    expect(quoteOrder(byId('custom'))).toMatchObject({ price: null, priceLabel: 'Индивидуально' })
  })

  it('validates quantity limits and step', () => {
    const video = byId('video-creative')
    expect(validateQuantity(video, 15)).toBeNull()
    expect(validateQuantity(video, 5)).toMatch(/Минимальный/)
    expect(validateQuantity(video, 12)).toMatch(/шагом 5/)
    expect(validateQuantity(video, 2000)).toMatch(/Максимальный/)
    expect(quantityPresets(video).every((q) => validateQuantity(video, q) === null)).toBe(true)
  })
})
