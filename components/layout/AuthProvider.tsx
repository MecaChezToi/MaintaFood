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
    // Timeout de sécurité : si Supabase ne répond pas en 5s, on débloque quand même
    const timeout = setTimeout(() => {
      console.warn('[Auth] Timeout — Supabase ne répond pas. Vérifiez les variables d\'env.')
      setLoading(false)
    }, 5000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout)
      setSession(session)
      if (session?.user) {
        try {
          const cached = sessionStorage.getItem(`profile:${session.user.id}`)
          if (cached) {
            try { setUser(JSON.parse(cached)) } catch {}
          }
          const profile = await profilesApi.getById(session.user.id)
          if (profile) {
            sessionStorage.setItem(`profile:${session.user.id}`, JSON.stringify(profile))
            setUser(profile)
          } else {
            // Essayer de créer le profil manquant via l'API
            try {
              const res = await fetch('/api/profile/ensure', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
              })
              if (res.ok) {
                const ensured = await res.json()
                if (ensured?.id) {
                  sessionStorage.setItem(`profile:${session.user.id}`, JSON.stringify(ensured))
                  setUser(ensured)
                }
              }
            } catch (e) {
              console.error('[Auth] Impossible de créer le profil:', e)
            }
          }
        } catch (e) {
          console.error('[Auth] Erreur chargement profil:', e)
          setUser(null)
        }
      }
      setLoading(false)
    }).catch((e) => {
      clearTimeout(timeout)
      console.error('[Auth] Erreur getSession:', e)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session?.user) {
        try {
          const profile = await profilesApi.getById(session.user.id)
          if (profile) {
            sessionStorage.setItem(`profile:${session.user.id}`, JSON.stringify(profile))
            setUser(profile)
          } else {
            setUser(null)
          }
        } catch {
          setUser(null)
        }
      } else {
        setUser(null)
        sessionStorage.clear()
      }
    })

    return () => {
      clearTimeout(timeout)
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
