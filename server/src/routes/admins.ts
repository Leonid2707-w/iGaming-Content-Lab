import { Hono } from 'hono'
import { ADMIN_PERMISSIONS } from '../config/adminPermissions.js'
import {
  createAdmin,
  deleteAdmin,
  listAdmins,
  toPublicAdmin,
  updateAdmin,
} from '../db/admins.js'
import { readJsonBody } from '../lib/jsonBody.js'
import { requireAdmin, requirePermission } from '../middleware/adminAuth.js'

export const adminsAdminRoutes = new Hono()

adminsAdminRoutes.use('/*', requireAdmin)

adminsAdminRoutes.get('/permissions-catalog', (c) => {
  const admin = c.get('admin')
  if (!admin.isOwner && !admin.permissions.some((p) => p.startsWith('admins.'))) {
    return c.json({ ok: false, error: 'Недостаточно прав' }, 403)
  }
  return c.json({ ok: true, permissions: ADMIN_PERMISSIONS })
})

adminsAdminRoutes.get('/', requirePermission('admins.create', 'admins.delete', 'admins.permissions'), async (c) => {
  try {
    const admins = await listAdmins()
    return c.json({ ok: true, admins: admins.map(toPublicAdmin) })
  } catch (error) {
    return c.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить администраторов. Проверьте миграцию 007_admin_users.sql',
      },
      500,
    )
  }
})

adminsAdminRoutes.post('/', requirePermission('admins.create'), async (c) => {
  try {
    const actor = c.get('admin')
    if (!actor.isOwner && !actor.permissions.includes('admins.create')) {
      return c.json({ ok: false, error: 'Создавать администраторов может только владелец или с правом create' }, 403)
    }
    // TZ: создание доступно исключительно владельцу
    if (!actor.isOwner) {
      return c.json({ ok: false, error: 'Создавать администраторов может только владелец' }, 403)
    }

    const body = await readJsonBody(c.req, {
      login: '',
      password: '',
      displayName: '',
      isActive: true,
      permissions: [] as string[],
    })

    const admin = await createAdmin({
      login: body.login,
      password: body.password,
      displayName: body.displayName,
      isActive: body.isActive !== false,
      permissions: body.permissions,
    })
    return c.json({ ok: true, admin: toPublicAdmin(admin) }, 201)
  } catch (error) {
    return c.json(
      { ok: false, error: error instanceof Error ? error.message : 'Ошибка создания' },
      400,
    )
  }
})

adminsAdminRoutes.patch('/:id', requirePermission('admins.permissions'), async (c) => {
  try {
    const actor = c.get('admin')
    if (!actor.isOwner) {
      // Non-owners with admins.permissions can edit rights but not owner; create still owner-only
    }
    const body = await readJsonBody(c.req, {
      displayName: undefined as string | undefined,
      isActive: undefined as boolean | undefined,
      permissions: undefined as string[] | undefined,
      password: undefined as string | undefined,
    })

    // Only owner may set isActive false / change passwords of others if we want — TZ: owner can't be changed; others can be managed by admins.permissions
    if (body.isActive === false && !actor.isOwner && !actor.permissions.includes('admins.permissions')) {
      return c.json({ ok: false, error: 'Недостаточно прав' }, 403)
    }

    const admin = await updateAdmin(c.req.param('id'), {
      displayName: body.displayName,
      isActive: body.isActive,
      permissions: body.permissions,
      password: body.password,
    })
    return c.json({ ok: true, admin: toPublicAdmin(admin) })
  } catch (error) {
    return c.json(
      { ok: false, error: error instanceof Error ? error.message : 'Ошибка обновления' },
      400,
    )
  }
})

adminsAdminRoutes.delete('/:id', requirePermission('admins.delete'), async (c) => {
  try {
    await deleteAdmin(c.req.param('id'))
    return c.json({ ok: true })
  } catch (error) {
    return c.json(
      { ok: false, error: error instanceof Error ? error.message : 'Ошибка удаления' },
      400,
    )
  }
})
