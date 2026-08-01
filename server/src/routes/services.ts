import { Hono } from 'hono'
import { getSupabase } from '../db/supabase.js'
import { requireAdmin, requirePermission } from '../middleware/adminAuth.js'

export type ServicePayload = Record<string, unknown> & { id: string }

const STORAGE_KEY = 'catalog'

async function readCatalog(): Promise<ServicePayload[] | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('site_services')
      .select('payload')
      .eq('id', STORAGE_KEY)
      .maybeSingle()
    if (error) {
      if (/relation .*site_services.* does not exist|schema cache/i.test(error.message)) {
        return null
      }
      throw new Error(error.message)
    }
    const payload = data?.payload
    if (Array.isArray(payload)) return payload as ServicePayload[]
    if (payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown }).items)) {
      return (payload as { items: ServicePayload[] }).items
    }
    return null
  } catch {
    return null
  }
}

export async function getServiceById(id: string): Promise<ServicePayload | null> {
  const catalog = await readCatalog()
  if (!catalog) return null
  return catalog.find((item) => item.id === id) || null
}

export const servicesPublicRoutes = new Hono()

servicesPublicRoutes.get('/', async (c) => {
  const catalog = await readCatalog()
  return c.json({ ok: true, services: catalog || [], source: catalog ? 'db' : 'empty' })
})

export const servicesAdminRoutes = new Hono()

servicesAdminRoutes.use('/*', requireAdmin)

servicesAdminRoutes.get(
  '/',
  requirePermission('services.prices', 'services.units', 'services.list'),
  async (c) => {
    const catalog = await readCatalog()
    return c.json({ ok: true, services: catalog || [] })
  },
)

servicesAdminRoutes.put(
  '/',
  requirePermission('services.prices', 'services.units', 'services.list'),
  async (c) => {
  try {
    const body = await c.req.json<{ services?: ServicePayload[] }>()
    const services = Array.isArray(body.services) ? body.services : null
    if (!services) return c.json({ ok: false, error: 'Ожидается массив services' }, 400)

    const supabase = getSupabase()
    const { error } = await supabase.from('site_services').upsert(
      {
        id: STORAGE_KEY,
        payload: { items: services },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )

    if (error) {
      if (/relation .*site_services.* does not exist|schema cache/i.test(error.message)) {
        return c.json(
          {
            ok: false,
            error:
              'Таблица site_services не создана. Выполните supabase/migrations/005_site_services_partners.sql',
          },
          503,
        )
      }
      throw new Error(error.message)
    }

    return c.json({ ok: true, count: services.length })
  } catch (error) {
    return c.json(
      { ok: false, error: error instanceof Error ? error.message : 'Не удалось сохранить услуги' },
      500,
    )
  }
  },
)
