import { Hono } from 'hono'
import { getSupabase } from '../db/supabase.js'
import { readJsonBody } from '../lib/jsonBody.js'
import { clientIp, rateLimit } from '../lib/rateLimit.js'
import { requireUserAuth } from '../middleware/userAuth.js'
import { serverEnv } from '../config/env.js'

function normalizeTelegram(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`
}

function clientOrigin(originHeader: string | undefined) {
  const fromHeader = originHeader?.trim().replace(/\/$/, '')
  if (fromHeader && serverEnv.allowedOrigins.includes(fromHeader)) return fromHeader
  if (serverEnv.publicSiteUrl) return serverEnv.publicSiteUrl.replace(/\/$/, '')
  return 'http://localhost:5173'
}

function mapUser(user: {
  id: string
  email?: string
  email_confirmed_at?: string | null
  confirmed_at?: string | null
  user_metadata?: Record<string, unknown>
}) {
  return {
    id: user.id,
    email: user.email,
    email_confirmed_at: user.email_confirmed_at ?? null,
    confirmed_at: user.confirmed_at ?? null,
    user_metadata: user.user_metadata || {},
  }
}

async function loadProfile(userId: string) {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

async function ensureProfileFromUser(user: {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}) {
  const meta = user.user_metadata || {}
  const fullName = String(meta.full_name || '').trim()
  const telegramUsername = normalizeTelegram(String(meta.telegram_username || ''))
  const email = (user.email || '').trim().toLowerCase()

  const profile = await loadProfile(user.id)
  const needsName = !profile?.full_name && fullName
  const needsTelegram = !profile?.telegram_username && telegramUsername
  const needsCreate = !profile

  if (!needsCreate && !needsName && !needsTelegram) return profile

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: user.id,
        email: email || profile?.email || '',
        full_name: profile?.full_name || fullName || '',
        telegram_username: profile?.telegram_username || telegramUsername || '',
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .maybeSingle()

  if (error) return profile
  return data || profile
}

export const authRoutes = new Hono()

authRoutes.get('/status', (c) => {
  try {
    getSupabase()
    return c.json({ ok: true, configured: true })
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Supabase не настроен'
    console.warn('[auth.status]', reason)
    return c.json({ ok: true, configured: false, reason })
  }
})

function mapAuthError(message: string, cause?: unknown) {
  const lower = `${message} ${cause ?? ''}`.toLowerCase()
  if (
    lower.includes('fetch failed') ||
    lower.includes('enotfound') ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout') ||
    lower.includes('network') ||
    lower.includes('aborted')
  ) {
    return 'Не удалось связаться с Supabase с сервера. Проверьте SUPABASE_URL / SERVICE_ROLE_KEY в Vercel и что проект Supabase не на паузе.'
  }
  if (lower.includes('rate limit')) {
    return 'Слишком много попыток регистрации. Подождите несколько минут и попробуйте снова.'
  }
  if (lower.includes('already been registered') || lower.includes('already registered') || lower.includes('user already exists')) {
    return 'Этот email уже зарегистрирован. Войдите или восстановите пароль.'
  }
  if (lower.includes('is invalid') && lower.includes('email')) {
    return 'Укажите корректный email.'
  }
  if (lower.includes('password') && !lower.includes('invalid login')) {
    return 'Пароль не соответствует требованиям Supabase (минимум 8 символов).'
  }
  return message
}

authRoutes.post('/register', async (c) => {
  const ip = clientIp({ get: (n) => c.req.header(n) })
  const limited = rateLimit({ key: `auth-register:${ip}`, limit: 8, windowMs: 60 * 60 * 1000 })
  if (!limited.ok) {
    return c.json(
      { ok: false, error: `Слишком много попыток. Повторите через ${limited.retryAfterSec} с.` },
      429,
    )
  }

  const body = await c.req.json<{
    email?: string
    password?: string
    fullName?: string
    telegramUsername?: string
    consentTerms?: boolean
    consentPrivacy?: boolean
  }>()

  const email = (body.email || '').trim().toLowerCase()
  const password = body.password || ''
  const fullName = (body.fullName || '').trim()
  const telegramUsername = normalizeTelegram(body.telegramUsername || '')

  if (!fullName) return c.json({ ok: false, error: 'Укажите имя.' }, 400)
  if (!email.includes('@')) return c.json({ ok: false, error: 'Укажите корректный email.' }, 400)
  if (password.length < 8) {
    return c.json({ ok: false, error: 'Пароль должен быть не короче 8 символов.' }, 400)
  }
  if (!telegramUsername) return c.json({ ok: false, error: 'Укажите Telegram username.' }, 400)
  if (!body.consentTerms || !body.consentPrivacy) {
    return c.json({ ok: false, error: 'Нужно принять обязательные согласия' }, 400)
  }

  const supabase = getSupabase()
  const metadata = {
    full_name: fullName,
    telegram_username: telegramUsername,
    consent_terms: true,
    consent_privacy: true,
  }

  // No email confirmation at signup — account is ready immediately.
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  })

  if (createError || !created.user) {
    return c.json(
      { ok: false, error: mapAuthError(createError?.message || 'Не удалось создать аккаунт') },
      400,
    )
  }

  let profile = null
  try {
    profile = await loadProfile(created.user.id)
    if (!profile) {
      const { data: inserted, error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: created.user.id,
            email,
            full_name: fullName,
            telegram_username: telegramUsername,
          },
          { onConflict: 'user_id' },
        )
        .select('*')
        .maybeSingle()
      if (!profileError) profile = inserted

      if (body.consentTerms) {
        await supabase.from('user_consents').upsert(
          { user_id: created.user.id, consent_type: 'terms' },
          { onConflict: 'user_id,consent_type' },
        )
      }
      if (body.consentPrivacy) {
        await supabase.from('user_consents').upsert(
          { user_id: created.user.id, consent_type: 'privacy_personal_data' },
          { onConflict: 'user_id,consent_type' },
        )
      }
    }
  } catch {
    profile = null
  }

  const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !signedIn.session || !signedIn.user) {
    return c.json({
      ok: true,
      needsEmailConfirm: false,
      session: null,
      profile,
      user: mapUser(created.user),
      warning: 'Аккаунт создан. Войдите с тем же email и паролем.',
    })
  }

  return c.json({
    ok: true,
    needsEmailConfirm: false,
    session: {
      access_token: signedIn.session.access_token,
      refresh_token: signedIn.session.refresh_token,
      expires_at: signedIn.session.expires_at,
      user: mapUser(signedIn.user),
    },
    profile,
  })
})

authRoutes.post('/login', async (c) => {
  try {
    const ip = clientIp({ get: (n) => c.req.header(n) })
    const limited = rateLimit({ key: `auth-login:${ip}`, limit: 30, windowMs: 15 * 60 * 1000 })
    if (!limited.ok) {
      return c.json(
        { ok: false, error: `Слишком много попыток. Повторите через ${limited.retryAfterSec} с.` },
        429,
      )
    }

    const body = await c.req.json<{ email?: string; password?: string }>()
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''

    if (!email || !password) {
      return c.json({ ok: false, error: 'Укажите email и пароль.' }, 400)
    }

    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const raw = error.message || 'Не удалось войти'
      if (raw.toLowerCase().includes('invalid login') || raw.toLowerCase().includes('invalid credentials')) {
        return c.json({ ok: false, error: 'Неверный email или пароль.' }, 400)
      }
      return c.json({ ok: false, error: mapAuthError(raw) }, 400)
    }
    if (!data.user || !data.session) {
      return c.json({ ok: false, error: 'Не удалось войти' }, 400)
    }

    const profile = await ensureProfileFromUser(data.user)
    if (profile?.account_status === 'blocked') {
      return c.json({ ok: false, error: 'Аккаунт заблокирован. Свяжитесь с поддержкой.' }, 403)
    }

    return c.json({
      ok: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: mapUser(data.user),
      },
      profile,
    })
  } catch (error) {
    const err = error as Error & { cause?: unknown }
    console.error('[auth.login]', err.message, err.cause)
    return c.json({ ok: false, error: mapAuthError(err.message || 'Не удалось войти', err.cause) }, 502)
  }
})

authRoutes.post('/forgot-password', async (c) => {
  const body = await readJsonBody(c.req, { email: '' })
  const email = String(body.email || '').trim().toLowerCase()
  if (!email) return c.json({ ok: false, error: 'Укажите email.' }, 400)

  try {
    const supabase = getSupabase()
    const origin = clientOrigin(c.req.header('Origin'))
    const redirectTo = `${origin}/auth/reset-password`

    // Не ждём бесконечно ответ почтового провайдера Supabase
    const result = await Promise.race([
      supabase.auth.resetPasswordForEmail(email, { redirectTo }),
      new Promise<{ error: { message: string } }>((resolve) =>
        setTimeout(
          () =>
            resolve({
              error: {
                message:
                  'Таймаут отправки письма. Проверьте SMTP/лимиты в Supabase Auth или попробуйте позже.',
              },
            }),
          12_000,
        ),
      ),
    ])

    if (result.error) {
      console.warn('[auth.forgot-password]', result.error.message)
      return c.json({ ok: false, error: result.error.message }, 400)
    }
    return c.json({ ok: true })
  } catch (error) {
    console.error('[auth.forgot-password]', error)
    return c.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Не удалось отправить письмо',
      },
      500,
    )
  }
})

authRoutes.post('/refresh', async (c) => {
  const body = await c.req.json<{ refresh_token?: string }>()
  const refreshToken = body.refresh_token || ''
  if (!refreshToken) return c.json({ ok: false, error: 'Нет refresh token' }, 400)

  const supabase = getSupabase()
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })
  if (error || !data.session || !data.user) {
    return c.json({ ok: false, error: error?.message || 'Сессия истекла' }, 401)
  }

  const profile = await ensureProfileFromUser(data.user)
  if (profile?.account_status === 'blocked') {
    return c.json({ ok: false, error: 'Аккаунт заблокирован. Свяжитесь с поддержкой.' }, 403)
  }

  return c.json({
    ok: true,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: mapUser(data.user),
    },
    profile,
  })
})

authRoutes.get('/me', requireUserAuth, async (c) => {
  const supabase = getSupabase()
  const header = c.req.header('Authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return c.json({ ok: false, error: 'Сессия недействительна' }, 401)

  const profile = await ensureProfileFromUser(data.user)
  if (profile?.account_status === 'blocked') {
    return c.json({ ok: false, error: 'Аккаунт заблокирован. Свяжитесь с поддержкой.' }, 403)
  }

  return c.json({
    ok: true,
    user: mapUser(data.user),
    profile,
  })
})

authRoutes.patch('/profile', requireUserAuth, async (c) => {
  const authed = c.get('user')!
  const body = await c.req.json<{ full_name?: string; telegram_username?: string }>()

  const fullName = body.full_name?.trim()
  const telegramUsername =
    body.telegram_username !== undefined ? normalizeTelegram(body.telegram_username) : undefined

  if (body.full_name !== undefined && !fullName) {
    return c.json({ ok: false, error: 'Укажите имя.' }, 400)
  }
  if (body.telegram_username !== undefined && !telegramUsername) {
    return c.json({ ok: false, error: 'Укажите Telegram username.' }, 400)
  }

  const supabase = getSupabase()
  const existing = await loadProfile(authed.id)
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: authed.id,
        email: existing?.email || authed.email || '',
        full_name: fullName ?? existing?.full_name ?? '',
        telegram_username: telegramUsername ?? existing?.telegram_username ?? '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .maybeSingle()

  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, profile: data || (await loadProfile(authed.id)) })
})

authRoutes.post('/update-password', requireUserAuth, async (c) => {
  const authed = c.get('user')!
  const body = await c.req.json<{ password?: string }>()
  const password = body.password || ''
  if (password.length < 8) {
    return c.json({ ok: false, error: 'Пароль должен быть не короче 8 символов.' }, 400)
  }

  const supabase = getSupabase()
  const { error } = await supabase.auth.admin.updateUserById(authed.id, { password })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})

authRoutes.get('/orders', requireUserAuth, async (c) => {
  const authed = c.get('user')!
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('orders')
    .select('id, public_id, service_title, price, price_label, status, created_at')
    .eq('user_id', authed.id)
    .order('created_at', { ascending: false })

  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, orders: data || [] })
})
