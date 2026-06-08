'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase injecte le token dans le hash de l'URL
    // onAuthStateChange détecte PASSWORD_RECOVERY automatiquement
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    // Vérifier si déjà en session de recovery
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async () => {
    if (!password || !confirm) { setError('Remplissez tous les champs.'); return }
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères.'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    setSaving(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message || 'Impossible de mettre à jour le mot de passe.')
      setSaving(false)
    } else {
      setDone(true)
      setTimeout(() => router.replace('/dashboard'), 2500)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080909', padding: 20 }}>
      <div style={{ position: 'fixed', top: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,208,216,.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 400, background: '#0f1012', border: '1px solid rgba(0,208,216,.1)', borderRadius: 14, padding: 32, boxShadow: '0 0 60px rgba(0,208,216,.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <img src="/icons/icon-192.png" alt="MaintaFood" style={{ height: 52, width: 52, objectFit: 'contain', borderRadius: 14 }} />
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#00d0d8', marginBottom: 8 }}>Mot de passe mis à jour !</div>
            <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>Redirection vers le dashboard...</div>
          </div>
        ) : !ready ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Vérification du lien...</div>
            <div style={{ fontSize: 13, color: 'var(--t2)' }}>
              Si vous n'êtes pas redirigé, le lien a peut-être expiré.{' '}
              <a href="/auth" style={{ color: '#00d0d8', textDecoration: 'none' }}>Recommencer</a>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, textAlign: 'center' }}>Nouveau mot de passe</div>
            <div style={{ fontSize: 12.5, color: 'var(--t2)', marginBottom: 24, textAlign: 'center' }}>
              Choisissez un nouveau mot de passe pour votre compte.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.6px', fontFamily: 'var(--font-mono)' }}>
                  Nouveau mot de passe
                </label>
                <input
                  className="form-input" type="password" placeholder="minimum 6 caractères"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.6px', fontFamily: 'var(--font-mono)' }}>
                  Confirmer le mot de passe
                </label>
                <input
                  className="form-input" type="password" placeholder="••••••••"
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                />
              </div>

              {password && confirm && password === confirm && (
                <div style={{ fontSize: 11, color: '#00d0d8', display: 'flex', alignItems: 'center', gap: 5 }}>
                  ✓ Les mots de passe correspondent
                </div>
              )}

              {error && (
                <div style={{ padding: '8px 12px', background: 'rgba(255,71,87,.08)', border: '1px solid rgba(255,71,87,.25)', borderRadius: 6, fontSize: 12, color: '#ff4757' }}>
                  ⚠ {error}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleReset}
                disabled={saving || !password || !confirm}
                style={{ opacity: saving ? .7 : 1, marginTop: 4 }}
              >
                {saving ? 'Mise à jour...' : 'Enregistrer le mot de passe →'}
              </button>

              <a href="/auth" style={{ textAlign: 'center', fontSize: 12, color: 'var(--t2)', textDecoration: 'none', marginTop: 4 }}>
                ← Retour à la connexion
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
