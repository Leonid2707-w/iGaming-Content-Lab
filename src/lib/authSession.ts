import { REMEMBER_ME_KEY } from '@/config/auth'

export interface AuthUser {
  id: string
  email?: string
  email_confirmed_at?: string | null
  confirmed_at?: string | null
  user_metadata?: Record<string, unknown>
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_at?: number
  user: AuthUser
}

const SESSION_KEY = 'icl-auth-session'

function storage(): Storage {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    }
  }
  const remember = window.localStorage.getItem(REMEMBER_ME_KEY)
  return remember === '0' ? window.sessionStorage : window.localStorage
}

export function setRememberMe(remember: boolean) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(REMEMBER_ME_KEY, remember ? '1' : '0')
}

export function readStoredSession(): AuthSession | null {
  try {
    const raw = storage().getItem(SESSION_KEY) || window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function writeStoredSession(session: AuthSession | null) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SESSION_KEY)
  window.sessionStorage.removeItem(SESSION_KEY)
  if (!session) return
  storage().setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearStoredSession() {
  writeStoredSession(null)
}

/** Parse tokens from Supabase email-confirm / recovery redirect hash. */
export function parseAuthHash(hash: string): AuthSession | null {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (!access_token || !refresh_token) return null

  const expiresIn = Number(params.get('expires_in') || 0)
  return {
    access_token,
    refresh_token,
    expires_at: expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : undefined,
    user: {
      id: '',
      email: params.get('email') || undefined,
      email_confirmed_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
    },
  }
}
