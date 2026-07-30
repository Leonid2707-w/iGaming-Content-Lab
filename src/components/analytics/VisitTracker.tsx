import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageVisit } from '@/api/stats'

const VISITOR_KEY = 'icl-visitor-id'

function getVisitorId() {
  try {
    const existing = localStorage.getItem(VISITOR_KEY)
    if (existing && existing.length >= 8) return existing
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(VISITOR_KEY, id)
    return id
  } catch {
    return `anon-${Date.now().toString(36)}`
  }
}

function shouldTrack(pathname: string) {
  if (!pathname) return false
  if (pathname.startsWith('/admin')) return false
  if (pathname.startsWith('/api')) return false
  return true
}

/** Sends anonymous pageview beacons for public routes. */
export function VisitTracker() {
  const location = useLocation()
  const lastSent = useRef('')

  useEffect(() => {
    if (!shouldTrack(location.pathname)) return
    const key = `${location.pathname}${location.search}`
    if (lastSent.current === key) return
    lastSent.current = key

    void trackPageVisit({
      visitorId: getVisitorId(),
      path: location.pathname || '/',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    })
  }, [location.pathname, location.search])

  return null
}
