import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '@/context/AdminAuthContext'

/** Скрытый хоткей Ctrl+Shift+H — вход в админку. Без публичных ссылок. */
export function AdminHotkey() {
  const { isAuthenticated, openLoginModal } = useAdminAuth()
  const navigate = useNavigate()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey && event.shiftKey && event.code === 'KeyH')) return
      event.preventDefault()

      if (isAuthenticated) {
        navigate('/admin')
        return
      }
      openLoginModal()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isAuthenticated, navigate, openLoginModal])

  return null
}
