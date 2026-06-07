'use client'
import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        setInterval(() => reg.update(), 60 * 1000)
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage('SKIP_WAITING')
            }
          })
        })
      })
      .catch(err => console.warn('[SW] Erreur:', err))

    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        console.log('[SW] Nouveau SW actif')
      }
    })
  }, [])
  return null
}
