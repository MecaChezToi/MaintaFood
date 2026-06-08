'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/layout/AuthProvider'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const { signIn, user, loading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const [resetSent, setResetSent] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  const handleLogin = async () => {
    if (!email || !password) { setError('Remplissez tous les champs.'); return }
    setSigningIn(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) {
      setError('Email ou mot de passe incorrect.')
      setSigningIn(false)
    }
  }

  const handleReset = async () => {
    if (!email) { setError('Entrez votre adresse email.'); return }
    setResetting(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    if (error) {
      setError('Impossible d\'envoyer l\'email. Vérifiez l\'adresse.')
    } else {
      setResetSent(true)
    }
    setResetting(false)
  }

  if (!loading && user) return null

  return (
    <div className="auth" style={{ background: '#080909' }}>
      <div style={{ position: 'fixed', top: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,208,216,.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -150, right: 200, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,60,220,.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="auth-left">
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 560 }}>
          <div style={{ marginBottom: 28 }}>
            <img src="/logo.png" alt="MaintaFood" style={{ height: 52, objectFit: 'contain', objectPosition: 'left' }} />
            <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 8, fontFamily: 'var(--font-mono)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              GMAO · Industrie Alimentaire
            </div>
          </div>
          <p style={{ color: '#9ca3af', maxWidth: 520, fontSize: 15, lineHeight: 1.7, marginBottom: 26 }}>
            Réduisez les arrêts de ligne, simplifiez vos audits HACCP et centralisez votre maintenance sur une seule plateforme moderne.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Conformité IFS Food v8 · BRC · ISO 22000',
              'Rapports signés et horodatés',
              'KPIs de maintenance en temps réel',
              'Traçabilité complète pour les audits',
            ].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,208,216,.12)', background: 'rgba(0,208,216,.04)' }}>
                <span style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: 'rgba(0,208,216,.15)', color: '#00d0d8', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: '#cbd5e1' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box" style={{ border: '1px solid rgba(0,208,216,.1)', boxShadow: '0 0 60px rgba(0,208,216,.05)' }}>
          <div style={{ marginBottom: 22, display: 'flex', justifyContent: 'center' }}>
            <img src="/icons/icon-192.png" alt="MaintaFood" style={{ height: 52, width: 52, objectFit: 'contain', borderRadius: 14 }} />
          </div>

          {mode === 'login' ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, textAlign: 'center' }}>Connexion</div>
              <div style={{ fontSize: 12.5, color: 'var(--t2)', marginBottom: 22, textAlign: 'center' }}>
                Connectez-vous à votre espace MaintaFood.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label className="form-label">Email</label>
                  <input
                    className="form-input" type="email" placeholder="votre@email.fr"
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="form-label">Mot de passe</label>
                    <button
                      onClick={() => { setMode('reset'); setError(''); setResetSent(false) }}
                      style={{ background: 'none', border: 'none', color: '#00d0d8', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <input
                    className="form-input" type="password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  />
                </div>

                {error && <div className="auth-err">⚠ {error}</div>}

                <button className="btn btn-primary" onClick={handleLogin} disabled={signingIn} style={{ opacity: signingIn ? .7 : 1 }}>
                  {signingIn ? 'Connexion en cours...' : 'Se connecter →'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, textAlign: 'center' }}>Mot de passe oublié</div>
              <div style={{ fontSize: 12.5, color: 'var(--t2)', marginBottom: 22, textAlign: 'center' }}>
                Entrez votre email pour recevoir un lien de réinitialisation.
              </div>

              {resetSent ? (
                <div style={{ padding: '16px', background: 'rgba(0,208,216,.08)', border: '1px solid rgba(0,208,216,.2)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📬</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#00d0d8', marginBottom: 6 }}>Email envoyé !</div>
                  <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>
                    Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label className="form-label">Email</label>
                    <input
                      className="form-input" type="email" placeholder="votre@email.fr"
                      value={email} onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleReset()}
                    />
                  </div>

                  {error && <div className="auth-err">⚠ {error}</div>}

                  <button className="btn btn-primary" onClick={handleReset} disabled={resetting} style={{ opacity: resetting ? .7 : 1 }}>
                    {resetting ? 'Envoi...' : 'Envoyer le lien →'}
                  </button>
                </div>
              )}

              <button
                onClick={() => { setMode('login'); setError(''); setResetSent(false) }}
                style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: 'var(--t2)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: '6px 0' }}>
                ← Retour à la connexion
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
