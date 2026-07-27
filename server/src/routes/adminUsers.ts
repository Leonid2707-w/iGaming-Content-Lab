import { Hono } from 'hono'
import { requireAdmin } from '../middleware/adminAuth.js'
import { getSupabase } from '../db/supabase.js'

export const adminUsersRoutes = new Hono()

adminUsersRoutes.use('/*', requireAdmin)

adminUsersRoutes.get('/', async (c) => {
  try {
    const search = (c.req.query('search') || '').trim().toLowerCase()
    const sort = c.req.query('sort') || 'newest'
    const status = c.req.query('status') || 'all'
    const supabase = getSupabase()

    let query = supabase.from('profiles').select('*')
    if (status === 'active' || status === 'blocked') {
      query = query.eq('account_status', status)
    }
    query = query.order('created_at', { ascending: sort === 'oldest' })

    const { data: profiles, error } = await query.limit(500)
    if (error) throw error

    // last_sign_in_at from auth.users via admin API (batched)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (authError) throw authError

    const lastSignIn = new Map(
      (authData.users || []).map((user) => [user.id, user.last_sign_in_at || null]),
    )

    let users = (profiles || []).map((profile) => ({
      id: profile.id,
      userId: profile.user_id,
      email: profile.email,
      fullName: profile.full_name,
      telegramUsername: profile.telegram_username,
      companyName: profile.company_name,
      companyRole: profile.company_role,
      accountStatus: profile.account_status,
      createdAt: profile.created_at,
      lastSignInAt: lastSignIn.get(profile.user_id) || null,
    }))

    if (search) {
      users = users.filter((user) => {
        const hay = [
          user.email,
          user.fullName,
          user.telegramUsername,
          user.companyName,
          user.companyRole,
          user.userId,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return hay.includes(search)
      })
    }

    return c.json({ ok: true, users })
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Ошибка загрузки пользователей',
      },
      500,
    )
  }
})

adminUsersRoutes.get('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const supabase = getSupabase()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    if (!profile) return c.json({ ok: false, error: 'Пользователь не найден' }, 404)

    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    const { data: consents } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId)

    return c.json({
      ok: true,
      user: {
        ...profile,
        last_sign_in_at: authUser.user?.last_sign_in_at || null,
        email_confirmed_at: authUser.user?.email_confirmed_at || null,
        consents: consents || [],
      },
    })
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Ошибка загрузки профиля',
      },
      500,
    )
  }
})

adminUsersRoutes.patch('/:userId/status', async (c) => {
  try {
    const userId = c.req.param('userId')
    const body = await c.req.json<{ status?: string }>().catch(() => ({}))
    const status = body.status
    if (status !== 'active' && status !== 'blocked') {
      return c.json({ ok: false, error: 'Некорректный статус' }, 400)
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('profiles')
      .update({ account_status: status, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select('*')
      .single()
    if (error) throw error

    // Ban/unban at Auth level as well
    const { error: banError } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: status === 'blocked' ? '876000h' : 'none',
    })
    if (banError) {
      return c.json(
        {
          ok: false,
          error: `Профиль обновлён, но бан в Auth не применился: ${banError.message}`,
        },
        500,
      )
    }

    return c.json({ ok: true, profile: data })
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Ошибка обновления статуса',
      },
      500,
    )
  }
})
