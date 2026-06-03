'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, organizationsApi } from '@/lib/supabase'

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    orgName: '', adminName: '', email: '', password: '', confirmPassword: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    setError('')
    if (form.password !== form.confirmPassword) return setError('Les mots de passe ne correspondent pas.')
    if (form.password.length < 8) return setError('Mot de passe trop court (min 8 caractères).')
    if (!form.orgName.trim()) return setError('Nom de l\'organisation requis.')

    setLoading(true)
    try {
      // 1. Créer le compte admin
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: { data: { name: form.adminName } },
      })

      if (signUpError) throw new Error(signUpError.message)
      if (!authData.user) throw new Error('Création du compte échouée.')

      // 2. Créer l'organisation et lier l'admin
      const slug = slugify(form.orgName) + '-' + Date.now().toString(36)
      await organizationsApi.create(form.orgName.trim(), slug, authData.user.id)

      // 3. Connexion automatique
      await supabase.auth.signInWithPassword({ email: form.email, password: form.password })

      router.push('/dashboard')
    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: 'var(--t1)',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px',
    color: 'var(--t2)', marginBottom: 6, display: 'block', fontFamily: 'var(--font-mono)',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚙️</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#00c896' }}>FixOps</div>
          <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>Créer votre espace de travail</div>
        </div>

        {/* Étapes */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: s <= step ? '#00c896' : 'rgba(255,255,255,.08)',
              transition: 'background .3s',
            }} />
          ))}
        </div>

        <div style={{
          background: 'var(--s1)', border: '1px solid var(--b0)', borderRadius: 16, padding: 28,
        }}>
          {step === 1 ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                1. Votre organisation
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Nom de l'usine / entreprise *</label>
                  <input style={inputStyle} value={form.orgName} onChange={set('orgName')}
                    placeholder="ex: Usine Belin Nord" />
                </div>
              </div>
              <button
                onClick={() => { if (!form.orgName.trim()) return setError('Nom requis.'); setError(''); setStep(2) }}
                style={{
                  marginTop: 24, width: '100%', padding: '12px 0',
                  background: '#00c896', color: '#000', border: 'none', borderRadius: 8,
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}
              >
                Continuer →
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                2. Compte administrateur
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Votre nom *</label>
                  <input style={inputStyle} value={form.adminName} onChange={set('adminName')}
                    placeholder="Prénom Nom" />
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input style={inputStyle} type="email" value={form.email} onChange={set('email')}
                    placeholder="admin@usine.fr" />
                </div>
                <div>
                  <label style={labelStyle}>Mot de passe *</label>
                  <input style={inputStyle} type="password" value={form.password} onChange={set('password')}
                    placeholder="Min. 8 caractères" />
                </div>
                <div>
                  <label style={labelStyle}>Confirmer le mot de passe *</label>
                  <input style={inputStyle} type="password" value={form.confirmPassword} onChange={set('confirmPassword')}
                    placeholder="Répéter le mot de passe" />
                </div>
              </div>

              {error && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,71,87,.1)', border: '1px solid rgba(255,71,87,.2)', borderRadius: 8, fontSize: 13, color: '#ff4757' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1, padding: '12px 0', background: 'transparent',
                    border: '1px solid var(--b1)', borderRadius: 8, color: 'var(--t2)',
                    fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  ← Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    flex: 2, padding: '12px 0', background: loading ? 'rgba(0,200,150,.4)' : '#00c896',
                    color: '#000', border: 'none', borderRadius: 8,
                    fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Création en cours…' : 'Créer mon espace ✓'}
                </button>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--t2)' }}>
          Déjà un compte ?{' '}
          <a href="/auth" style={{ color: '#00c896', textDecoration: 'none' }}>Se connecter</a>
        </div>
      </div>
    </div>
  )
}
