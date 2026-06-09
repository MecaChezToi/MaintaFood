'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/components/layout/AuthProvider'
import { siteConfigApi, equipmentsApi, interventionsApi, partsApi, profilesApi, preventiveApi } from '@/lib/supabase'
import type { SiteConfig } from '@/types'

export default function SettingsPage() {
  const { user } = useAuth()
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isAdmin = user?.role === 'admin'
  const [exporting, setExporting] = useState(false)

  useEffect(() => { siteConfigApi.get().then(setConfig) }, [])

  const save = async () => {
    if (!config || !isAdmin) return
    setSaving(true)
    setError(null)
    try {
      await siteConfigApi.update({ name: config.name, address: config.address, siret: config.siret, certifications: config.certifications })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message || 'Impossible de sauvegarder les parametres.')
    } finally {
      setSaving(false)
    }
  }

  const s = (k: keyof SiteConfig, v: string) => setConfig(c => c ? { ...c, [k]: v } : c)

  const exportExcel = async () => {
    setExporting(true)
    try {
      const [equipments, interventions, parts, profiles, preventive] = await Promise.all([
        equipmentsApi.getAll(),
        interventionsApi.getAll(),
        partsApi.getAll(),
        profilesApi.getAll(),
        preventiveApi.getUpcoming(365),
      ])

      const now = new Date().toLocaleDateString('fr-FR')
      const siteName = config?.name || 'MaintaFood'

      // Générer CSV multi-feuilles simulé en HTML table → Excel
      const sheets = [
        {
          name: 'Équipements',
          headers: ['Nom','Zone','Localisation','Catégorie','Statut','N° Série','Fabricant','Date installation','Prochaine inspection','Zone alimentaire'],
          rows: equipments.map(e => [
            e.name, e.zone||'—', e.location||'—', e.category||'—', e.status,
            e.serial||'—', (e as any).manufacturer||'—', (e as any).installation_date||'—',
            e.next_inspection||'—', e.food_safe ? 'Oui' : 'Non'
          ])
        },
        {
          name: 'Interventions',
          headers: ['Titre','Machine','Statut','Priorité','Technicien','Créé le','Signé le','Durée (min)','Verdict','Actions','Observations'],
          rows: interventions.map(i => [
            i.title, (i.equipment as any)?.name||'—', i.status, i.priority,
            (i.technician as any)?.name||'—',
            i.created_at ? new Date(i.created_at).toLocaleDateString('fr-FR') : '—',
            i.signed_at ? new Date(i.signed_at).toLocaleDateString('fr-FR') : '—',
            i.report_duration||'—', i.report_verdict||'—',
            i.report_actions||'—', i.report_observations||'—'
          ])
        },
        {
          name: 'Stock pièces',
          headers: ['Référence','Désignation','Catégorie','Unité','Stock actuel','Stock min.','Prix HTVA','Fournisseur','Réf. fournisseur','Emplacement','Alerte critique'],
          rows: parts.map(p => [
            p.ref, p.name, p.category||'—', p.unit, p.qty, p.min_qty,
            p.price||'—', p.supplier||'—', p.supplier_ref||'—',
            p.location||'—', p.qty <= p.min_qty ? 'OUI' : 'non'
          ])
        },
        {
          name: 'Utilisateurs',
          headers: ['Nom','Rôle','Actif','Créé le'],
          rows: profiles.map(p => [
            p.name, p.role, p.active ? 'Oui' : 'Non',
            p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '—'
          ])
        },
        {
          name: 'Planning préventif',
          headers: ['Machine','Zone','Tâche','Fréquence (j)','Dernière exécution','Prochaine échéance','Statut urgence','Durée estimée (min)','Arrêt requis'],
          rows: preventive.map(p => [
            p.equipment_name||'—', p.equipment_zone||'—', p.task_name||'—',
            p.interval_days||'—',
            p.last_done_at ? new Date(p.last_done_at).toLocaleDateString('fr-FR') : 'Jamais',
            p.next_due_at ? new Date(p.next_due_at).toLocaleDateString('fr-FR') : '—',
            p.urgency||'—', p.estimated_minutes||'—', p.requires_stop ? 'Oui' : 'Non'
          ])
        },
      ]

      const toHtml = (sheet: any) => `
        <h2 style="font-family:Arial;font-size:14px;margin:20px 0 8px;color:#0a0b0c">${sheet.name} — ${siteName} — Exporté le ${now}</h2>
        <table border="1" cellpadding="5" cellspacing="0" style="font-family:Arial;font-size:11px;border-collapse:collapse;width:100%">
          <thead><tr style="background:#0a0b0c;color:#fff">${sheet.headers.map((h: string) => `<th style="padding:6px 10px;text-align:left">${h}</th>`).join('')}</tr></thead>
          <tbody>${sheet.rows.map((row: any[], ri: number) =>
            `<tr style="background:${ri%2===0?'#fff':'#f9fafb'}">${row.map(cell =>
              `<td style="padding:5px 10px;border:1px solid #e5e7eb">${cell ?? '—'}</td>`
            ).join('')}</tr>`
          ).join('')}</tbody>
        </table><br/>
      `

      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>${
  sheets.map(s => `<x:ExcelWorksheet><x:Name>${s.name}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>`).join('')
}</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
<body>${sheets.map(toHtml).join('')}</body></html>`

      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `maintafood-export-${new Date().toISOString().split('T')[0]}.xls`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert('Erreur export : ' + (e.message || "Impossible d'exporter les données."))
    } finally {
      setExporting(false)
    }
  }

  return (
    <AppLayout>
      <div className="page-title">Paramètres</div>
      <div className="page-sub">Configuration de la plateforme FixOps</div>

      <div className="grid-2" style={!isAdmin ? { gridTemplateColumns: '1fr' } : undefined}>
        {isAdmin && <div className="card">
          <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>⚙️ Informations du site</div>
          </div>
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {config ? <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label className="form-label">Nom du site</label>
                <input className="form-input" value={config.name} onChange={e => s('name', e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label className="form-label">Adresse</label>
                <input className="form-input" value={config.address || ''} onChange={e => s('address', e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label className="form-label">SIRET</label>
                <input className="form-input" value={config.siret || ''} onChange={e => s('siret', e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label className="form-label">Certifications</label>
                <input className="form-input" value={config.certifications || ''} onChange={e => s('certifications', e.target.value)} placeholder="ex: IFS Food v8 · BRC · ISO 22000" />
              </div>
              {saved && <div style={{ padding: '8px 12px', background: 'rgba(0,208,216,.08)', border: '1px solid rgba(0,208,216,.2)', borderRadius: 6, fontSize: 13, color: '#00d0d8' }}>✅ Sauvegardé !</div>}
              {error && <div style={{ padding: '8px 12px', background: 'rgba(255,71,87,.08)', border: '1px solid rgba(255,71,87,.25)', borderRadius: 6, fontSize: 13, color: '#ff4757' }}>{error}</div>}
              <button onClick={save} disabled={saving} style={{ background: '#00d0d8', color: '#000', border: 'none', borderRadius: 6, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-outfit)' }}>
                {saving ? 'Sauvegarde...' : '✓ Sauvegarder'}
              </button>
            </> : <div style={{ color: 'var(--t2)', fontSize: 13 }}>Chargement…</div>}
          </div>
        </div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>🛡️ Sécurité & Conformité</div>
              {[
                'Authentification sécurisée via Supabase Auth',
                'Données chiffrées en transit (HTTPS)',
                'Row Level Security — chaque utilisateur voit ses données',
                'Journal d\'audit horodaté non modifiable',
                'Hébergement Europe (Ireland West)',
                'Conformité RGPD applicable',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#00d0d8', flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: 'var(--t2)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>📱 Installation PWA</div>
              <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.7, marginBottom: 12 }}>
                Sur Android Chrome : menu ⋮ → "Ajouter à l'écran d'accueil". L'app s'ouvre en plein écran comme une application native.
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 8, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--t3)', lineHeight: 1.8 }}>
                URL de déploiement :<br/>
                <span style={{ color: '#00d0d8' }}>https://votre-app.vercel.app</span>
              </div>
            </div>
          </div>

          {isAdmin && (
          <div className="card" style={{ border: '1px solid rgba(124,58,237,.2)', background: 'rgba(124,58,237,.03)' }}>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>📤 Export des données</div>
              <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.7, marginBottom: 14 }}>
                Exportez toutes vos données en un fichier Excel — équipements, interventions, stock, utilisateurs et planning préventif. Utile pour archiver ou migrer vers un autre système.
              </div>
              <button
                onClick={exportExcel}
                disabled={exporting}
                style={{ width: '100%', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: exporting ? 'wait' : 'pointer', opacity: exporting ? .7 : 1, fontFamily: 'var(--font-outfit)' }}
              >
                {exporting ? '⏳ Génération en cours...' : '⬇️ Télécharger tout en Excel'}
              </button>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                5 feuilles : Équipements · Interventions · Stock · Utilisateurs · Planning préventif
              </div>
            </div>
          </div>
          )}

          <div className="card" style={{ border: '1px solid rgba(0,208,216,.15)', background: 'rgba(0,208,216,.03)' }}>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#00d0d8', marginBottom: 8 }}>Version</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[['FixOps GMAO','v1.0.0'],['Next.js','14.x'],['Supabase','2.x'],['Base de données','PostgreSQL 15']].map(([k,v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--t2)' }}>{k}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--t1)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
