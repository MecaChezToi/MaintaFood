'use client'

import { useEffect } from 'react'
import { syncManager } from '@/lib/syncManager'

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Démarrer la sync auto
    const stopSync = syncManager.startAutoSync()

    // Enregistrer le Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    return () => { stopSync?.() }
  }, [])

  return null
}
