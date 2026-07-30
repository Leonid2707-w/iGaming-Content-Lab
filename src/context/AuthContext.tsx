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
import { normalizeTelegramUsername, type UserProfile } from '@/config/auth'
import {
  clearStoredSession,
  readStoredSession,
  setRememberMe,
  writeStoredSession,
  type AuthSession,
  type AuthUser,
} from '@/lib/authSession'

interface RegisterInput {
  email: string
  password: string
  fullName: string
  telegramUsername: string
  consentTerms: boolean
  consentPrivacy: boolean
}

interface AuthContextValue {
  configured: boolean
  loading: boolean
  session: AuthSession | null
  user: AuthUser | null
  profile: UserProfile | null
  emailConfirmed: boolean
  isAuthenticated: boolean
  accessToken: string | null
  refreshProfile: () => Promise<void>
  register: (
    input: RegisterInput,
  ) => Promise<{ ok: boolean; error?: string; needsEmailConfirm?: boolean; warning?: string }>
  login: (
    email: string,
    password: string,
    rememberMe: boolean,
  ) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>
  updatePassword: (password: string) => Promise<{ ok: boolean; error?: string }>
  updateProfile: (
    patch: Partial<Pick<UserProfile, 'full_name' | 'telegram_username'>>,
  ) => Promise<{ ok: boolean; error?: string }>
  applySession: (session: AuthSession) => Promise<{ ok: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25_000)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    const text = await response.text()
    let data: T
    try {
      data = JSON.parse(text) as T
    } catch {
      throw new Error(
        response.ok
          ? 'Сервер вернул некорректный ответ'
          : response.status === 404
            ? 'API не найден (404). Откройте сайт как http://127.0.0.1:5173 и убедитесь, что npm run dev запущен.'
            : `Ошибка сервера (${response.status}). Проверьте, что API запущен.`,
      )
    }
    return data
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Сервер не отвечает. Проверьте, что npm run dev запущен, и попробуйте снова.')
    }
    if (error instanceof TypeError) {
      throw new Error('Нет связи с API. Запустите сервер (npm run dev) и обновите страницу.')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [configured, setConfigured] = useState(true)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const applyAuthState = useCallback((nextSession: AuthSession | null, nextProfile: UserProfile | null) => {
    setSession(nextSession)
    setUser(nextSession?.user ?? null)
    setProfile(nextProfile)
    writeStoredSession(nextSession)
  }, [])

  const refreshWithToken = useCallback(
    async (refreshToken: string) => {
      const data = await apiJson<{
        ok: boolean
        error?: string
        session?: AuthSession
        profile?: UserProfile | null
      }>('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!data.ok || !data.session) {
        applyAuthState(null, null)
        return { ok: false as const, error: data.error || 'Сессия истекла' }
      }
      applyAuthState(data.session, data.profile ?? null)
      return { ok: true as const }
    },
    [applyAuthState],
  )

  const loadMe = useCallback(
    async (accessToken: string, refreshToken?: string) => {
      const data = await apiJson<{
        ok: boolean
        error?: string
        user?: AuthUser
        profile?: UserProfile | null
      }>('/api/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (data.ok && data.user) {
        const current = readStoredSession()
        const nextSession: AuthSession = {
          access_token: accessToken,
          refresh_token: refreshToken || current?.refresh_token || '',
          expires_at: current?.expires_at,
          user: data.user,
        }
        applyAuthState(nextSession, data.profile ?? null)
        return { ok: true as const }
      }

      if (refreshToken) {
        return refreshWithToken(refreshToken)
      }

      applyAuthState(null, null)
      return { ok: false as const, error: data.error || 'Сессия недействительна' }
    },
    [applyAuthState, refreshWithToken],
  )

  useEffect(() => {
    let mounted = true

    async function boot() {
      try {
        const status = await apiJson<{ ok: boolean; configured?: boolean }>('/api/auth/status')
        if (!mounted) return
        setConfigured(Boolean(status.configured))
        if (!status.configured) {
          setLoading(false)
          return
        }

        const stored = readStoredSession()
        if (!stored?.access_token) {
          setLoading(false)
          return
        }

        await loadMe(stored.access_token, stored.refresh_token)
      } catch {
        // API temporarily unreachable — don't scare users with .env instructions
        if (mounted) setConfigured(true)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void boot()
    return () => {
      mounted = false
    }
  }, [loadMe])

  const refreshProfile = useCallback(async () => {
    const stored = readStoredSession()
    if (!stored?.access_token) {
      applyAuthState(null, null)
      return
    }
    await loadMe(stored.access_token, stored.refresh_token)
  }, [applyAuthState, loadMe])

  const applySession = useCallback(
    async (next: AuthSession) => {
      writeStoredSession(next)
      return loadMe(next.access_token, next.refresh_token)
    },
    [loadMe],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      if (!configured) return { ok: false, error: 'Supabase не настроен на сервере' }
      if (!input.consentTerms || !input.consentPrivacy) {
        return { ok: false, error: 'Нужно принять обязательные согласия' }
      }

      try {
        const data = await apiJson<{
          ok: boolean
          error?: string
          needsEmailConfirm?: boolean
          warning?: string
          session?: AuthSession | null
          profile?: UserProfile | null
        }>('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: input.email,
            password: input.password,
            fullName: input.fullName,
            telegramUsername: normalizeTelegramUsername(input.telegramUsername),
            consentTerms: input.consentTerms,
            consentPrivacy: input.consentPrivacy,
          }),
        })

        if (!data.ok) return { ok: false, error: data.error || 'Не удалось зарегистрироваться' }

        if (data.session) {
          applyAuthState(data.session, data.profile ?? null)
        }

        return {
          ok: true,
          needsEmailConfirm: false,
          warning: data.warning,
        }
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Не удалось зарегистрироваться',
        }
      }
    },
    [applyAuthState, configured],
  )

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      if (!configured) return { ok: false, error: 'Вход временно недоступен' }
      setRememberMe(remember)

      try {
        const data = await apiJson<{
          ok: boolean
          error?: string
          session?: AuthSession
          profile?: UserProfile | null
        }>('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        if (!data.ok || !data.session) {
          const raw = (data.error || '').toLowerCase()
          if (raw.includes('invalid login') || raw.includes('invalid credentials')) {
            return { ok: false, error: 'Неверный email или пароль.' }
          }
          if (raw.includes('email not confirmed')) {
            return { ok: false, error: 'Email ещё не подтверждён.' }
          }
          return { ok: false, error: data.error || 'Не удалось войти' }
        }

        applyAuthState(data.session, data.profile ?? null)
        return { ok: true }
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Не удалось войти',
        }
      }
    },
    [applyAuthState, configured],
  )

  const logout = useCallback(async () => {
    clearStoredSession()
    applyAuthState(null, null)
  }, [applyAuthState])

  const requestPasswordReset = useCallback(
    async (email: string) => {
      if (!configured) return { ok: false, error: 'Supabase не настроен на сервере' }
      try {
        const data = await apiJson<{ ok: boolean; error?: string }>('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        if (!data.ok) return { ok: false, error: data.error || 'Не удалось отправить письмо' }
        return { ok: true }
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'Не удалось отправить письмо. Проверьте, что API запущен.',
        }
      }
    },
    [configured],
  )

  const updatePassword = useCallback(
    async (password: string) => {
      if (!configured || !session?.access_token) {
        return { ok: false, error: 'Нужна авторизация' }
      }
      const data = await apiJson<{ ok: boolean; error?: string }>('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ password }),
      })
      if (!data.ok) return { ok: false, error: data.error || 'Не удалось обновить пароль' }
      return { ok: true }
    },
    [configured, session?.access_token],
  )

  const updateProfile = useCallback(
    async (patch: Partial<Pick<UserProfile, 'full_name' | 'telegram_username'>>) => {
      if (!configured || !session?.access_token) {
        return { ok: false, error: 'Нужна авторизация' }
      }
      const data = await apiJson<{
        ok: boolean
        error?: string
        profile?: UserProfile | null
      }>('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(patch),
      })
      if (!data.ok) return { ok: false, error: data.error || 'Не удалось сохранить' }
      setProfile(data.profile ?? null)
      return { ok: true }
    },
    [configured, session?.access_token],
  )

  const emailConfirmed = Boolean(user?.email_confirmed_at || user?.confirmed_at)

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      session,
      user,
      profile,
      emailConfirmed,
      isAuthenticated: Boolean(session && user),
      accessToken: session?.access_token ?? null,
      refreshProfile,
      register,
      login,
      logout,
      requestPasswordReset,
      updatePassword,
      updateProfile,
      applySession,
    }),
    [
      configured,
      loading,
      session,
      user,
      profile,
      emailConfirmed,
      refreshProfile,
      register,
      login,
      logout,
      requestPasswordReset,
      updatePassword,
      updateProfile,
      applySession,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
