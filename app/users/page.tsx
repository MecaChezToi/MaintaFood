'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/components/layout/AuthProvider'
import { profilesApi, interventionsApi, supabase } from '@/lib/supabase'
import type { Profile, Intervention } from '@/types'
import { ROLE_CONFIG } from '@/types'

const fmt = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

export default function UsersPage() {
  const { user, session } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'technician' as Profile['role'] })

  // Edit state
  const [editProfile, setEditProfile] = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState({ name: '', role: 'technician' as Profile['role'] })
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete state
  const [deleteProfile, setDeleteProfile] = useState<Profile | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    Promise.all([profilesApi.getAll(), interventionsApi.getAll()])
      .then(([p, i]) => {
        if (p.length > 0) setProfiles(p)
        if (i.length > 0) setInterventions(i)
        setLoading(false)
      }).catch(() => setLoading(false))
  }, [])

  if (!user) return null
  const canCreate = user.role === 'admin'

  const getToken = async () => {
    const { data: { session: freshSession } } = await supabase.auth.getSession()
    return freshSession?.access_token || session?.access_token
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const createUser = async () => {
    setCreateError(null)
    setCreating(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Session manquante, reconnectez-vous.')

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Impossible de créer l'utilisateur.")

      const p = await profilesApi.getAll()
      setProfiles(p)
      setShowCreate(false)
      setForm({ name: '', email: '', password: '', role: 'technician' })
      showToast('Utilisateur créé')
    } catch (e: any) {
      setCreateError(e.message || "Impossible de créer l'utilisateur.")
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (p: Profile) => {
    setEditProfile(p)
    setEditForm({ name: p.name, role: p.role })
    setEditError(null)
  }

  const saveEdit = async () => {
    if (!editProfile) return
    setEditError(null)
    setEditing(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Session manquante, reconnectez-vous.')

      const res = await fetch(`/api/admin/users/${editProfile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editForm),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Impossible de modifier.')

      const p = await profilesApi.getAll()
      setProfiles(p)
      setEditProfile(null)
      showToast('Utilisateur modifié')
    } catch (e: any) {
      setEditError(e.message || 'Impossible de modifier.')
    } finally {
      setEditing(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteProfile) return
    setDeleting(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Session manquante, reconnectez-vous.')

      const res = await fetch(`/api/admin/users/${deleteProfile.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Impossible de supprimer.')

      setProfiles(prev => prev.filter(p => p.id !== deleteProfile.id))
      setDeleteProfile(null)
      showToast('Utilisateur supprimé')
    } catch (e: any) {
      showToast('Erreur : ' + e.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppLayout>
      <div className="page-title">Utilisateurs</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div className="page-sub">{profiles.length} comptes · {profiles.filter(p => p.active).length} actifs</div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Ajouter un utilisateur</button>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: 'var(--acc)', color: '#000', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,.4)' }}>
          ✓ {toast}
        </div>
      )}

      {loading && profiles.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--t2)' }}>Chargement…</div>
      )}

      <div className="grid-2">
        {profiles.map(p => {
          const rc = ROLE_CONFIG[p.role]
          const myOT = interventions.filter(i => i.technician_id === p.id)
          const inProgress = myOT.filter(i => i.status === 'en_cours').length
          const todo = myOT.filter(i => i.status === 'a_faire').length
          const isSelf = user?.id === p.id

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
                    {isSelf && <span style={{ fontSize: 10, color: '#00d0d8', fontFamily: 'var(--font-mono)', marginLeft: 8 }}>● vous</span>}
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

              {canCreate && !isSelf && (
                <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,.04)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Modifier</button>
                  <button
                    className="btn btn-sm"
                    style={{ background: 'rgba(255,71,87,.1)', color: '#ff4757', border: '1px solid rgba(255,71,87,.25)' }}
                    onClick={() => setDeleteProfile(p)}
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!loading && profiles.length === 0 && (
        <div className="empty-state"><span style={{ fontSize: 32 }}>👤</span><span>Aucun utilisateur trouvé</span></div>
      )}

      {/* Modal Créer */}
      {showCreate && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal-box" style={{ maxWidth: 560 }}>
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--b0)', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Ajouter un utilisateur</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>Fermer</button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label className="form-label">Nom *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="ex: Jean Dupont" autoComplete="off" />
              </div>
              <div className="grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label className="form-label">Email *</label>
                  <input className="form-input" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} placeholder="ex: jean@entreprise.com" autoComplete="off" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label className="form-label">Mot de passe *</label>
                  <input className="form-input" type="password" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} placeholder="min 6 caractères" autoComplete="new-password" />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label className="form-label">Rôle</label>
                <select className="form-select" value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value as any }))}>
                  <option value="technician">Technicien</option>
                  <option value="chef">Chef</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {createError && (
                <div style={{ padding: '10px 12px', background: 'rgba(255,71,87,.08)', border: '1px solid rgba(255,71,87,.25)', borderRadius: 8, fontSize: 12.5, color: '#ff4757' }}>{createError}</div>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--b0)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Annuler</button>
              <button className="btn btn-primary" disabled={creating || !form.name.trim() || !form.email.trim() || form.password.length < 6} onClick={createUser}>
                {creating ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifier */}
      {editProfile && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditProfile(null)}>
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--b0)', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Modifier — {editProfile.name}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditProfile(null)}>Fermer</button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label className="form-label">Nom *</label>
                <input className="form-input" value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} autoComplete="off" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label className="form-label">Rôle</label>
                <select className="form-select" value={editForm.role} onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value as any }))}>
                  <option value="technician">Technicien</option>
                  <option value="chef">Chef</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {editError && (
                <div style={{ padding: '10px 12px', background: 'rgba(255,71,87,.08)', border: '1px solid rgba(255,71,87,.25)', borderRadius: 8, fontSize: 12.5, color: '#ff4757' }}>{editError}</div>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--b0)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setEditProfile(null)}>Annuler</button>
              <button className="btn btn-primary" disabled={editing || !editForm.name.trim()} onClick={saveEdit}>
                {editing ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmer suppression */}
      {deleteProfile && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteProfile(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--b0)' }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Supprimer l'utilisateur</div>
            </div>
            <div style={{ padding: 20, fontSize: 14, color: 'var(--t2)', lineHeight: 1.6 }}>
              Confirmer la suppression de <strong style={{ color: 'var(--t1)' }}>{deleteProfile.name}</strong> ?
              Cette action est irréversible.
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--b0)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setDeleteProfile(null)}>Annuler</button>
              <button
                className="btn btn-sm"
                style={{ background: 'rgba(255,71,87,.15)', color: '#ff4757', border: '1px solid rgba(255,71,87,.35)', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                disabled={deleting}
                onClick={confirmDelete}
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
