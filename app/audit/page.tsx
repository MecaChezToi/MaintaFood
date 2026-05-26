'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { auditApi } from '@/lib/supabase'
import type { AuditLog } from '@/types'

const fmtDT = (d: string) => d ? new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    auditApi.getAll().then(data => { setLogs(data); setLoading(false) })
  }, [])

  const filtered = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.target || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.user as any)?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const actionColor = (action: string) => {
    if (action.includes('Rapport') || action.includes('signé')) return '#00c896'
    if (action.includes('stock') || action.includes('Stock')) return '#ffa502'
    if (action.includes('créée') || action.includes('Création')) return '#3c82e8'
    if (action.includes('Connexion')) return '#a855f7'
    return '#7a8599'
  }

  return (
    <AppLayout>
      <div className="page-title">Journal d'audit</div>
      <div className="page-sub">Traçabilité complète — conforme IFS Food v8 · BRC · ISO 22000</div>

      <div style={{ padding: '10px 14px', background: 'rgba(0,200,150,.06)', border: '1px solid rgba(0,200,150,.2)', borderRadius: 8, fontSize: 12.5, color: '#00c896', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        🛡️ Ce journal est horodaté et non modifiable — disponible pour inspection par les auditeurs qualité.
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <input className="form-input" placeholder="Rechercher une action, un utilisateur, une cible..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t2)' }}>🔍</span>
      </div>

      <div className="card">
        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--t2)' }}>Chargement…</div>}
        {filtered.map((l, i) => {
          const u = l.user as any
          const c = actionColor(l.action)
          return (
            <div key={l.id} style={{ display: 'flex', gap: 12, padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,.04)', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--t2)', whiteSpace: 'nowrap', paddingTop: 2, minWidth: 120 }}>
                {fmtDT(l.created_at)}
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0, marginTop: 4, boxShadow: `0 0 4px ${c}` }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 13, color: c }}>{l.action}</div>
                <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2 }}>
                  {l.target && <span>{l.target}</span>}
                  {l.detail && <span style={{ marginLeft: 8, color: 'var(--t3)' }}>· {l.detail}</span>}
                </div>
              </div>
              {u && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: (u.color || '#888') + '22', color: u.color || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {u.avatar || '?'}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--t2)' }}>{u.name?.split(' ')[0]}</span>
                </div>
              )}
            </div>
          )
        })}
        {!loading && filtered.length === 0 && (
          <div className="empty-state"><span style={{ fontSize: 28 }}>📋</span><span>Aucun événement</span></div>
        )}
      </div>
    </AppLayout>
  )
}
