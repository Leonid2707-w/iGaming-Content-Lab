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
import {
  applyUnitToService,
  createServiceDefaults,
  type StandardService,
} from '@/config/content/services'
import type { PriceUnitId } from '@/config/priceUnits'
import { useAdminAuth } from '@/context/AdminAuthContext'

const STORAGE_KEY = 'icl-services-v2'

interface ServicesContextValue {
  services: StandardService[]
  enabledServices: StandardService[]
  getService: (id: string) => StandardService | undefined
  updateService: (id: string, patch: Partial<StandardService>) => void
  setServiceUnit: (id: string, unitId: PriceUnitId) => void
  toggleService: (id: string) => void
  resetServices: () => void
  syncing: boolean
  syncError: string
}

const ServicesContext = createContext<ServicesContextValue | null>(null)

function mergeWithDefaults(parsed: StandardService[]): StandardService[] {
  const defaults = createServiceDefaults()
  return defaults.map((fallback) => {
    const saved = parsed.find((item) => item.id === fallback.id)
    if (!saved) return fallback
    const merged: StandardService = {
      ...fallback,
      ...saved,
      features: Array.isArray(saved.features) ? saved.features : fallback.features,
      id: fallback.id,
      category: fallback.category,
      icon: saved.icon || fallback.icon,
    }
    if (fallback.id === 'telegram-post' || fallback.id === 'youtube-video') {
      merged.minimum = fallback.minimum
      merged.maximum = fallback.maximum
      merged.step = fallback.step
    }
    return merged
  })
}

function loadLocal(): StandardService[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createServiceDefaults()
    const parsed = JSON.parse(raw) as StandardService[]
    if (!Array.isArray(parsed)) return createServiceDefaults()
    return mergeWithDefaults(parsed)
  } catch {
    return createServiceDefaults()
  }
}

function persistLocal(services: StandardService[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(services))
}

async function fetchRemoteCatalog(): Promise<StandardService[] | null> {
  try {
    const response = await fetch('/api/services')
    if (!response.ok) return null
    const data = (await response.json()) as { services?: StandardService[] }
    if (!Array.isArray(data.services) || !data.services.length) return null
    return mergeWithDefaults(data.services)
  } catch {
    return null
  }
}

async function saveRemoteCatalog(token: string, services: StandardService[]) {
  const response = await fetch('/api/admin/services', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ services }),
  })
  const data = (await response.json()) as { ok?: boolean; error?: string }
  if (!response.ok || !data.ok) {
    throw new Error(data.error || `HTTP ${response.status}`)
  }
}

export function ServicesProvider({ children }: { children: ReactNode }) {
  const { apiToken, isAuthenticated } = useAdminAuth()
  const [services, setServices] = useState<StandardService[]>(() => loadLocal())
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const remote = await fetchRemoteCatalog()
      if (!cancelled && remote) {
        setServices(remote)
        persistLocal(remote)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const commit = useCallback(
    (next: StandardService[]) => {
      persistLocal(next)
      setServices(next)
      if (isAuthenticated && apiToken) {
        setSyncing(true)
        setSyncError('')
        void saveRemoteCatalog(apiToken, next)
          .catch((err) => {
            setSyncError(err instanceof Error ? err.message : 'Не удалось сохранить в облако')
          })
          .finally(() => setSyncing(false))
      }
    },
    [apiToken, isAuthenticated],
  )

  const updateService = useCallback(
    (id: string, patch: Partial<StandardService>) => {
      setServices((current) => {
        const next = current.map((service) => {
          if (service.id !== id) return service
          let merged: StandardService = { ...service, ...patch, id: service.id }

          if (patch.unitId && patch.unitId !== service.unitId) {
            merged = applyUnitToService(merged, patch.unitId)
          }

          if (patch.priceMode === 'text') {
            merged.price = undefined
            merged.priceText = (patch.priceText ?? merged.priceText ?? 'Индивидуально').trim()
            merged.unitId = 'custom'
            merged = applyUnitToService(merged, 'custom')
          }

          if (patch.priceMode === 'numeric' && merged.unitId === 'custom') {
            merged.unitId = 'per_piece'
            merged = applyUnitToService(merged, 'per_piece')
          }

          return merged
        })
        queueMicrotask(() => commit(next))
        return next
      })
    },
    [commit],
  )

  const setServiceUnit = useCallback(
    (id: string, unitId: PriceUnitId) => {
      setServices((current) => {
        const next = current.map((service) =>
          service.id === id ? applyUnitToService(service, unitId) : service,
        )
        queueMicrotask(() => commit(next))
        return next
      })
    },
    [commit],
  )

  const toggleService = useCallback(
    (id: string) => {
      setServices((current) => {
        const next = current.map((service) =>
          service.id === id ? { ...service, enabled: !service.enabled } : service,
        )
        queueMicrotask(() => commit(next))
        return next
      })
    },
    [commit],
  )

  const resetServices = useCallback(() => {
    const defaults = createServiceDefaults()
    commit(defaults)
  }, [commit])

  const value = useMemo<ServicesContextValue>(
    () => ({
      services,
      enabledServices: services.filter((service) => service.enabled),
      getService: (id: string) => services.find((service) => service.id === id),
      updateService,
      setServiceUnit,
      toggleService,
      resetServices,
      syncing,
      syncError,
    }),
    [resetServices, services, setServiceUnit, syncError, syncing, toggleService, updateService],
  )

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>
}

export function useServices() {
  const context = useContext(ServicesContext)
  if (!context) throw new Error('useServices must be used within ServicesProvider')
  return context
}
