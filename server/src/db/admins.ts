import { getSupabase } from './supabase.js'
import {
  sanitizePermissions,
  type AdminPermission,
} from '../config/adminPermissions.js'
import { hashPassword } from '../lib/password.js'
import { serverEnv } from '../config/env.js'

export interface AdminUserRecord {
  id: string
  login: string
  password_hash: string
  display_name: string
  is_owner: boolean
  is_active: boolean
  permissions: AdminPermission[]
  created_at: string
  updated_at: string
}

function mapAdmin(row: Record<string, unknown>): AdminUserRecord {
  return {
    id: String(row.id),
    login: String(row.login),
    password_hash: String(row.password_hash),
    display_name: String(row.display_name || ''),
    is_owner: Boolean(row.is_owner),
    is_active: Boolean(row.is_active),
    permissions: sanitizePermissions(row.permissions),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export function toPublicAdmin(admin: AdminUserRecord) {
  return {
    id: admin.id,
    login: admin.login,
    displayName: admin.display_name,
    isOwner: admin.is_owner,
    isActive: admin.is_active,
    permissions: admin.is_owner ? ([] as AdminPermission[]) : admin.permissions,
    createdAt: admin.created_at,
    updatedAt: admin.updated_at,
  }
}

export async function findAdminByLogin(login: string) {
  const supabase = getSupabase()
  const normalized = login.trim().toLowerCase()
  const { data, error } = await supabase.from('admin_users').select('*')
  if (error) throw new Error(error.message)
  const row = (data || []).find(
    (item) => String((item as { login?: string }).login || '').toLowerCase() === normalized,
  )
  return row ? mapAdmin(row as Record<string, unknown>) : null
}

export async function findAdminById(id: string) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapAdmin(data as Record<string, unknown>) : null
}

export async function listAdmins() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .order('is_owner', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data || []).map((row) => mapAdmin(row as Record<string, unknown>))
}

/** Ensure Super Admin `leonid` exists; password from ADMIN_PASSWORD (hashed). */
export async function ensureOwnerAdmin() {
  if (!serverEnv.adminPassword) {
    console.warn('[admins] ADMIN_PASSWORD empty — owner seed skipped')
    return
  }

  const existing = await findAdminByLogin('leonid')
  const passwordHash = await hashPassword(serverEnv.adminPassword)

  if (existing) {
    if (!existing.is_owner || !existing.is_active) {
      const supabase = getSupabase()
      await supabase
        .from('admin_users')
        .update({
          is_owner: true,
          is_active: true,
          password_hash: passwordHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      // Keep owner password in sync with env so deploy resets work without SQL.
      const supabase = getSupabase()
      await supabase
        .from('admin_users')
        .update({
          password_hash: passwordHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    }
    return
  }

  const supabase = getSupabase()
  const { error } = await supabase.from('admin_users').insert({
    login: 'leonid',
    password_hash: passwordHash,
    display_name: 'Владелец',
    is_owner: true,
    is_active: true,
    permissions: [],
  })
  if (error) {
    if (/relation .*admin_users.* does not exist|schema cache/i.test(error.message)) {
      console.warn(
        '[admins] Таблица admin_users отсутствует. Выполните supabase/migrations/007_admin_users.sql',
      )
      return
    }
    throw new Error(error.message)
  }
  console.info('[admins] Owner account leonid seeded')
}

export async function createAdmin(input: {
  login: string
  password: string
  displayName?: string
  isActive?: boolean
  permissions?: unknown
}) {
  const login = input.login.trim()
  if (login.length < 2) throw new Error('Укажите логин')
  if (!input.password || input.password.length < 8) {
    throw new Error('Пароль должен быть не короче 8 символов')
  }
  if (login.toLowerCase() === 'leonid') {
    throw new Error('Логин владельца зарезервирован')
  }

  const duplicate = await findAdminByLogin(login)
  if (duplicate) throw new Error('Администратор с таким логином уже есть')

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      login,
      password_hash: await hashPassword(input.password),
      display_name: (input.displayName || '').trim(),
      is_owner: false,
      is_active: input.isActive !== false,
      permissions: sanitizePermissions(input.permissions),
    })
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message || 'Не удалось создать администратора')
  return mapAdmin(data as Record<string, unknown>)
}

export async function updateAdmin(
  id: string,
  patch: {
    displayName?: string
    isActive?: boolean
    permissions?: unknown
    password?: string
  },
) {
  const current = await findAdminById(id)
  if (!current) throw new Error('Администратор не найден')
  if (current.is_owner) {
    throw new Error('Владельца нельзя изменять')
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (patch.displayName !== undefined) updates.display_name = patch.displayName.trim()
  if (patch.isActive !== undefined) updates.is_active = patch.isActive
  if (patch.permissions !== undefined) updates.permissions = sanitizePermissions(patch.permissions)
  if (patch.password) {
    if (patch.password.length < 8) throw new Error('Пароль должен быть не короче 8 символов')
    updates.password_hash = await hashPassword(patch.password)
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('admin_users')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message || 'Не удалось обновить администратора')
  return mapAdmin(data as Record<string, unknown>)
}

export async function deleteAdmin(id: string) {
  const current = await findAdminById(id)
  if (!current) throw new Error('Администратор не найден')
  if (current.is_owner) throw new Error('Владельца нельзя удалить')

  const supabase = getSupabase()
  const { error } = await supabase.from('admin_users').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return current
}
