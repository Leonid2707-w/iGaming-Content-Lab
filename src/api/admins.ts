import type { AdminPermission } from '@/config/adminPermissions'
import { AdminAuthError } from '@/api/orders'

export interface AdminDto {
  id: string
  login: string
  displayName: string
  isOwner: boolean
  isActive: boolean
  permissions: AdminPermission[]
  createdAt: string
  updatedAt: string
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function parseAdminJson<T>(response: Response): Promise<T> {
  if (response.status === 401) throw new AdminAuthError()
  const data = (await response.json()) as T & { ok?: boolean; error?: string }
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `HTTP ${response.status}`)
  }
  return data
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export async function fetchAdmins(token: string) {
  const response = await fetch(`${API_BASE}/admin/admins`, { headers: authHeaders(token) })
  return parseAdminJson<{ ok: boolean; admins: AdminDto[] }>(response)
}

export async function createAdminRequest(
  token: string,
  body: {
    login: string
    password: string
    displayName?: string
    isActive?: boolean
    permissions: AdminPermission[]
  },
) {
  const response = await fetch(`${API_BASE}/admin/admins`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return parseAdminJson<{ ok: boolean; admin: AdminDto }>(response)
}

export async function updateAdminRequest(
  token: string,
  id: string,
  body: {
    displayName?: string
    isActive?: boolean
    permissions?: AdminPermission[]
    password?: string
  },
) {
  const response = await fetch(`${API_BASE}/admin/admins/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return parseAdminJson<{ ok: boolean; admin: AdminDto }>(response)
}

export async function deleteAdminRequest(token: string, id: string) {
  const response = await fetch(`${API_BASE}/admin/admins/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  return parseAdminJson<{ ok: boolean }>(response)
}
