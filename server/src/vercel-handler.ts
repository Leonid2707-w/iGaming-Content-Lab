import { Hono } from 'hono'
import { app as iclApp } from './app.js'

/**
 * Vercel (non-Next) cannot reliably catch nested /api/a/b via [[...route]].
 * vercel.json rewrites /api/* → /api (this file). Preserve the original path
 * when the platform collapses it to /api.
 */
const app = new Hono()

app.all('*', async (c) => {
  const url = new URL(c.req.url)
  let pathname = url.pathname

  if (pathname === '/api' || pathname === '/api/') {
    const original =
      c.req.header('x-forwarded-uri') ||
      c.req.header('x-invoke-path') ||
      c.req.header('x-vercel-forwarded-path') ||
      c.req.query('path')
    if (original) {
      const normalized = original.startsWith('/') ? original : `/${original}`
      if (normalized.startsWith('/api')) pathname = normalized
    }
  }

  const target = new URL(pathname + url.search, url.origin)
  return iclApp.fetch(new Request(target, c.req.raw))
})

export default app
