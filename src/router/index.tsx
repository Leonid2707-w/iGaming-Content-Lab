import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RootLayout } from '@/pages/RootLayout'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminServicesPage } from '@/pages/admin/AdminServicesPage'
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage'
import { AdminOrderDetailPage } from '@/pages/admin/AdminOrderDetailPage'
import { AdminPlaceholderPage } from '@/pages/admin/AdminPlaceholderPage'
import { AdminPortfolioPage } from '@/pages/admin/AdminPortfolioPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminStatsPage } from '@/pages/admin/AdminStatsPage'
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
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'stats', element: <AdminStatsPage /> },
          { path: 'services', element: <AdminServicesPage /> },
          { path: 'portfolio', element: <AdminPortfolioPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          {
            path: 'content',
            element: (
              <AdminPlaceholderPage
                title="Управление контентом"
                description="Тексты сайта, блоки и преимущества. Раздел заложен под будущее ТЗ."
              />
            ),
          },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'orders/:id', element: <AdminOrderDetailPage /> },
          {
            path: 'settings',
            element: (
              <AdminPlaceholderPage
                title="Настройки сайта"
                description="Тема, контакты и ссылки. Раздел заложен под будущее ТЗ."
              />
            ),
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
