export type PriceUnitId =
  | 'per_piece'
  | 'per_5'
  | 'per_10'
  | 'per_day'
  | 'per_week'
  | 'per_month'
  | 'monthly'
  | 'weekly'
  | 'custom'

export interface PriceUnitOption {
  id: PriceUnitId
  label: string
  /** Короткий суффикс для карточки: «штука», «мес» */
  shortLabel: string
  /** Показывать ли числовую цену */
  isNumeric: boolean
}

export const PRICE_UNITS: PriceUnitOption[] = [
  { id: 'per_piece', label: 'за штуку', shortLabel: 'штука', isNumeric: true },
  { id: 'per_5', label: 'за 5 шт', shortLabel: '5 шт', isNumeric: true },
  { id: 'per_10', label: 'за 10 шт', shortLabel: '10 шт', isNumeric: true },
  { id: 'per_day', label: 'за день', shortLabel: 'день', isNumeric: true },
  { id: 'per_week', label: 'за неделю', shortLabel: 'неделя', isNumeric: true },
  { id: 'per_month', label: 'за месяц', shortLabel: 'мес', isNumeric: true },
  { id: 'monthly', label: 'в месяц', shortLabel: 'мес', isNumeric: true },
  { id: 'weekly', label: 'в неделю', shortLabel: 'нед', isNumeric: true },
  { id: 'custom', label: 'индивидуально', shortLabel: 'индивидуально', isNumeric: false },
]

export function getPriceUnit(id: PriceUnitId) {
  return PRICE_UNITS.find((unit) => unit.id === id) ?? PRICE_UNITS[PRICE_UNITS.length - 1]
}

export function unitIdToServiceUnit(
  id: PriceUnitId,
): 'piece' | 'month' | 'project' {
  if (id === 'per_piece' || id === 'per_5' || id === 'per_10') return 'piece'
  if (id === 'per_month' || id === 'monthly') return 'month'
  return 'project'
}
