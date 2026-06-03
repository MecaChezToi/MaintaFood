'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, profilesApi, organizationsApi } from '@/lib/supabase'
import type { Profile, Organization } from '@/types'

interface AuthContextType {
  user: Profile | null
  organization: Organization | null
  session: any
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null, organization: null, session: null, loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (userId: string, accessToken: string) => {
    // Cache immédiat
    try {
      const cached = sessionStorage.getItem(`profile:${userId}`)
      if (cached) setUser(JSON.parse(cached))
      const cachedOrg = sessionStorage.getItem(`org:${userId}`)
      if (cachedOrg) setOrganization(JSON.parse(cachedOrg))
    } catch {}

    // Charger depuis Supabase
    try {
      const profile = await profilesApi.getById(userId)
      if (profile) {
        sessionStorage.setItem(`profile:${userId}`, JSON.stringify(profile))
        setUser(profile)

        // Charger l'organisation
        const org = await organizationsApi.getCurrent()
        if (org) {
          sessionStorage.setItem(`org:${userId}`, JSON.stringify(org))
          setOrganization(org)
        }
        return
      }

      // Profil manquant — créer via API
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
    // onAuthStateChange EN PREMIER — capture login/logout/refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user) {
        await loadProfile(session.user.id, session.access_token)
      } else {
        setUser(null)
        setOrganization(null)
        sessionStorage.clear()
      }
      setLoading(false)
    })

    // Vérifier session existante
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSession(session)
        await loadProfile(session.user.id, session.access_token)
      }
      setLoading(false)
    }).catch(() => setLoading(false))

    // Timeout sécurité
    const t = setTimeout(() => setLoading(false), 4000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(t)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message || null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setOrganization(null)
    setSession(null)
    sessionStorage.clear()
  }

  return (
    <AuthContext.Provider value={{ user, organization, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
