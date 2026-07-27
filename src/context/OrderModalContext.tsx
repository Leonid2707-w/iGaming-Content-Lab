/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface OpenOrderOptions {
  serviceId?: string
  description?: string
}

interface OrderModalContextValue {
  isOpen: boolean
  initialServiceId?: string
  initialDescription?: string
  openOrder: (options?: OpenOrderOptions) => void
  closeOrder: () => void
}

const OrderModalContext = createContext<OrderModalContextValue | null>(null)

export function OrderModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialServiceId, setInitialServiceId] = useState<string>()
  const [initialDescription, setInitialDescription] = useState<string>()
  const openOrder = useCallback((options?: OpenOrderOptions) => {
    setInitialServiceId(options?.serviceId)
    setInitialDescription(options?.description)
    setIsOpen(true)
  }, [])
  const closeOrder = useCallback(() => setIsOpen(false), [])

  const value = useMemo<OrderModalContextValue>(
    () => ({
      isOpen,
      initialServiceId,
      initialDescription,
      openOrder,
      closeOrder,
    }),
    [closeOrder, initialDescription, initialServiceId, isOpen, openOrder],
  )

  return <OrderModalContext.Provider value={value}>{children}</OrderModalContext.Provider>
}

export function useOrderModal() {
  const context = useContext(OrderModalContext)
  if (!context) throw new Error('useOrderModal must be used within OrderModalProvider')
  return context
}
