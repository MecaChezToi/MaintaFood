'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/components/layout/AuthProvider'
import { profilesApi, interventionsApi } from '@/lib/supabase'
import type { Profile, Intervention } from '@/types'
import { ROLE_CONFIG } from '@/types'

const fmt = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

export default function UsersPage() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([profilesApi.getAll(), interventionsApi.getAll()])
      .then(([p, i]) => { setProfiles(p); setInterventions(i); setLoading(false) })
  }, [])

  if (!user) return null

  return (
    <AppLayout>
      <div className="page-title">Utilisateurs</div>
      <div className="page-sub">{profiles.length} comptes · {profiles.filter(p => p.active).length} actifs</div>

      <div className="grid-2">
        {profiles.map(p => {
          const rc = ROLE_CONFIG[p.role]
          const myOT = interventions.filter(i => i.technician_id === p.id)
          const inProgress = myOT.filter(i => i.status === 'en_cours').length
          const todo = myOT.filter(i => i.status === 'a_faire').length

          return (
            <div key={p.id} className="card">
              <div style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)',
                  flexShrink: 0, background: p.color + '22', color: p.color,
                  border: `1px solid ${p.color}44`,
                }}>
                  {p.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                    {p.name}
                    {user?.id === p.id && <span style={{ fontSize: 10, color: '#00c896', fontFamily: 'var(--font-mono)', marginLeft: 8 }}>● vous</span>}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--t2)', marginBottom: 8 }}>{p.id.slice(0,8).toUpperCase()}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: rc.color + '18', color: rc.color, padding: '2px 7px', borderRadius: 4 }}>{rc.label}</span>
                    {p.role === 'technician' && <>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,.06)', color: 'var(--t2)', padding: '2px 7px', borderRadius: 4 }}>{myOT.length} OT total</span>
                      {todo > 0 && <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(255,165,2,.1)', color: '#ffa502', padding: '2px 7px', borderRadius: 4 }}>{todo} à faire</span>}
                      {inProgress > 0 && <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(60,130,232,.1)', color: '#3c82e8', padding: '2px 7px', borderRadius: 4 }}>{inProgress} en cours</span>}
                    </>}
                  </div>
                </div>
              </div>
              <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,.04)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--t3)', marginBottom: 4 }}>Rôle</div>
                  <div style={{ fontSize: 12 }}>{rc.label}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--t3)', marginBottom: 4 }}>Créé le</div>
                  <div style={{ fontSize: 12 }}>{fmt(p.created_at)}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!loading && profiles.length === 0 && (
        <div className="empty-state"><span style={{ fontSize: 32 }}>👤</span><span>Aucun utilisateur trouvé</span></div>
      )}
    </AppLayout>
  )
}
