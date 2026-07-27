import type { Context, Next } from 'hono'
import { getSupabase } from '../db/supabase.js'

export type AuthedUser = {
  id: string
  email: string | undefined
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthedUser | null
  }
}

async function resolveUserFromRequest(c: Context): Promise<AuthedUser | null> {
  const header = c.req.header('Authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) return null

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_status')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (profile?.account_status === 'blocked') return null

    return { id: data.user.id, email: data.user.email }
  } catch {
    return null
  }
}

export async function optionalUserAuth(c: Context, next: Next) {
  c.set('user', await resolveUserFromRequest(c))
  await next()
}

export async function requireUserAuth(c: Context, next: Next) {
  const user = await resolveUserFromRequest(c)
  if (!user) {
    return c.json({ ok: false, error: 'Требуется авторизация' }, 401)
  }
  c.set('user', user)
  await next()
}
