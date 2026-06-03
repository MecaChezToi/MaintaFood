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

  const loadProfile = async (userId: string, accessToken: string) => {
    // Cache d'abord
    try {
      const cached = sessionStorage.getItem(`profile:${userId}`)
      if (cached) setUser(JSON.parse(cached))
    } catch {}

    // Puis Supabase
    try {
      const profile = await profilesApi.getById(userId)
      if (profile) {
        sessionStorage.setItem(`profile:${userId}`, JSON.stringify(profile))
        setUser(profile)
        return
      }
      // Profil manquant — créer
      const res = await fetch('/api/profile/ensure', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const ensured = await res.json()
        if (ensured?.id) {
          sessionStorage.setItem(`profile:${userId}`, JSON.stringify(ensured))
          setUser(ensured)
        }
      }
    } catch (e) {
      console.warn('[Auth] Erreur chargement profil:', e)
    }
  }

  useEffect(() => {
    // Écouter les changements auth EN PREMIER (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user) {
        await loadProfile(session.user.id, session.access_token)
      } else {
        setUser(null)
        sessionStorage.clear()
      }
      setLoading(false)
    })

    // Puis vérifier la session existante
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSession(session)
        await loadProfile(session.user.id, session.access_token)
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    // Timeout de sécurité 4s
    const t = setTimeout(() => setLoading(false), 4000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(t)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    // signIn déclenche onAuthStateChange automatiquement
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message || null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    sessionStorage.clear()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
