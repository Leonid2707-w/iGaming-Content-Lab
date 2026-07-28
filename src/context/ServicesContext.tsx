/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
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

const STORAGE_KEY = 'icl-services-v2'

interface ServicesContextValue {
  services: StandardService[]
  enabledServices: StandardService[]
  getService: (id: string) => StandardService | undefined
  updateService: (id: string, patch: Partial<StandardService>) => void
  setServiceUnit: (id: string, unitId: PriceUnitId) => void
  toggleService: (id: string) => void
  resetServices: () => void
}

const ServicesContext = createContext<ServicesContextValue | null>(null)

function loadServices(): StandardService[] {
  const defaults = createServiceDefaults()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as StandardService[]
    if (!Array.isArray(parsed)) return defaults

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

      // Keep quantity bounds in sync with product defaults for slider-based services.
      if (fallback.id === 'telegram-post' || fallback.id === 'youtube-video') {
        merged.minimum = fallback.minimum
        merged.maximum = fallback.maximum
        merged.step = fallback.step
      }

      return merged
    })
  } catch {
    return defaults
  }
}

function persist(services: StandardService[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(services))
}

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<StandardService[]>(() => loadServices())

  const updateService = useCallback((id: string, patch: Partial<StandardService>) => {
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
      persist(next)
      return next
    })
  }, [])

  const setServiceUnit = useCallback((id: string, unitId: PriceUnitId) => {
    setServices((current) => {
      const next = current.map((service) =>
        service.id === id ? applyUnitToService(service, unitId) : service,
      )
      persist(next)
      return next
    })
  }, [])

  const toggleService = useCallback((id: string) => {
    setServices((current) => {
      const next = current.map((service) =>
        service.id === id ? { ...service, enabled: !service.enabled } : service,
      )
      persist(next)
      return next
    })
  }, [])

  const resetServices = useCallback(() => {
    const defaults = createServiceDefaults()
    persist(defaults)
    setServices(defaults)
  }, [])

  const value = useMemo<ServicesContextValue>(
    () => ({
      services,
      enabledServices: services.filter((service) => service.enabled),
      getService: (id: string) => services.find((service) => service.id === id),
      updateService,
      setServiceUnit,
      toggleService,
      resetServices,
    }),
    [resetServices, services, setServiceUnit, toggleService, updateService],
  )

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>
}

export function useServices() {
  const context = useContext(ServicesContext)
  if (!context) throw new Error('useServices must be used within ServicesProvider')
  return context
}
