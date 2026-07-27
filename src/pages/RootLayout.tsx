import { Outlet } from 'react-router-dom'
import { AdminHotkey } from '@/components/admin/AdminHotkey'
import { AdminLoginModal } from '@/components/admin/AdminLoginModal'
import { OrderModal } from '@/components/order/OrderModal'

/** Корневой layout: публичные страницы + скрытый админ-вход + модал заказа */
export function RootLayout() {
  return (
    <>
      <AdminHotkey />
      <AdminLoginModal />
      <OrderModal />
      <Outlet />
    </>
  )
}
