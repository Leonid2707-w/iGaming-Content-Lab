import { describe, expect, it } from 'vitest'
import { isAllowedOrderMime, MAX_ORDER_FILE_BYTES, validateOrderFiles } from './orderFiles'

describe('orderFiles', () => {
  it('allows common media mime types', () => {
    expect(isAllowedOrderMime('video/mp4')).toBe(true)
    expect(isAllowedOrderMime('image/png')).toBe(true)
    expect(isAllowedOrderMime('application/pdf')).toBe(true)
    expect(isAllowedOrderMime('application/x-msdownload')).toBe(false)
  })

  it('rejects oversized files', () => {
    const huge = new File([new Uint8Array(10)], 'clip.mp4', { type: 'video/mp4' })
    Object.defineProperty(huge, 'size', { value: MAX_ORDER_FILE_BYTES + 1 })
    const result = validateOrderFiles([huge])
    expect(result.ok).toHaveLength(0)
    expect(result.errors[0]).toMatch(/50/)
  })
})
