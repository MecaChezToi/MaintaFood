// app/eq/[id]/page.tsx — Page de scan QR code équipement
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { equipmentsApi, interventionsApi, filesApi, supabase } from '@/lib/supabase'
import { useAuth } from '@/components/layout/AuthProvider'
import { EQ_STATUS_CONFIG, STATUS_CONFIG, PRIORITY_CONFIG } from '@/types'
import type { Equipment, Intervention } from '@/types'

const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const fmtDT = (d?: string | null) => d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

export default function EquipmentScanPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showNewOT, setShowNewOT] = useState(false)
  const [otTitle, setOtTitle] = useState('')
  const [otDesc, setOtDesc] = useState('')
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'docs'>('info')

  useEffect(() => {
    if (!id) return
    Promise.all([
      equipmentsApi.getById(id as string),
      interventionsApi.getAll(),
      filesApi.list(`equipements/${id}`),
    ]).then(([eq, ints, docs]) => {
      setEquipment(eq)
      setInterventions(ints.filter((i: Intervention) => i.equipment_id === id).slice(0, 20))
      setFiles(docs.filter((f: any) => f.url))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const createIntervention = async () => {
    if (!user || !equipment || !otTitle.trim()) return
    setCreating(true)
    try {
      await interventionsApi.create({
        title: otTitle,
        description: otDesc,
        equipment_id: equipment.id,
        technician_id: user.id,
        created_by: user.id,
        priority: 'normale',
        status: 'a_faire',
        organization_id: user.organization_id,
      })
      router.push('/interventions')
    } finally {
      setCreating(false)
    }
  }

  if (loading || authLoading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080909' }}>
      <div style={{ color: '#00c896', fontFamily: 'monospace', fontSize: 13 }}>Chargement…</div>
    </div>
  )

  if (!user) return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#080909', padding: 24, gap: 16 }}>
      <div style={{ fontSize: 40 }}>⚙️</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Connexion requise</div>
      <div style={{ fontSize: 13, color: '#7a8599', textAlign: 'center' }}>Connectez-vous pour accéder à la fiche machine.</div>
      <button onClick={() => router.push('/auth')} style={{ padding: '10px 24px', background: '#00c896', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
        Se connecter
      </button>
    </div>
  )

  if (!equipment) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080909' }}>
      <div style={{ color: '#7a8599', fontSize: 13 }}>Équipement introuvable.</div>
    </div>
  )

  const statusCfg = EQ_STATUS_CONFIG[equipment.status]
  const inspectionOverdue = equipment.next_inspection && new Date(equipment.next_inspection) < new Date()

  const tabStyle = (tab: string) => ({
    flex: 1, padding: '10px 4px', textAlign: 'center' as const,
    fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
    background: activeTab === tab ? 'rgba(0,200,150,.12)' : 'transparent',
    color: activeTab === tab ? '#00c896' : '#7a8599',
    borderBottom: activeTab === tab ? '2px solid #00c896' : '2px solid transparent',
  })

  return (
    <div style={{ minHeight: '100dvh', background: '#080909', fontFamily: 'sans-serif', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: '#0f1012', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.08)', borderRadius: 6, color: '#7a8599', cursor: 'pointer', padding: '5px 10px', fontSize: 13 }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: '#3a4055', textTransform: 'uppercase', letterSpacing: '.6px' }}>Fiche machine · Scan QR</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e8f0' }}>MaintaFood</div>
        </div>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.08)', borderRadius: 6, color: '#7a8599', cursor: 'pointer', padding: '5px 10px', fontSize: 11 }}>Dashboard</button>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Statut */}
        <div style={{ padding: '10px 14px', background: `${statusCfg.color}14`, border: `1px solid ${statusCfg.color}33`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusCfg.color }} />
          <span style={{ fontWeight: 600, color: statusCfg.color, fontSize: 13 }}>{statusCfg.label}</span>
          {equipment.food_safe && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#00c896', background: 'rgba(0,200,150,.12)', padding: '2px 8px', borderRadius: 10 }}>✓ Alimentaire</span>}
        </div>

        {/* Nom machine */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#e4e8f0', marginBottom: 2 }}>{equipment.name}</div>
          <div style={{ fontSize: 13, color: '#7a8599' }}>{equipment.location || '—'} · Zone {equipment.zone || '—'}</div>
        </div>

        {/* ── KPI Maintenance ─────────────────────────────────── */}
        {(() => {
          const done = interventions.filter(i => i.signed_at && i.report_duration && i.report_duration > 0)
          // MTTR = moyenne des durées de rapport (en minutes → heures)
          const mttrMin = done.length ? Math.round(done.reduce((s, i) => s + (i.report_duration || 0), 0) / done.length) : null
          const mttrStr = mttrMin ? `${Math.floor(mttrMin / 60)}h${String(mttrMin % 60).padStart(2, '0')}` : '—'

          // MTBF = écart moyen entre interventions terminées (en jours)
          const sortedDates = interventions
            .filter(i => i.created_at)
            .map(i => new Date(i.created_at).getTime())
            .sort((a, b) => a - b)
          let mtbfDays: number | null = null
          if (sortedDates.length >= 2) {
            const gaps = sortedDates.slice(1).map((t, i) => (t - sortedDates[i]) / 86400000)
            mtbfDays = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length)
          }

          // OT ouverts / en retard
          const open = interventions.filter(i => !['termine', 'valide'].includes(i.status))
          const late = open.filter(i => {
            const age = (Date.now() - new Date(i.created_at).getTime()) / 86400000
            return age > 7 // en retard si ouvert depuis > 7 jours
          })

          // Disponibilité = 1 - (temps en panne / période)
          // On estime le temps en panne = somme des MTTR sur la fenêtre
          const periodDays = 90
          const totalDownMin = done.reduce((s, i) => s + (i.report_duration || 0), 0)
          const dispo = Math.min(100, Math.round((1 - totalDownMin / (periodDays * 24 * 60)) * 1000) / 10)

          const dispoColor = dispo >= 98 ? '#00c896' : dispo >= 90 ? '#f59e0b' : '#ff4757'
          const mtbfColor = !mtbfDays ? '#3a4055' : mtbfDays >= 60 ? '#00c896' : mtbfDays >= 30 ? '#f59e0b' : '#ff4757'

          return (
            <div style={{ background: '#0f1012', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: '#3a4055', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📊</span> Résumé maintenance
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                {/* MTBF */}
                <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, color: '#3a4055', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 4 }}>MTBF</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: mtbfColor, fontFamily: 'monospace', lineHeight: 1 }}>
                    {mtbfDays !== null ? `${mtbfDays}j` : '—'}
                  </div>
                  <div style={{ fontSize: 9, color: '#3a4055', marginTop: 3 }}>moy. entre pannes</div>
                </div>
                {/* MTTR */}
                <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, color: '#3a4055', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 4 }}>MTTR</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#3c82e8', fontFamily: 'monospace', lineHeight: 1 }}>{mttrStr}</div>
                  <div style={{ fontSize: 9, color: '#3a4055', marginTop: 3 }}>moy. rép. dépann.</div>
                </div>
                {/* Disponibilité */}
                <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, color: '#3a4055', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 4 }}>Dispo.</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: dispoColor, fontFamily: 'monospace', lineHeight: 1 }}>{dispo}%</div>
                  <div style={{ fontSize: 9, color: '#3a4055', marginTop: 3 }}>sur 90 jours</div>
                </div>
              </div>
              {/* Barre disponibilité */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ height: 5, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${dispo}%`, background: dispoColor, borderRadius: 3, transition: 'width .6s ease' }} />
                </div>
              </div>
              {/* OT ouverts / en retard */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: open.length > 0 ? 'rgba(245,158,11,.06)' : 'rgba(255,255,255,.02)', border: `1px solid ${open.length > 0 ? 'rgba(245,158,11,.2)' : 'rgba(255,255,255,.06)'}`, borderRadius: 8 }}>
                  <span style={{ fontSize: 14 }}>📋</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: open.length > 0 ? '#f59e0b' : '#00c896', fontFamily: 'monospace', lineHeight: 1 }}>{open.length}</div>
                    <div style={{ fontSize: 9, color: '#3a4055', marginTop: 2 }}>OT ouverts</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: late.length > 0 ? 'rgba(255,71,87,.06)' : 'rgba(255,255,255,.02)', border: `1px solid ${late.length > 0 ? 'rgba(255,71,87,.2)' : 'rgba(255,255,255,.06)'}`, borderRadius: 8 }}>
                  <span style={{ fontSize: 14 }}>⚠️</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: late.length > 0 ? '#ff4757' : '#00c896', fontFamily: 'monospace', lineHeight: 1 }}>{late.length}</div>
                    <div style={{ fontSize: 9, color: '#3a4055', marginTop: 2 }}>OT en retard</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Bouton créer intervention */}
        {!showNewOT ? (
          <button onClick={() => setShowNewOT(true)} style={{ width: '100%', padding: '14px', background: '#00c896', color: '#000', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 14 }}>
            📝 Créer une intervention
          </button>
        ) : (
          <div style={{ background: '#0f1012', border: '1px solid rgba(0,200,150,.2)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e8f0', marginBottom: 12 }}>Nouvelle intervention</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input placeholder="Titre *" value={otTitle} onChange={e => setOtTitle(e.target.value)}
                style={{ padding: '10px 12px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 14, outline: 'none' }} />
              <textarea placeholder="Description (optionnel)" value={otDesc} onChange={e => setOtDesc(e.target.value)} rows={2}
                style={{ padding: '10px 12px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 13, outline: 'none', resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowNewOT(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#7a8599', cursor: 'pointer', fontSize: 13 }}>Annuler</button>
                <button onClick={createIntervention} disabled={creating || !otTitle.trim()} style={{ flex: 2, padding: '10px', background: creating ? 'rgba(0,200,150,.4)' : '#00c896', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  {creating ? 'Création…' : 'Créer →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#0f1012', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
          <button style={tabStyle('info')} onClick={() => setActiveTab('info')}>📋 Infos</button>
          <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>🔧 Historique ({interventions.length})</button>
          <button style={tabStyle('docs')} onClick={() => setActiveTab('docs')}>📎 Documents ({files.length})</button>
        </div>

        {/* Tab Infos */}
        {activeTab === 'info' && (
          <div style={{ background: '#0f1012', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'N° série', value: equipment.serial || '—' },
                { label: 'Catégorie', value: equipment.category || '—' },
                { label: 'Fabricant', value: (equipment as any).manufacturer || '—' },
                { label: 'Installation', value: fmt((equipment as any).installation_date) },
                { label: 'Dernière inspection', value: fmt(equipment.last_inspection) },
                { label: 'Prochaine inspection', value: fmt(equipment.next_inspection) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.6px', color: '#3a4055', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#e4e8f0' }}>{value}</div>
                </div>
              ))}
            </div>
            {inspectionOverdue && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,71,87,.08)', border: '1px solid rgba(255,71,87,.2)', borderRadius: 8, fontSize: 12, color: '#ff4757' }}>
                ⚠️ Inspection en retard — action requise
              </div>
            )}
            {equipment.schema_desc && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.04)', fontSize: 13, color: '#7a8599', lineHeight: 1.6 }}>
                {equipment.schema_desc}
              </div>
            )}
          </div>
        )}

        {/* Tab Historique */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {interventions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#3a4055', fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                Aucune intervention sur cette machine
              </div>
            ) : interventions.map(i => {
              const sc = STATUS_CONFIG[i.status]
              const pc = PRIORITY_CONFIG[i.priority]
              return (
                <div key={i.id} style={{ background: '#0f1012', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color }}>{sc.label}</span>
                    <span style={{ fontSize: 10, color: pc.color }}>{pc.label}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e4e8f0', marginBottom: 4 }}>{i.title}</div>
                  <div style={{ fontSize: 11, color: '#3a4055' }}>{fmtDT(i.created_at)}</div>
                  {i.report_verdict && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#00c896' }}>✅ Rapport signé · {i.report_verdict}</div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Tab Documents */}
        {activeTab === 'docs' && (
          <div style={{ marginBottom: 14 }}>
            {files.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#3a4055', fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
                Aucun document sur cette machine
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {files.map(file => {
                  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
                  return isImage ? (
                    <a key={file.path} href={file.url} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,.06)' }}>
                      <img src={file.url} alt={file.name} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
                      <div style={{ padding: '6px 8px', fontSize: 10, color: '#7a8599', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: '#0f1012' }}>{file.name}</div>
                    </a>
                  ) : (
                    <a key={file.path} href={file.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0f1012', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 12, color: '#e4e8f0', textDecoration: 'none' }}>
                      <span style={{ fontSize: 24 }}>📄</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <button onClick={() => router.push('/plan')} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, color: '#7a8599', fontSize: 13, cursor: 'pointer' }}>
          Voir sur le plan du site
        </button>
      </div>
    </div>
  )
}
