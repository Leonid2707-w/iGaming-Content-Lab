import { createHmac, timingSafeEqual } from 'node:crypto'
import { createMiddleware } from 'hono/factory'
import {
  hasAnyPermission,
  hasPermission,
  type AdminPermission,
} from '../config/adminPermissions.js'
import { findAdminByLogin, type AdminUserRecord } from '../db/admins.js'
import { verifyPassword } from '../lib/password.js'
import { serverEnv } from '../config/env.js'

export interface AdminAuthContext {
  id: string
  login: string
  isOwner: boolean
  permissions: AdminPermission[]
  displayName: string
}

interface AdminTokenPayload {
  sub: string
  adminId: string
  isOwner: boolean
  permissions: AdminPermission[]
  displayName?: string
  exp: number
}

declare module 'hono' {
  interface ContextVariableMap {
    admin: AdminAuthContext
  }
}

function sign(payload: string) {
  return createHmac('sha256', serverEnv.adminApiSecret).update(payload).digest('hex')
}

function safeEqualString(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function createAdminToken(
  admin: Pick<AdminAuthContext, 'id' | 'login' | 'isOwner' | 'permissions' | 'displayName'>,
  ttlMs = 1000 * 60 * 60 * 8,
) {
  const payload: AdminTokenPayload = {
    sub: admin.login,
    adminId: admin.id,
    isOwner: admin.isOwner,
    permissions: admin.isOwner ? [] : admin.permissions,
    displayName: admin.displayName,
    exp: Date.now() + ttlMs,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

export function verifyAdminToken(token?: string | null): AdminTokenPayload | null {
  if (!token || !serverEnv.adminApiSecret) return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null

  const expected = sign(body)
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AdminTokenPayload
    if (!payload.sub || !payload.adminId || !payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

/** Legacy env compare (bootstrap fallback if DB table missing). */
export function validateAdminCredentials(login: string, password: string) {
  if (!serverEnv.adminPassword) return false
  const expectedLogin = (serverEnv.adminLogin || 'leonid').trim()
  const loginOk =
    safeEqualString(login.trim().toLowerCase(), expectedLogin.toLowerCase()) ||
    safeEqualString(login.trim().toLowerCase(), 'leonid')
  return loginOk && safeEqualString(password, serverEnv.adminPassword)
}

export async function authenticateAdmin(
  login: string,
  password: string,
): Promise<AdminAuthContext | null> {
  try {
    const admin = await findAdminByLogin(login)
    if (admin) {
      if (!admin.is_active) return null
      const ok = await verifyPassword(password, admin.password_hash)
      if (!ok) return null
      return fromRecord(admin)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!/admin_users|schema cache|relation/i.test(message)) {
      console.warn('[admin.auth]', message)
    }
  }

  // Fallback until migration 007 is applied
  if (validateAdminCredentials(login, password)) {
    return {
      id: 'env-owner',
      login: 'leonid',
      isOwner: true,
      permissions: [],
      displayName: 'Владелец',
    }
  }
  return null
}

function fromRecord(admin: AdminUserRecord): AdminAuthContext {
  return {
    id: admin.id,
    login: admin.login,
    isOwner: admin.is_owner,
    permissions: admin.permissions,
    displayName: admin.display_name,
  }
}

function contextFromToken(payload: AdminTokenPayload): AdminAuthContext {
  return {
    id: payload.adminId,
    login: payload.sub,
    isOwner: Boolean(payload.isOwner),
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    displayName: payload.displayName || '',
  }
}

export const requireAdmin = createMiddleware(async (c, next) => {
  const header = c.req.header('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const payload = verifyAdminToken(token)
  if (!payload) {
    return c.json({ ok: false, error: 'Требуется авторизация администратора' }, 401)
  }
  c.set('admin', contextFromToken(payload))
  await next()
})

export function requirePermission(...keys: AdminPermission[]) {
  return createMiddleware(async (c, next) => {
    const admin = c.get('admin')
    if (!admin) {
      return c.json({ ok: false, error: 'Требуется авторизация администратора' }, 401)
    }
    if (!hasAnyPermission(admin, keys)) {
      return c.json({ ok: false, error: 'Недостаточно прав' }, 403)
    }
    await next()
  })
}

export function requireAllPermissions(...keys: AdminPermission[]) {
  return createMiddleware(async (c, next) => {
    const admin = c.get('admin')
    if (!admin) {
      return c.json({ ok: false, error: 'Требуется авторизация администратора' }, 401)
    }
    if (!keys.every((key) => hasPermission(admin, key))) {
      return c.json({ ok: false, error: 'Недостаточно прав' }, 403)
    }
    await next()
  })
}
