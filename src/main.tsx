import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { OrderModalProvider } from './context/OrderModalContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { AuthProvider } from './context/AuthContext'
import { ServicesProvider } from './context/ServicesContext'
import { VideoExamplesProvider } from './context/VideoExamplesContext'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AdminAuthProvider>
        <AuthProvider>
          <ServicesProvider>
            <VideoExamplesProvider>
              <OrderModalProvider>
                <App />
              </OrderModalProvider>
            </VideoExamplesProvider>
          </ServicesProvider>
        </AuthProvider>
      </AdminAuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
