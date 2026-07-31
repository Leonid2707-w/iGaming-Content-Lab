import type { Hono } from 'hono'

type FetchApp = { fetch: typeof Hono.prototype.fetch }

let cached: FetchApp | null = null

async function getApp(): Promise<FetchApp> {
  if (cached) return cached
  const mod = await import('../server/src/app')
  cached = mod.app
  return cached
}

/**
 * Lazy-load the Hono app so boot failures return JSON instead of
 * Vercel's opaque FUNCTION_INVOCATION_FAILED.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const app = await getApp()
      return await app.fetch(request)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const stack = error instanceof Error ? error.stack : undefined
      console.error('[api.boot]', message, stack)
      return Response.json(
        {
          ok: false,
          error: message,
          stack: process.env.VERCEL_ENV === 'production' ? undefined : stack,
        },
        { status: 500 },
      )
    }
  },
}
