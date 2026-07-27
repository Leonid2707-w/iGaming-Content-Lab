import { createHmac, timingSafeEqual } from 'node:crypto'
import { createMiddleware } from 'hono/factory'
import { serverEnv } from '../config/env.js'

interface AdminTokenPayload {
  sub: string
  exp: number
}

function sign(payload: string) {
  return createHmac('sha256', serverEnv.adminApiSecret).update(payload).digest('hex')
}

export function createAdminToken(login: string, ttlMs = 1000 * 60 * 60 * 8) {
  const payload: AdminTokenPayload = {
    sub: login,
    exp: Date.now() + ttlMs,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

export function verifyAdminToken(token?: string | null): AdminTokenPayload | null {
  if (!token) return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null

  const expected = sign(body)
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AdminTokenPayload
    if (!payload.sub || !payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function validateAdminCredentials(login: string, password: string) {
  return login.trim() === serverEnv.adminLogin && password === serverEnv.adminPassword
}

export const requireAdmin = createMiddleware(async (c, next) => {
  const header = c.req.header('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const payload = verifyAdminToken(token)
  if (!payload) {
    return c.json({ ok: false, error: 'Требуется авторизация администратора' }, 401)
  }
  await next()
})
