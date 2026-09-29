'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const PREFETCH_ROUTES = [
  '/dashboard',
  '/courses',
  '/profile',
  '/settings',
  '/help',
]

export default function StudentRoutePrefetcher() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const prefetch = () => {
      if (cancelled) return
      PREFETCH_ROUTES.forEach(route => router.prefetch(route))
    }

    let cancelPrefetch: () => void
    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(prefetch, { timeout: 1200 })
      cancelPrefetch = () => window.cancelIdleCallback(idleId)
    } else {
      const timeoutId = globalThis.setTimeout(prefetch, 350)
      cancelPrefetch = () => globalThis.clearTimeout(timeoutId)
    }

    return () => {
      cancelled = true
      cancelPrefetch()
    }
  }, [router])

  return null
}
