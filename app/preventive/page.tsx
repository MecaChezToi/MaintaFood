'use client'

import { useEffect, useState, useMemo } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/components/layout/AuthProvider'
import { preventiveApi, partsApi, supabase } from '@/lib/supabase'
import { useData } from '@/lib/DataStore'
import type { PreventiveUpcoming, PreventiveRecord, Part } from '@/types'
import { URGENCY_CONFIG } from '@/types'

const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const fmtDT = (d?: string | null) => d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

const URGENCY_ORDER = { overdue: 0, urgent: 1, soon: 2, ok: 3 }

// ─── TYPES LOCAUX ─────────────────────────────────────────────
interface PlanPart {
  id: string
  part_id: string
  part: Part & { lead_time_days?: number | null }
}

// ─── CALCUL ANTICIPATION STOCK ────────────────────────────────
// Retourne le statut de couverture stock pour un plan
function calcStockStatus(planParts: PlanPart[], intervalDays: number, nextDueAt: string | null) {
  if (planParts.length === 0) return null

  const alerts: {
    partName: string
    qty: number
    qtyNeeded: number
    interventionsCovered: number
    leadTimeDays: number
    needReorder: boolean
    color: string
  }[] = []

  for (const pp of planParts) {
    const part = pp.part
    const stock = part.qty ?? 0
    const leadTime = part.lead_time_days ?? 0

    // Combien d'interventions le stock actuel couvre-t-il ?
    const interventionsCovered = Math.floor(stock / qtyPerInt)

    // Dans combien de jours faut-il commander pour ne pas tomber à zéro ?
    // On doit avoir le stock AVANT la prochaine intervention post-réappro
    // => jours avant rupture = interventionsCovered * intervalDays
    const daysBeforeStockout = interventionsCovered * intervalDays

    // Il faut commander si le délai de réappro dépasse le temps avant rupture
    const needReorder = leadTime > 0 && daysBeforeStockout <= leadTime

    // Qté nécessaire pour couvrir le délai de réappro + 1 intervention de marge
    const interventionsNeededDuringLeadTime = Math.ceil(leadTime / intervalDays) + 1
    const qtyNeeded = interventionsNeededDuringLeadTime * qtyPerInt

    if (needReorder || stock < qtyPerInt) {
      alerts.push({
        partName: part.name,
        qty: stock,
        qtyNeeded,
        interventionsCovered,
        leadTimeDays: leadTime,
        needReorder,
        color: stock < qtyPerInt ? '#ef4444' : '#f59e0b',
      })
    }
  }

  return alerts
}

// ─── BADGE STOCK ALERT ────────────────────────────────────────
function StockAlertBadge({ alerts }: { alerts: ReturnType<typeof calcStockStatus> }) {
  if (!alerts || alerts.length === 0) return null
 const hasBlocking = alerts.some(a => a.color === '#ef4444')
  const color = alerts.some(a => a.color === '#ef4444') ? '#ef4444' : '#f59e0b'
  return (
    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: color + '18', color, fontWeight: 700, border: `1px solid ${color}33`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      📦 {alerts.length} pièce{alerts.length > 1 ? 's' : ''} à commander
    </span>
  )
}

