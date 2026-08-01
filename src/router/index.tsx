import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RootLayout } from '@/pages/RootLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage'
import { AuthCallbackPage } from '@/pages/auth/AuthCallbackPage'
import { TermsPage, PrivacyPage, PersonalDataPage } from '@/pages/legal/LegalPage'
import { CabinetLayout } from '@/pages/cabinet/CabinetLayout'
import { CabinetProfilePage } from '@/pages/cabinet/CabinetProfilePage'
import { CabinetOrdersPage } from '@/pages/cabinet/CabinetOrdersPage'

const AdminLayout = lazy(() =>
  import('@/pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
)
const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
)
const AdminServicesPage = lazy(() =>
  import('@/pages/admin/AdminServicesPage').then((m) => ({ default: m.AdminServicesPage })),
)
const AdminOrdersPage = lazy(() =>
  import('@/pages/admin/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })),
)
const AdminOrderDetailPage = lazy(() =>
  import('@/pages/admin/AdminOrderDetailPage').then((m) => ({ default: m.AdminOrderDetailPage })),
)
const AdminPortfolioPage = lazy(() =>
  import('@/pages/admin/AdminPortfolioPage').then((m) => ({ default: m.AdminPortfolioPage })),
)
const AdminUsersPage = lazy(() =>
  import('@/pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
)
const AdminStatsPage = lazy(() =>
  import('@/pages/admin/AdminStatsPage').then((m) => ({ default: m.AdminStatsPage })),
)
const AdminAdminsPage = lazy(() =>
  import('@/pages/admin/AdminAdminsPage').then((m) => ({ default: m.AdminAdminsPage })),
)

const adminFallback = (
  <div className="flex min-h-screen items-center justify-center bg-icl-bg text-sm text-icl-muted">
    Загрузка админки…
  </div>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'auth/reset-password', element: <ResetPasswordPage /> },
      { path: 'auth/callback', element: <AuthCallbackPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
      { path: 'legal/terms', element: <TermsPage /> },
      { path: 'legal/privacy', element: <PrivacyPage /> },
      { path: 'legal/personal-data', element: <PersonalDataPage /> },
      {
        path: 'cabinet',
        element: <CabinetLayout />,
        children: [
          { index: true, element: <CabinetProfilePage /> },
          { path: 'orders', element: <CabinetOrdersPage /> },
        ],
      },
      {
        path: 'admin',
        element: (
          <Suspense fallback={adminFallback}>
            <AdminLayout />
          </Suspense>
        ),
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'stats', element: <AdminStatsPage /> },
          { path: 'services', element: <AdminServicesPage /> },
          { path: 'portfolio', element: <AdminPortfolioPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'orders/:id', element: <AdminOrderDetailPage /> },
          { path: 'admins', element: <AdminAdminsPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
