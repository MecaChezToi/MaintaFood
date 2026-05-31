'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/layout/AuthProvider'
import AppLayout from '@/components/layout/AppLayout'
import { equipmentsApi, interventionsApi, partsApi, siteConfigApi } from '@/lib/supabase'
import type { Equipment, Intervention, Part, SiteConfig } from '@/types'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/types'

const fmt = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'
const fmtDT = (d: string) => d ? new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'
const monthKey = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [stock, setStock] = useState<Part[]>([])
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      equipmentsApi.getAll(),
      interventionsApi.getAll(),
      partsApi.getAll(),
      siteConfigApi.get(),
    ]).then(([eq, int, st, cfg]) => {
      setEquipments(eq)
      setInterventions(int)
      setStock(st)
      setSiteConfig(cfg)
      setLoading(false)
    })
  }, [])

  if (!user) return null

  const isTech = user.role === 'technician'
  const myOT = isTech ? interventions.filter(i => i.technician_id === user.id) : interventions
  const lowStock = stock.filter(p => p.qty <= p.min_qty)
  const foodAlerts = interventions.filter(i => i.food_impact && i.status !== 'valide')
  const pannes = equipments.filter(e => e.status === 'panne')

  const stats = isTech ? [
    { l: 'Mes interventions', v: myOT.length,                                         c: '#00c896' },
    { l: 'À faire',           v: myOT.filter(i => i.status === 'a_faire').length,      c: '#ffa502' },
    { l: 'En cours',          v: myOT.filter(i => i.status === 'en_cours').length,     c: '#3c82e8' },
    { l: 'Terminées',         v: myOT.filter(i => i.status === 'termine' || i.status === 'valide').length, c: '#00c896' },
  ] : [
    { l: 'Équipements',   v: equipments.length,  c: '#00c896' },
    { l: 'Pannes actives', v: pannes.length,      c: '#ff4757' },
    { l: 'OT en attente', v: interventions.filter(i => i.status === 'a_faire').length, c: '#ffa502' },
    { l: 'Alertes alim.', v: foodAlerts.length,  c: foodAlerts.length > 0 ? '#ff4757' : '#00c896' },
  ]

  const upcoming = equipments
    .filter(e => e.next_inspection)
    .sort((a, b) => new Date(a.next_inspection).getTime() - new Date(b.next_inspection).getTime())
    .slice(0, 5)

  const upcomingPreventive = equipments
    .filter(e => e.next_preventive)
    .sort((a, b) => new Date(String(a.next_preventive)).getTime() - new Date(String(b.next_preventive)).getTime())
    .slice(0, 5)

  const byStatus = (list: Intervention[]) => ({
    a_faire: list.filter(i => i.status === 'a_faire').length,
    en_cours: list.filter(i => i.status === 'en_cours').length,
    termine: list.filter(i => i.status === 'termine').length,
    valide: list.filter(i => i.status === 'valide').length,
  })

  const statusCounts = byStatus(myOT)
  const statusTotal = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1

  const monthly = (() => {
    const map = new Map<string, number>()
    myOT.forEach(i => {
      const k = monthKey(i.created_at)
      map.set(k, (map.get(k) || 0) + 1)
    })
    const keys = Array.from(map.keys()).sort().slice(-6)
    const vals = keys.map(k => map.get(k) || 0)
    const max = Math.max(1, ...vals)
    return keys.map((k, idx) => ({
      k,
      label: new Date(k + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
      v: vals[idx],
      h: Math.round((vals[idx] / max) * 92),
    }))
  })()

  return (
    <AppLayout>
      <div className="page-title">
        Bonjour, {user.name.split(' ')[0]} 👋
      </div>
      <div className="page-sub">
        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>

      {/* Alertes */}
      {foodAlerts.length > 0 && (
        <div className="alert-bar" style={{ background: 'rgba(255,71,87,.08)', border: '1px solid rgba(255,71,87,.25)', color: '#ff4757' }}>
          🛡️ {foodAlerts.length} intervention(s) avec risque alimentaire non validée(s) — action requise
        </div>
      )}
      {lowStock.length > 0 && !isTech && (
        <div className="alert-bar" style={{ background: 'rgba(255,165,2,.08)', border: '1px solid rgba(255,165,2,.25)', color: '#ffa502' }}>
          📦 {lowStock.length} pièce(s) en stock critique
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[1,2,3,4].map(i => <div key={i} className="stat-card" style={{ height: 90, background: 'rgba(255,255,255,.02)', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : (
        <div className="grid-4" style={{ marginBottom: 20 }}>
          {stats.map(s => (
            <div key={s.l} className="stat-card">
              <div className="stat-value" style={{ color: s.c }}>{s.v}</div>
              <div className="stat-label">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid-2">
        {/* Interventions récentes */}
        <div className="card">
          <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--b0)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>
              {isTech ? 'Mes ordres de travail' : 'Interventions récentes'}
            </span>
            <a href="/interventions" style={{ fontSize: 12, color: '#00c896', textDecoration: 'none' }}>Voir tout →</a>
          </div>
          {myOT.slice(0, 6).map(i => {
            const sc = STATUS_CONFIG[i.status]
            const pc = PRIORITY_CONFIG[i.priority]
            return (
              <a key={i.id} href={`/interventions`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--b0)' }}>
                <div style={{ width: 3, height: 34, background: sc.color, borderRadius: 2, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--t1)' }}>{i.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--t2)' }}>
                    {(i.equipment as any)?.name}
                    {i.production_stopped && <span style={{ color: '#ff4757', marginLeft: 6 }}>⚠️ Prod. arrêtée</span>}
                  </div>
                </div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>{sc.label}</span>
              </a>
            )
          })}
          {myOT.length === 0 && !loading && (
            <div className="empty-state">
              <div style={{ fontSize: 28 }}>✅</div>
              <span>Aucune intervention</span>
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--b0)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>Activité</span>
              <span style={{ fontSize: 11, color: 'var(--t2)', fontFamily: 'var(--font-mono)' }}>{monthly.reduce((a, b) => a + b.v, 0)} OT (6 mois)</span>
            </div>
            <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--s3)', borderRadius: 10, border: '1px solid var(--b0)', padding: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 10 }}>
                  OT par statut
                </div>
                {(['a_faire', 'en_cours', 'termine', 'valide'] as const).map(k => {
                  const cfg = STATUS_CONFIG[k]
                  const v = (statusCounts as any)[k] as number
                  const pct = Math.round((v / statusTotal) * 100)
                  return (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: 12, color: 'var(--t2)' }}>{cfg.label}</div>
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: cfg.color }}>{v}</div>
                      <div style={{ width: 56, height: 6, borderRadius: 999, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: cfg.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ background: 'var(--s3)', borderRadius: 10, border: '1px solid var(--b0)', padding: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 10 }}>
                  OT / mois
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 110 }}>
                  {monthly.map(m => (
                    <div key={m.k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                      <div style={{ width: 14, height: m.h, borderRadius: 6, background: 'rgba(0,200,150,.55)', border: '1px solid rgba(0,200,150,.25)' }} />
                      <div style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Inspections à planifier */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--b0)' }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Prochaines inspections</span>
            </div>
            <div style={{ padding: '8px 18px' }}>
              {upcoming.map(eq => {
                const days = Math.floor((new Date(eq.next_inspection).getTime() - Date.now()) / 86400000)
                const urgent = days < 30
                const overdue = days < 0
                return (
                  <div key={eq.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--b0)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--t2)' }}>{fmt(eq.next_inspection)}</div>
                    </div>
                    <span style={{
                      fontSize: 11, fontFamily: 'var(--font-mono)', padding: '2px 7px', borderRadius: 4,
                      color: overdue ? '#ff4757' : urgent ? '#ffa502' : 'var(--t2)',
                      background: overdue ? 'rgba(255,71,87,.1)' : urgent ? 'rgba(255,165,2,.1)' : 'var(--s3)',
                    }}>
                      {overdue ? 'Dépassé' : `J−${days}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {upcomingPreventive.length > 0 && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--b0)' }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Maintenance préventive</span>
              </div>
              <div style={{ padding: '8px 18px' }}>
                {upcomingPreventive.map(eq => {
                  const days = Math.floor((new Date(String(eq.next_preventive)).getTime() - Date.now()) / 86400000)
                  const urgent = days < 14
                  const overdue = days < 0
                  return (
                    <div key={eq.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--b0)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--t2)' }}>{fmt(String(eq.next_preventive))}</div>
                      </div>
                      <span style={{
                        fontSize: 11, fontFamily: 'var(--font-mono)', padding: '2px 7px', borderRadius: 4,
                        color: overdue ? '#ff4757' : urgent ? '#ffa502' : 'var(--t2)',
                        background: overdue ? 'rgba(255,71,87,.1)' : urgent ? 'rgba(255,165,2,.1)' : 'var(--s3)',
                      }}>
                        {overdue ? 'Dépassé' : `J−${days}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Info site */}
          <div className="card" style={{ border: '1px solid rgba(0,200,150,.15)', background: 'rgba(0,200,150,.03)' }}>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#00c896' }}>
                <span>🛡️</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{siteConfig?.name || 'Certifications actives'}</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.6 }}>
                {siteConfig?.certifications || 'IFS Food v8 · BRC · ISO 22000 · HACCP'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                {siteConfig?.siret || 'Journal d’audit disponible pour les auditeurs'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
