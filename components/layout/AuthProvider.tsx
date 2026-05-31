'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, profilesApi } from '@/lib/supabase'
import type { Profile } from '@/types'

interface AuthContextType {
  user: Profile | null
  session: any
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadProfileFast = async (userId: string, accessToken?: string | null) => {
    const cached = sessionStorage.getItem(`profile:${userId}`)
    if (cached) {
      try { setUser(JSON.parse(cached)) } catch {}
    }
    const profile = await profilesApi.getById(userId)
    if (profile) {
      sessionStorage.setItem(`profile:${userId}`, JSON.stringify(profile))
      setUser(profile)
    } else {
      if (accessToken) {
        try {
          const res = await fetch('/api/profile/ensure', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          })
          if (res.ok) {
            const ensured = await res.json()
            if (ensured?.id) {
              sessionStorage.setItem(`profile:${userId}`, JSON.stringify(ensured))
              setUser(ensured)
              return
            }
          }
        } catch {}
      }
      setUser(null)
    }
  }

  useEffect(() => {
    // Charger la session existante
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        await loadProfileFast(session.user.id, session.access_token)
      }
      setLoading(false)
    })

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session?.user) {
        await loadProfileFast(session.user.id, session.access_token)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
