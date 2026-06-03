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

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      // 1. Charger le profil depuis le cache instantanément
      try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
        if (keys.length > 0) {
          const raw = localStorage.getItem(keys[0])
          if (raw) {
            const parsed = JSON.parse(raw)
            const cachedSession = parsed?.access_token ? parsed : parsed?.session
            if (cachedSession?.user?.id) {
              const profileKey = `profile:${cachedSession.user.id}`
              const cachedProfile = sessionStorage.getItem(profileKey)
              if (cachedProfile) {
                const profile = JSON.parse(cachedProfile)
                if (!cancelled) {
                  setUser(profile)
                  setSession(cachedSession)
                  setLoading(false) // Débloquer immédiatement avec le cache
                }
              }
            }
          }
        }
      } catch (e) {
        // Cache indisponible — pas grave
      }

      // 2. Vérifier la vraie session Supabase en arrière-plan
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (cancelled) return

        setSession(session)

        if (session?.user) {
          const profileKey = `profile:${session.user.id}`
          const profile = await profilesApi.getById(session.user.id)
          if (cancelled) return
          if (profile) {
            sessionStorage.setItem(profileKey, JSON.stringify(profile))
            setUser(profile)
          } else {
            // Profil manquant — essayer de le créer
            try {
              const res = await fetch('/api/profile/ensure', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
              })
              if (res.ok) {
                const ensured = await res.json()
                if (ensured?.id && !cancelled) {
                  sessionStorage.setItem(profileKey, JSON.stringify(ensured))
                  setUser(ensured)
                }
              }
            } catch {}
          }
        } else {
          if (!cancelled) setUser(null)
        }
      } catch (e) {
        console.warn('[Auth] getSession échoué:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()

    // Écouter les changements auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return
      setSession(session)
      if (session?.user) {
        try {
          const profile = await profilesApi.getById(session.user.id)
          if (!cancelled && profile) {
            sessionStorage.setItem(`profile:${session.user.id}`, JSON.stringify(profile))
            setUser(profile)
          }
        } catch {
          if (!cancelled) setUser(null)
        }
      } else {
        if (!cancelled) {
          setUser(null)
          sessionStorage.clear()
        }
      }
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
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