// ─── MODAL GESTION PIÈCES DU PLAN ─────────────────────────────
function PlanPartsModal({ item, user, onClose }: {
  item: PreventiveUpcoming
  user: any
  onClose: () => void
}) {
  const [planParts, setPlanParts] = useState<PlanPart[]>([])
  const [allParts, setAllParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedPartId, setSelectedPartId] = useState('')
  const [qty, setQty] = useState(1)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [pp, parts] = await Promise.all([
          supabase
            .from('preventive_plan_parts')
            .select('*, part:parts(id, name, ref, qty, unit, location, lead_time_days)')
            .eq('plan_id', item.id)
            .then(r => r.data || []),
          partsApi.getAll(),
        ])
        setPlanParts(pp as PlanPart[])
        setAllParts(parts)
      } catch {}
      setLoading(false)
    }
    load()
  }, [item.id])

  const addPart = async () => {
    if (!selectedPartId || qty < 1) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('preventive_plan_parts')
        .insert({
          plan_id: item.id,
          part_id: selectedPartId,
          organization_id: item.organization_id,
        })
        .select('*, part:parts(id, name, ref, qty, unit, location, lead_time_days)')
        .single()
      if (error) throw error
      setPlanParts(prev => [...prev, data as PlanPart])
      setSelectedPartId('')
      setQty(1)
    } catch (e: any) { alert('Erreur : ' + e.message) }
    setSaving(false)
  }

  const removePart = async (ppId: string) => {
    try {
      await supabase.from('preventive_plan_parts').delete().eq('id', ppId)
      setPlanParts(prev => prev.filter(p => p.id !== ppId))
    } catch (e: any) { alert('Erreur : ' + e.message) }
  }

  const updateQty = async (ppId: string, newQty: number) => {
    if (newQty < 1) return
    try {
    } catch {}
  }

  const availableParts = allParts.filter(p => !planParts.find(pp => pp.part_id === p.id))
  const alerts = calcStockStatus(planParts, item.interval_days, item.next_due_at)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 560 }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--b0)', flexShrink: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>📦 Pièces nécessaires</div>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4 }}>{item.task_name} · {item.equipment_name} · tous les {item.interval_days}j</div>
        </div>

        <div className="modal-body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading && <div style={{ textAlign: 'center', color: 'var(--t2)', padding: 20 }}>Chargement…</div>}

          {/* Alerte anticipation */}
          {!loading && alerts && alerts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.map((a, i) => (
                <div key={i} style={{ padding: '10px 14px', background: a.color + '10', border: `1px solid ${a.color}33`, borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: a.color }}>
                      {a.qty < 1 ? '🔴 Rupture' : '🟡 Commander bientôt'} — {a.partName}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--t2)' }}>Stock: {a.qty}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>
                    Couvre <strong style={{ color: 'var(--t1)' }}>{a.interventionsCovered}</strong> intervention{a.interventionsCovered > 1 ? 's' : ''} · 
                    Délai réappro : <strong style={{ color: 'var(--t1)' }}>{a.leadTimeDays}j</strong> · 
                    Qté recommandée : <strong style={{ color: a.color }}>{a.qtyNeeded} unités</strong>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Liste pièces associées */}
          {!loading && planParts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--t3)' }}>Pièces associées</div>
              {planParts.map(pp => {
                const leadTime = pp.part.lead_time_days ?? 0
                const daysBeforeStockout = interventionsCovered * item.interval_days
                const needReorder = leadTime > 0 && daysBeforeStockout <= leadTime
                const statusColor = !stockOk ? '#ef4444' : needReorder ? '#f59e0b' : '#3cb87a'
                return (
                  <div key={pp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,.03)', border: `1px solid ${statusColor}22`, borderRadius: 8, borderLeft: `3px solid ${statusColor}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{pp.part.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--t2)', fontFamily: 'var(--font-mono)' }}>
                        Stock: <span style={{ color: statusColor, fontWeight: 700 }}>{pp.part.qty} {pp.part.unit}</span>
                        {leadTime > 0 && <span> · Réappro: {leadTime}j</span>}
                        <span> · Couvre: {interventionsCovered} intervention{interventionsCovered > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: 'var(--t3)' }}>{pp.part.unit}/int.</span>
                    </div>
                    <button onClick={() => removePart(pp.id)} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'rgba(239,68,68,.15)', color: '#ef4444', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>×</button>
                  </div>
                )
              })}
            </div>
          )}

          {!loading && planParts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--t3)', fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
              Aucune pièce associée à ce plan
            </div>
          )}

          {/* Ajouter une pièce */}
          {availableParts.length > 0 && (
            <div style={{ borderTop: '1px solid var(--b0)', paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--t3)', marginBottom: 10 }}>Ajouter une pièce</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="form-input" style={{ flex: 1 }} value={selectedPartId} onChange={e => setSelectedPartId(e.target.value)}>
                  <option value="">Sélectionner une pièce…</option>
                  {availableParts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — Stock: {p.qty} {p.unit}</option>
                  ))}
                </select>
                <input className="form-input" type="number" min={1} value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} style={{ width: 70 }} />
                <button onClick={addPart} disabled={!selectedPartId || saving} className="btn btn-primary" style={{ flexShrink: 0 }}>
                  + Ajouter
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--b0)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

