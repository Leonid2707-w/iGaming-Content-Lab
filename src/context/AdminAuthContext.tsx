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

interface AdminSession {
  login: string
  expiresAt: number
  apiToken?: string
}

interface AdminAuthContextValue {
  isAuthenticated: boolean
  apiToken: string | null
  loginModalOpen: boolean
  openLoginModal: () => void
  closeLoginModal: () => void
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)
const API_TOKEN_KEY = 'icl-admin-api-token'

function clearSessionStorage() {
  sessionStorage.removeItem(adminConfig.sessionKey)
  sessionStorage.removeItem(API_TOKEN_KEY)
}

function readSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(adminConfig.sessionKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AdminSession
    if (!parsed?.expiresAt || parsed.expiresAt < Date.now()) {
      clearSessionStorage()
      return null
    }
    const apiToken = sessionStorage.getItem(API_TOKEN_KEY) || parsed.apiToken || ''
    // Старые сессии без API-токена не считаются валидными
    if (!apiToken) {
      clearSessionStorage()
      return null
    }
    return { ...parsed, apiToken }
  } catch {
    clearSessionStorage()
    return null
  }
}

function writeSession(login: string, apiToken: string) {
  const session: AdminSession = {
    login,
    expiresAt: Date.now() + adminConfig.sessionTtlMs,
    apiToken,
  }
  sessionStorage.setItem(adminConfig.sessionKey, JSON.stringify(session))
  sessionStorage.setItem(API_TOKEN_KEY, apiToken)
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const initial = readSession()
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!initial?.apiToken)
  const [apiToken, setApiToken] = useState<string | null>(() => initial?.apiToken || null)
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  useEffect(() => {
    const session = readSession()
    if (!session?.apiToken) {
      setIsAuthenticated(false)
      setApiToken(null)
      return
    }
    setIsAuthenticated(true)
    setApiToken(session.apiToken)
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
      writeSession(trimmed, api.token)
      setApiToken(api.token)
      setIsAuthenticated(true)
      setLoginModalOpen(false)
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? `API недоступен: ${error.message}. Убедитесь, что запущен npm run dev.`
            : 'API заявок недоступен. Запустите npm run dev.',
      }
    }
  }, [])

  const logout = useCallback(() => {
    clearSessionStorage()
    setApiToken(null)
    setIsAuthenticated(false)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated,
      apiToken,
      loginModalOpen,
      openLoginModal,
      closeLoginModal,
      login,
      logout,
    }),
    [
      apiToken,
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
