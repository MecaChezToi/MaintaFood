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
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#080909', padding: 16,
      fontFamily: 'var(--font-outfit)',
    }}>
      {/* Fond radial */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(0,200,150,.06) 0%, transparent 60%)',
      }}/>

      <div style={{
        background: '#0f1012', border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 14, padding: 32, width: '100%', maxWidth: 400,
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 38, height: 38, background: 'rgba(0,200,150,.12)',
            border: '1px solid rgba(0,200,150,.2)', borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>⚙️</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#00c896', letterSpacing: '-.3px' }}>FixOps</div>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: '#7a8599', marginBottom: 28 }}>
          GMAO · Industrie Alimentaire · Plateforme sécurisée
        </div>

        {/* Formulaire */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#7a8599', textTransform: 'uppercase', letterSpacing: '.6px', fontFamily: 'var(--font-mono)' }}>
              Email
            </label>
            <input
              type="email"
              placeholder="votre@email.fr"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{
                background: '#1e2023', border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 6, color: '#e4e8f0', fontFamily: 'var(--font-outfit)',
                fontSize: 13, padding: '10px 12px', outline: 'none', width: '100%',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#7a8599', textTransform: 'uppercase', letterSpacing: '.6px', fontFamily: 'var(--font-mono)' }}>
              Mot de passe
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{
                background: '#1e2023', border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 6, color: '#e4e8f0', fontFamily: 'var(--font-outfit)',
                fontSize: 13, padding: '10px 12px', outline: 'none', width: '100%',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,71,87,.08)', border: '1px solid rgba(255,71,87,.25)',
              borderRadius: 6, padding: '9px 12px', fontSize: 12.5, color: '#ff4757',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              background: loading ? '#7a8599' : '#00c896', color: '#000',
              border: 'none', borderRadius: 6, padding: '11px 20px',
              fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'var(--font-outfit)', width: '100%', marginTop: 4,
              transition: 'all .15s',
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter →'}
          </button>
        </div>

        {/* Info sécurité */}
        <div style={{
          marginTop: 24, padding: '10px 12px', background: 'rgba(0,200,150,.04)',
          border: '1px solid rgba(0,200,150,.12)', borderRadius: 6,
          fontSize: 11, color: '#7a8599', lineHeight: 1.6,
        }}>
          🔒 Connexion sécurisée. Vos données sont chiffrées et hébergées en Europe.
        </div>
      </div>
    </div>
  )
}