// ─── MODAL MARQUER COMME FAIT ────────────────────────────────
function DoneModal({ item, user, onClose, onSave }: {
  item: PreventiveUpcoming
  user: any
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    done_at: new Date().toISOString().split('T')[0],
    duration_min: item.estimated_minutes || 30,
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await preventiveApi.record({
        plan_id: item.id,
        equipment_id: item.equipment_id,
        organization_id: item.organization_id,
        done_by: user.id,
        done_at: form.done_at,
        duration_min: form.duration_min,
        notes: form.notes,
      })
      onSave()
      onClose()
    } catch (e: any) {
      alert('Erreur : ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 500 }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--b0)', flexShrink: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>✅ Marquer comme effectuée</div>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4 }}>{item.task_name} · {item.equipment_name}</div>
        </div>
        <div className="modal-body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="grid-2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label className="form-label">Date d'exécution</label>
              <input className="form-input" type="date" value={form.done_at} onChange={e => setForm(p => ({ ...p, done_at: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label className="form-label">Durée réelle (min)</label>
              <input className="form-input" type="number" value={form.duration_min} onChange={e => setForm(p => ({ ...p, duration_min: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="form-label">Notes / Observations</label>
            <textarea className="form-input" placeholder="Anomalies constatées, pièces remplacées..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ minHeight: 80 }} />
          </div>
          <div style={{ padding: '10px 14px', background: 'rgba(0,208,216,.06)', border: '1px solid rgba(0,208,216,.2)', borderRadius: 8, fontSize: 12, color: '#00d0d8' }}>
            ✓ Un enregistrement sera créé dans l'audit automatiquement
          </div>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--b0)', display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" disabled={saving} onClick={save}>
            {saving ? 'Enregistrement...' : '✓ Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PAGE PRINCIPALE ─────────────────────────────────────────
export default function PreventivePage() {
  const { user } = useAuth()
  const [upcoming, setUpcoming] = useState<PreventiveUpcoming[]>([])
  const [planParts, setPlanParts] = useState<Record<string, PlanPart[]>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'overdue' | 'urgent' | 'soon' | 'ok'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [doneModal, setDoneModal] = useState<PreventiveUpcoming | null>(null)
  const [partsModal, setPartsModal] = useState<PreventiveUpcoming | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const canEdit = user?.role && ['admin', 'chef'].includes(user.role)

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await preventiveApi.getUpcoming(180)
      const sorted = data.sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency])
      if (sorted.length > 0) {
        setUpcoming(sorted)
        // Charger les pièces de tous les plans en une requête
        const planIds = sorted.map(p => p.id)
        const { data: pp } = await supabase
          .from('preventive_plan_parts')
          .select('*, part:parts(id, name, ref, qty, unit, location, lead_time_days)')
          .in('plan_id', planIds)
        if (pp) {
          const byPlan: Record<string, PlanPart[]> = {}
          pp.forEach((p: any) => {
            if (!byPlan[p.plan_id]) byPlan[p.plan_id] = []
            byPlan[p.plan_id].push(p)
          })
          setPlanParts(byPlan)
        }
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const filtered = useMemo(() => {
    if (filter === 'all') return upcoming
    return upcoming.filter(u => u.urgency === filter)
  }, [upcoming, filter])

  const byMonth = useMemo(() => {
    const groups: Record<string, PreventiveUpcoming[]> = {}
    filtered.forEach(item => {
      if (!item.next_due_at) return
      const month = item.next_due_at.slice(0, 7)
      if (!groups[month]) groups[month] = []
      groups[month].push(item)
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const counts = useMemo(() => ({
    overdue: upcoming.filter(u => u.urgency === 'overdue').length,
    urgent:  upcoming.filter(u => u.urgency === 'urgent').length,
    soon:    upcoming.filter(u => u.urgency === 'soon').length,
    ok:      upcoming.filter(u => u.urgency === 'ok').length,
  }), [upcoming])

  // Nombre total de plans avec alerte stock
  const stockAlertCount = useMemo(() => {
    return upcoming.filter(item => {
      const pp = planParts[item.id] || []
      const alerts = calcStockStatus(pp, item.interval_days, item.next_due_at)
      return alerts && alerts.length > 0
    }).length
  }, [upcoming, planParts])

  if (!user) return null

  return (
    <AppLayout>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: 'var(--acc)', color: '#000', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div className="page-title">Maintenance préventive</div>
          <div className="page-sub">{upcoming.length} tâches planifiées</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setViewMode('list')} className="btn btn-ghost btn-sm"
            style={viewMode === 'list' ? { borderColor: 'var(--acc)', color: 'var(--acc)' } : {}}>
            ☰ Liste
          </button>
          <button onClick={() => setViewMode('calendar')} className="btn btn-ghost btn-sm"
            style={viewMode === 'calendar' ? { borderColor: 'var(--acc)', color: 'var(--acc)' } : {}}>
            📅 Calendrier
          </button>
        </div>
      </div>

      {/* Alerte stock globale */}
      {stockAlertCount > 0 && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 8, fontSize: 13, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
          📦 <strong>{stockAlertCount}</strong> plan{stockAlertCount > 1 ? 's' : ''} avec pièces à commander avant rupture
        </div>
      )}

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {(Object.entries(URGENCY_CONFIG) as any[]).map(([key, cfg]) => (
          <div key={key} className="stat-card" style={{ cursor: 'pointer', borderColor: filter === key ? cfg.color : undefined }}
            onClick={() => setFilter(filter === key ? 'all' : key as any)}>
            <div className="stat-value" style={{ color: cfg.color, fontSize: 28 }}>{counts[key as keyof typeof counts]}</div>
            <div className="stat-label">{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} className="btn btn-ghost btn-sm"
          style={filter === 'all' ? { borderColor: 'var(--acc)', color: 'var(--acc)', background: 'var(--acc-dim)' } : {}}>
          Tous ({upcoming.length})
        </button>
        {(Object.entries(URGENCY_CONFIG) as any[]).map(([key, cfg]) => (
          counts[key as keyof typeof counts] > 0 && (
            <button key={key} onClick={() => setFilter(key as any)} className="btn btn-ghost btn-sm"
              style={filter === key ? { borderColor: cfg.color, color: cfg.color, background: cfg.bg } : {}}>
              {cfg.label} ({counts[key as keyof typeof counts]})
            </button>
          )
        ))}
      </div>

      {loading && upcoming.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--t2)' }}>Chargement...</div>}

      {/* Vue Liste */}
      {!loading && viewMode === 'list' && (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Machine</th>
                <th>Tâche</th>
                <th>Zone</th>
                <th>Fréquence</th>
                <th>Dernière fois</th>
                <th>Prochaine</th>
                <th>Stock</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9}><div className="empty-state"><span>✅</span><span>Aucune maintenance à venir</span></div></td></tr>
              )}
              {filtered.map(item => {
                const uc = URGENCY_CONFIG[item.urgency]
                const pp = planParts[item.id] || []
                const alerts = calcStockStatus(pp, item.interval_days, item.next_due_at)
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.equipment_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--t2)' }}>{item.equipment_location}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{item.task_name}</div>
                      {item.requires_stop && <div style={{ fontSize: 10, color: '#f59e0b' }}>⚠️ Arrêt requis</div>}
                      {item.estimated_minutes && <div style={{ fontSize: 10, color: 'var(--t2)' }}>⏱ {item.estimated_minutes} min</div>}
                    </td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Zone {item.equipment_zone}</span></td>
                    <td><span style={{ fontSize: 12, color: 'var(--t2)' }}>tous les {item.interval_days}j</span></td>
                    <td style={{ fontSize: 12, color: 'var(--t2)' }}>{fmt(item.last_done_at)}</td>
                    <td style={{ fontWeight: 600, color: uc.color, fontSize: 12 }}>{fmt(item.next_due_at)}</td>
                    <td>
                      {pp.length === 0 ? (
                        <span style={{ fontSize: 11, color: 'var(--t3)' }}>—</span>
                      ) : alerts && alerts.length > 0 ? (
                        <StockAlertBadge alerts={alerts} />
                      ) : (
                        <span style={{ fontSize: 11, color: '#3cb87a', fontWeight: 600 }}>✓ OK</span>
                      )}
                    </td>
                    <td><span className="badge" style={{ background: uc.bg, color: uc.color }}>{uc.label}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {canEdit && (
                          <button onClick={() => setPartsModal(item)} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} title="Gérer les pièces">
                            📦
                          </button>
                        )}
                        <button onClick={() => setDoneModal(item)} className="btn btn-primary btn-sm" style={{ fontSize: 11 }}>
                          ✓ Fait
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Vue Calendrier */}
      {viewMode === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {byMonth.length === 0 && (
            <div className="empty-state"><span>✅</span><span>Aucune maintenance planifiée</span></div>
          )}
          {byMonth.map(([month, items]) => {
            const date = new Date(month + '-01')
            const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
            return (
              <div key={month} className="card">
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--b0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, textTransform: 'capitalize' }}>📅 {monthLabel}</span>
                  <span style={{ fontSize: 12, color: 'var(--t2)' }}>{items.length} tâche{items.length > 1 ? 's' : ''}</span>
                </div>
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map(item => {
                    const uc = URGENCY_CONFIG[item.urgency]
                    const pp = planParts[item.id] || []
                    const alerts = calcStockStatus(pp, item.interval_days, item.next_due_at)
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--s3)', borderRadius: 8, border: `1px solid ${uc.color}22` }}>
                        <div style={{ width: 40, textAlign: 'center', flexShrink: 0 }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: uc.color, fontFamily: 'var(--font-mono)' }}>
                            {item.next_due_at ? new Date(item.next_due_at).getDate() : '—'}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase' }}>
                            {item.next_due_at ? new Date(item.next_due_at).toLocaleDateString('fr-FR', { weekday: 'short' }) : ''}
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{item.task_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--t2)' }}>{item.equipment_name} · Zone {item.equipment_zone}</div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                            {item.requires_stop && <span style={{ fontSize: 10, color: '#f59e0b' }}>⚠️ Arrêt requis</span>}
                            {item.estimated_minutes && <span style={{ fontSize: 10, color: 'var(--t2)' }}>⏱ {item.estimated_minutes} min</span>}
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: uc.bg, color: uc.color }}>{uc.label}</span>
                            {alerts && alerts.length > 0 && <StockAlertBadge alerts={alerts} />}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                          {canEdit && (
                            <button onClick={() => setPartsModal(item)} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} title="Pièces">📦</button>
                          )}
                          <button onClick={() => setDoneModal(item)} className="btn btn-primary btn-sm" style={{ fontSize: 11 }}>✓ Fait</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {doneModal && (
        <DoneModal item={doneModal} user={user} onClose={() => setDoneModal(null)}
          onSave={() => { showToast('Maintenance enregistrée — audit mis à jour'); load(true) }} />
      )}

      {partsModal && (
        <PlanPartsModal item={partsModal} user={user} onClose={() => { setPartsModal(null); load(true) }} />
      )}
    </AppLayout>
  )
}
