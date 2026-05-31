'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/layout/AuthProvider'

export default function AuthPage() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { setError('Remplissez tous les champs.'); return }
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
    } else {
      router.replace('/dashboard')
    }
  }

  return (
    <div className="auth">
      <div className="auth-left">
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 560 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(0,200,150,.14)', border: '1px solid rgba(0,200,150,.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            }}>⚙️</div>
            <div>
              <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--acc)', letterSpacing: '-.5px' }}>FixOps</div>
              <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2 }}>GMAO · Industrie Alimentaire</div>
            </div>
          </div>
          <p style={{ color: '#9ca3af', maxWidth: 520, fontSize: 15, lineHeight: 1.7, marginBottom: 26 }}>
            Réduisez les arrêts de ligne, simplifiez vos audits HACCP et centralisez votre maintenance sur une seule plateforme moderne.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Conformité IFS Food v8 · BRC · ISO 22000', 'Rapports signés et horodatés', 'KPIs de maintenance en temps réel', 'Traçabilité complète pour les audits'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)' }}>
                <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: 'rgba(0,200,150,.12)', color: 'var(--acc)', fontWeight: 800 }}>✓</span>
                <span style={{ fontSize: 13, color: '#cbd5e1' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Connexion</div>
          <div style={{ fontSize: 12.5, color: 'var(--t2)', marginBottom: 22 }}>
            Connectez-vous avec votre compte Supabase.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="votre@email.fr"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label className="form-label">Mot de passe</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {error && <div className="auth-err">⚠ {error}</div>}

            <button className="btn btn-primary" onClick={handleLogin} disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter →'}
            </button>
          </div>

          <div className="auth-demo">
            <div className="auth-demo-title">Info</div>
            <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.6 }}>
              Si la connexion est lente sur téléphone, essayez une fois puis laissez la page terminer le chargement.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
