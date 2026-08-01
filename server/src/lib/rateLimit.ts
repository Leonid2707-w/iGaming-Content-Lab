/** Simple in-memory sliding-window rate limiter for serverless/node. */

type Bucket = { timestamps: number[] }

const buckets = new Map<string, Bucket>()

export function rateLimit(options: {
  key: string
  limit: number
  windowMs: number
}): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now()
  const windowStart = now - options.windowMs
  let bucket = buckets.get(options.key)
  if (!bucket) {
    bucket = { timestamps: [] }
    buckets.set(options.key, bucket)
  }
  bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart)
  if (bucket.timestamps.length >= options.limit) {
    const oldest = bucket.timestamps[0] || now
    const retryAfterSec = Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000))
    return { ok: false, retryAfterSec }
  }
  bucket.timestamps.push(now)

  if (buckets.size > 10_000) {
    for (const [key, value] of buckets) {
      value.timestamps = value.timestamps.filter((t) => t > windowStart)
      if (!value.timestamps.length) buckets.delete(key)
    }
  }

  return { ok: true }
}

export function clientIp(headers: { get(name: string): string | undefined }) {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || headers.get('cf-connecting-ip') || headers.get('x-real-ip') || 'unknown'
}
