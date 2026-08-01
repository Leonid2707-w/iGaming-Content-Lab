import {
  calcSocialCreativeMonthly,
  calcTelegramManagementMonthly,
  type StandardService,
} from '@/config/content/services'
import { calcVideoPackTotal } from '@/config/content/videoExamples'

export function formatMoney(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

export function calcPieceTotal(
  service: StandardService | undefined,
  quantity: number,
  showQuantity: boolean,
) {
  if (
    !service?.price ||
    service.unit !== 'piece' ||
    service.pricePrefix ||
    !showQuantity
  ) {
    return undefined
  }
  return service.price * quantity
}

export function calcOrderPreviewTotal(input: {
  telegramMonthly?: number
  igYoutubeMonthly?: number
  videoPackTotal?: number
  pieceTotal?: number
}) {
  return (
    input.telegramMonthly ??
    input.igYoutubeMonthly ??
    input.videoPackTotal ??
    input.pieceTotal
  )
}

export { calcSocialCreativeMonthly, calcTelegramManagementMonthly, calcVideoPackTotal }
