/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { adminLoginRequest } from '@/api/orders'
import { adminConfig } from '@/config/admin'
import {
  hasAnyPermission,
  type AdminPermission,
} from '@/config/adminPermissions'

interface AdminProfile {
  id: string
  login: string
  displayName: string
  isOwner: boolean
  permissions: AdminPermission[]
}

interface AdminSession {
  login: string
  expiresAt: number
  apiToken?: string
  profile?: AdminProfile
}

interface AdminAuthContextValue {
  isAuthenticated: boolean
  apiToken: string | null
  admin: AdminProfile | null
  isOwner: boolean
  permissions: AdminPermission[]
  can: (key: AdminPermission) => boolean
  canAny: (...keys: AdminPermission[]) => boolean
  loginModalOpen: boolean
  openLoginModal: () => void
  closeLoginModal: () => void
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)
const API_TOKEN_KEY = 'icl-admin-api-token'
const PROFILE_KEY = 'icl-admin-profile'

function clearSessionStorage() {
  sessionStorage.removeItem(adminConfig.sessionKey)
  sessionStorage.removeItem(API_TOKEN_KEY)
  sessionStorage.removeItem(PROFILE_KEY)
}

function readProfile(): AdminProfile | null {
  try {
    const raw = sessionStorage.getItem(PROFILE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AdminProfile
  } catch {
    return null
  }
}

function writeProfile(profile: AdminProfile) {
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

function readSession(): {
  login: string
  expiresAt: number
  apiToken: string
  profile: AdminProfile | null
} | null {
  try {
    const raw = sessionStorage.getItem(adminConfig.sessionKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AdminSession
    if (!parsed?.expiresAt || parsed.expiresAt < Date.now()) {
      clearSessionStorage()
      return null
    }
    const apiToken = sessionStorage.getItem(API_TOKEN_KEY) || parsed.apiToken || ''
    if (!apiToken) {
      clearSessionStorage()
      return null
    }
    return {
      login: parsed.login,
      expiresAt: parsed.expiresAt,
      apiToken,
      profile: readProfile() ?? parsed.profile ?? null,
    }
  } catch {
    clearSessionStorage()
    return null
  }
}

function writeSession(login: string, apiToken: string, profile: AdminProfile) {
  const session: AdminSession = {
    login,
    expiresAt: Date.now() + adminConfig.sessionTtlMs,
    apiToken,
    profile,
  }
  sessionStorage.setItem(adminConfig.sessionKey, JSON.stringify(session))
  sessionStorage.setItem(API_TOKEN_KEY, apiToken)
  writeProfile(profile)
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const initial = readSession()
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!initial?.apiToken)
  const [apiToken, setApiToken] = useState<string | null>(() => initial?.apiToken || null)
  const [admin, setAdmin] = useState<AdminProfile | null>(() => initial?.profile || null)
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  useEffect(() => {
    const session = readSession()
    if (!session?.apiToken) {
      setIsAuthenticated(false)
      setApiToken(null)
      setAdmin(null)
      return
    }
    setIsAuthenticated(true)
    setApiToken(session.apiToken)
    setAdmin(session.profile)
  }, [])

  const openLoginModal = useCallback(() => setLoginModalOpen(true), [])
  const closeLoginModal = useCallback(() => setLoginModalOpen(false), [])

  const login = useCallback(async (username: string, password: string) => {
    const trimmed = username.trim()
    if (!trimmed || !password) {
      return { ok: false, error: 'Укажите логин и пароль.' }
    }

    try {
      const api = await adminLoginRequest(trimmed, password)
      if (!api.ok || !api.token) {
        return { ok: false, error: api.error || 'Неверный логин или пароль.' }
      }
      const profile: AdminProfile = {
        id: api.admin?.id || 'unknown',
        login: api.admin?.login || trimmed,
        displayName: api.admin?.displayName || '',
        isOwner: Boolean(api.admin?.isOwner),
        permissions: (api.admin?.permissions || []) as AdminPermission[],
      }
      writeSession(profile.login, api.token, profile)
      setApiToken(api.token)
      setAdmin(profile)
      setIsAuthenticated(true)
      setLoginModalOpen(false)
      return { ok: true }
    } catch (error) {
      const host = typeof window !== 'undefined' ? window.location.hostname : ''
      const local = host === 'localhost' || host === '127.0.0.1'
      const hint = local
        ? 'Убедитесь, что запущен npm run dev.'
        : 'На домене проверьте Vercel: /api/health и Environment Variables.'
      return {
        ok: false,
        error:
          error instanceof Error
            ? `API недоступен: ${error.message}. ${hint}`
            : `API заявок недоступен. ${hint}`,
      }
    }
  }, [])

  const logout = useCallback(() => {
    clearSessionStorage()
    setApiToken(null)
    setAdmin(null)
    setIsAuthenticated(false)
  }, [])

  const can = useCallback(
    (key: AdminPermission) => {
      if (admin?.isOwner) return true
      return Boolean(admin?.permissions?.includes(key))
    },
    [admin],
  )

  const canAny = useCallback(
    (...keys: AdminPermission[]) => hasAnyPermission(admin?.permissions, keys, admin?.isOwner),
    [admin],
  )

  const value = useMemo(
    () => ({
      isAuthenticated,
      apiToken,
      admin,
      isOwner: Boolean(admin?.isOwner),
      permissions: admin?.permissions || [],
      can,
      canAny,
      loginModalOpen,
      openLoginModal,
      closeLoginModal,
      login,
      logout,
    }),
    [
      admin,
      apiToken,
      can,
      canAny,
      closeLoginModal,
      isAuthenticated,
      login,
      loginModalOpen,
      logout,
      openLoginModal,
    ],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return context
}
