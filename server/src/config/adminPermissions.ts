/** Granular admin permissions — keep in sync with src/config/adminPermissions.ts */

export const ADMIN_PERMISSIONS = [
  'services.prices',
  'services.units',
  'services.list',
  'orders.view',
  'orders.status',
  'orders.delete',
  'orders.clients',
  'site.texts',
  'site.examples',
  'site.videos',
  'site.images',
  'site.faq',
  'users.view',
  'users.block',
  'users.delete',
  'analytics.visits',
  'analytics.orders',
  'analytics.registrations',
  'analytics.finance',
  'admins.create',
  'admins.delete',
  'admins.permissions',
] as const

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number]

export function isAdminPermission(value: string): value is AdminPermission {
  return (ADMIN_PERMISSIONS as readonly string[]).includes(value)
}

export function sanitizePermissions(list: unknown): AdminPermission[] {
  if (!Array.isArray(list)) return []
  return [...new Set(list.filter((item): item is AdminPermission => isAdminPermission(String(item))))]
}

export function hasPermission(
  admin: { isOwner?: boolean; permissions?: readonly string[] | null },
  key: AdminPermission,
) {
  if (admin.isOwner) return true
  return Boolean(admin.permissions?.includes(key))
}

export function hasAnyPermission(
  admin: { isOwner?: boolean; permissions?: readonly string[] | null },
  keys: readonly AdminPermission[],
) {
  if (admin.isOwner) return true
  return keys.some((key) => hasPermission(admin, key))
}
