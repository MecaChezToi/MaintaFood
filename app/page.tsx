'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/layout/AuthProvider'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/dashboard' : '/auth')
    }
  }, [user, loading, router])

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#080909', color: '#00c896',
      fontFamily: 'var(--font-outfit)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>FixOps</div>
        <div style={{ fontSize: 13, color: '#7a8599', marginTop: 4 }}>Chargement...</div>
      </div>
    </div>
  )
}
