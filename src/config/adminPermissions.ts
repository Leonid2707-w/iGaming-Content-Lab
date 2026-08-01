/** Granular admin permissions — keep in sync with server/src/config/adminPermissions.ts */

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

export interface AdminPermissionGroup {
  id: string
  title: string
  permissions: { key: AdminPermission; label: string }[]
}

export const ADMIN_PERMISSION_GROUPS: AdminPermissionGroup[] = [
  {
    id: 'services',
    title: 'Управление услугами',
    permissions: [
      { key: 'services.prices', label: 'Изменение цен' },
      { key: 'services.units', label: 'Изменение единиц измерения' },
      { key: 'services.list', label: 'Изменение списка услуг' },
    ],
  },
  {
    id: 'orders',
    title: 'Управление заказами',
    permissions: [
      { key: 'orders.view', label: 'Просмотр заказов' },
      { key: 'orders.status', label: 'Изменение статуса заказов' },
      { key: 'orders.delete', label: 'Удаление заказов' },
      { key: 'orders.clients', label: 'Просмотр информации о клиентах' },
    ],
  },
  {
    id: 'site',
    title: 'Управление сайтом',
    permissions: [
      { key: 'site.texts', label: 'Изменение текстов' },
      { key: 'site.examples', label: 'Изменение примеров работ' },
      { key: 'site.videos', label: 'Изменение видео' },
      { key: 'site.images', label: 'Изменение изображений' },
      { key: 'site.faq', label: 'Изменение FAQ' },
    ],
  },
  {
    id: 'users',
    title: 'Управление пользователями',
    permissions: [
      { key: 'users.view', label: 'Просмотр пользователей' },
      { key: 'users.block', label: 'Блокировка пользователей' },
      { key: 'users.delete', label: 'Удаление пользователей' },
    ],
  },
  {
    id: 'analytics',
    title: 'Аналитика',
    permissions: [
      { key: 'analytics.visits', label: 'Просмотр статистики сайта' },
      { key: 'analytics.orders', label: 'Просмотр количества заказов' },
      { key: 'analytics.registrations', label: 'Просмотр регистраций' },
      { key: 'analytics.finance', label: 'Просмотр финансовой статистики' },
    ],
  },
  {
    id: 'admins',
    title: 'Административная панель',
    permissions: [
      { key: 'admins.create', label: 'Создание администраторов' },
      { key: 'admins.delete', label: 'Удаление администраторов' },
      { key: 'admins.permissions', label: 'Изменение прав других администраторов' },
    ],
  },
]

export function isAdminPermission(value: string): value is AdminPermission {
  return (ADMIN_PERMISSIONS as readonly string[]).includes(value)
}

export function sanitizePermissions(list: unknown): AdminPermission[] {
  if (!Array.isArray(list)) return []
  return [...new Set(list.filter((item): item is AdminPermission => isAdminPermission(String(item))))]
}

export function hasAnyPermission(
  permissions: readonly string[] | null | undefined,
  keys: readonly AdminPermission[],
  isOwner = false,
) {
  if (isOwner) return true
  if (!permissions?.length) return false
  return keys.some((key) => permissions.includes(key))
}
