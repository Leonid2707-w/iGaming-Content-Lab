import { Outlet } from 'react-router-dom'
import { AdminHotkey } from '@/components/admin/AdminHotkey'
import { AdminLoginModal } from '@/components/admin/AdminLoginModal'
import { VisitTracker } from '@/components/analytics/VisitTracker'
import { CookieNotice } from '@/components/layout/CookieNotice'
import { SupportWidget } from '@/components/layout/SupportWidget'
import { OrderModal } from '@/components/order/OrderModal'

/** Корневой layout: публичные страницы + скрытый админ-вход + модал заказа */
export function RootLayout() {
  return (
    <>
      <VisitTracker />
      <AdminHotkey />
      <AdminLoginModal />
      <OrderModal />
      <SupportWidget />
      <CookieNotice />
      <Outlet />
    </>
  )
}
