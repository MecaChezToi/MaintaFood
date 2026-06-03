import { createClient } from '@supabase/supabase-js'
import type {
  Profile, Organization, Equipment, Part, Intervention,
  InterventionComment, InterventionPhoto, InterventionPart,
  AuditLog, SiteConfig
} from '@/types'

const STORAGE_BUCKET = 'intervention-photos'

const sanitizeFileName = (name: string) =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-')

const ensureNoError = (error: any, context: string) => {
  if (error) {
    console.error(`[Supabase] ${context}`, error)
    throw new Error(error.message || context)
  }
}

// ─── CLIENT ─────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (typeof window !== 'undefined') {
  if (!supabaseUrl || !supabaseKey) {
    console.error('[Supabase] ❌ Variables manquantes !', {
      url: supabaseUrl ? '✅ OK' : '❌ MANQUANTE',
      key: supabaseKey ? '✅ OK' : '❌ MANQUANTE',
    })
  } else {
    console.log('[Supabase] ✅ Variables OK', {
      url: supabaseUrl.slice(0, 30) + '...',
      key: supabaseKey.slice(0, 10) + '...',
    })
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
)

// ─── AUTH ────────────────────────────────────────────────────
export const auth = {
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
  getSession: () => supabase.auth.getSession(),
  onAuthChange: (cb: (session: any) => void) =>
    supabase.auth.onAuthStateChange((_event, session) => cb(session)),
}

// ─── ORGANISATIONS ───────────────────────────────────────────
export const organizationsApi = {
  getCurrent: async (): Promise<Organization | null> => {
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .single()
    return data
  },

  update: async (id: string, updates: Partial<Organization>): Promise<void> => {
    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
    ensureNoError(error, 'Mise à jour organisation')
  },

  // Appelé lors de l'inscription d'un nouveau client
  create: async (name: string, slug: string, adminUserId: string): Promise<string> => {
    const { data, error } = await supabase.rpc('create_organization', {
      p_name: name,
      p_slug: slug,
      p_admin_user_id: adminUserId,
    })
    ensureNoError(error, 'Création organisation')
    return data
  },
}

// ─── PROFILS ─────────────────────────────────────────────────
// Note: RLS filtre automatiquement par organization_id — pas besoin de le passer
export const profilesApi = {
  getAll: async (): Promise<Profile[]> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('name')
    return data ?? []
  },

  getById: async (id: string): Promise<Profile | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    return data
  },

  update: async (id: string, updates: Partial<Profile>): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
    ensureNoError(error, 'Mise à jour profil')
  },
}

// ─── ÉQUIPEMENTS ─────────────────────────────────────────────
export const equipmentsApi = {
  getAll: async (): Promise<Equipment[]> => {
    const { data } = await supabase
      .from('equipments')
      .select('*')
      .order('name')
    return data ?? []
  },

  getById: async (id: string): Promise<Equipment | null> => {
    const { data } = await supabase
      .from('equipments')
      .select('*, equipment_parts(part_id, parts(*))')
      .eq('id', id)
      .single()
    return data
  },

  create: async (eq: Omit<Partial<Equipment>, 'organization_id'>): Promise<Equipment | null> => {
    // organization_id est automatiquement défini via RLS + current_organization_id()
    const { data, error } = await supabase
      .from('equipments')
      .insert(eq)
      .select()
      .single()
    ensureNoError(error, 'Creation equipement')
    return data
  },

  update: async (id: string, updates: Partial<Equipment>): Promise<Equipment | null> => {
    const { data, error } = await supabase
      .from('equipments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    ensureNoError(error, 'Mise a jour equipement')
    return data
  },

  getParts: async (equipmentId: string): Promise<Part[]> => {
    const { data } = await supabase
      .from('equipment_parts')
      .select('parts(*)')
      .eq('equipment_id', equipmentId)
    return (data ?? []).map((d: any) => d.parts)
  },

  linkPart: async (equipmentId: string, partId: string): Promise<void> => {
    const { error } = await supabase
      .from('equipment_parts')
      .upsert({ equipment_id: equipmentId, part_id: partId }, { onConflict: 'equipment_id,part_id' })
    ensureNoError(error, 'Association piece equipement')
  },

  unlinkPart: async (equipmentId: string, partId: string): Promise<void> => {
    const { error } = await supabase
      .from('equipment_parts')
      .delete()
      .eq('equipment_id', equipmentId)
      .eq('part_id', partId)
    ensureNoError(error, 'Suppression association piece equipement')
  },
}

// ─── PIÈCES ──────────────────────────────────────────────────
export const partsApi = {
  getAll: async (): Promise<Part[]> => {
    const { data, error } = await supabase
      .from('parts')
      .select('*, equipment_parts(equipment_id, equipment:equipments(id,name))')
      .order('name')
    ensureNoError(error, 'Chargement pieces')
    return (data ?? []).map((row: any) => ({
      ...row,
      equipments: (row.equipment_parts ?? []).map((ep: any) => ep.equipment).filter(Boolean),
    }))
  },

  create: async (part: Omit<Partial<Part>, 'organization_id'>): Promise<Part | null> => {
    const { data, error } = await supabase
      .from('parts')
      .insert(part)
      .select()
      .single()
    ensureNoError(error, 'Creation piece')
    return data
  },

  update: async (id: string, updates: Partial<Part>): Promise<Part | null> => {
    const { data, error } = await supabase
      .from('parts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    ensureNoError(error, 'Mise a jour piece')
    return data
  },

  adjustStock: async (id: string, newQty: number): Promise<void> => {
    const { error } = await supabase
      .from('parts')
      .update({ qty: newQty })
      .eq('id', id)
    ensureNoError(error, 'Ajustement stock')
  },
}

// ─── INTERVENTIONS ───────────────────────────────────────────
export const interventionsApi = {
  getAll: async (): Promise<Intervention[]> => {
    const { data } = await supabase
      .from('interventions')
      .select(`
        *,
        equipment:equipments(*),
        technician:profiles!interventions_technician_id_fkey(*),
        creator:profiles!interventions_created_by_fkey(*),
        photos:intervention_photos(*),
        comments:intervention_comments(*, author:profiles(*)),
        parts_used:intervention_parts(*, part:parts(*))
      `)
      .order('created_at', { ascending: false })
    return data ?? []
  },

  getById: async (id: string): Promise<Intervention | null> => {
    const { data } = await supabase
      .from('interventions')
      .select(`
        *,
        equipment:equipments(*),
        technician:profiles!interventions_technician_id_fkey(*),
        creator:profiles!interventions_created_by_fkey(*),
        photos:intervention_photos(*),
        comments:intervention_comments(*, author:profiles(*)),
        parts_used:intervention_parts(*, part:parts(*))
      `)
      .eq('id', id)
      .single()
    return data
  },

  create: async (interv: Omit<Partial<Intervention>, 'organization_id'>): Promise<Intervention | null> => {
    const { data, error } = await supabase
      .from('interventions')
      .insert(interv)
      .select()
      .single()
    ensureNoError(error, 'Creation intervention')
    return data
  },

  updateStatus: async (id: string, status: string): Promise<void> => {
    const { error } = await supabase.from('interventions').update({ status }).eq('id', id)
    ensureNoError(error, 'Changement statut intervention')
  },

  submitReport: async (id: string, report: {
    actions: string; observations: string; duration: number
    verdict: string; hygiene: boolean; cleaning: boolean; signed_by: string
  }): Promise<void> => {
    const { error } = await supabase.from('interventions').update({
      report_actions:      report.actions,
      report_observations: report.observations,
      report_duration:     report.duration,
      report_verdict:      report.verdict,
      report_hygiene:      report.hygiene,
      report_cleaning:     report.cleaning,
      signed_by:           report.signed_by,
      signed_at:           new Date().toISOString(),
      status:              'termine',
    }).eq('id', id)
    ensureNoError(error, 'Soumission rapport intervention')
  },

  addComment: async (interventionId: string, text: string, authorId: string): Promise<InterventionComment | null> => {
    const { data, error } = await supabase
      .from('intervention_comments')
      .insert({ intervention_id: interventionId, text, author_id: authorId })
      .select('*, author:profiles(*)')
      .single()
    ensureNoError(error, 'Ajout commentaire intervention')
    return data
  },

  usePart: async (interventionId: string, partId: string, qty: number): Promise<void> => {
    const { error } = await supabase.from('intervention_parts').insert({
      intervention_id: interventionId, part_id: partId, qty_used: qty,
    })
    ensureNoError(error, 'Ajout piece utilisee')
  },
}

// ─── PHOTOS ──────────────────────────────────────────────────
export const photosApi = {
  upload: async (file: File, interventionId: string, userId: string): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const path = `${interventionId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { contentType: file.type })
    ensureNoError(error, 'Upload photo intervention')
    const { error: insertError } = await supabase.from('intervention_photos').insert({
      intervention_id: interventionId, url: path, filename: file.name, uploaded_by: userId,
    })
    ensureNoError(insertError, 'Enregistrement photo intervention')
    return path
  },
}

export const filesApi = {
  list: async (folder: string) => {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET).list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
    ensureNoError(error, `Liste fichiers ${folder}`)
    const files = (data ?? []).filter((item: any) => item.name && !item.id?.endsWith('/'))
    return Promise.all(files.map(async (item: any) => {
      const path = `${folder}/${item.name}`
      const { data: signed } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 3600)
      return { name: item.name, path, url: signed?.signedUrl || '', created_at: item.created_at || null, size: item.metadata?.size || null }
    }))
  },

  upload: async (folder: string, file: File) => {
    const path = `${folder}/${Date.now()}-${sanitizeFileName(file.name)}`
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false })
    ensureNoError(error, `Upload fichier ${path}`)
    return { path, url: '' }
  },
}

// ─── AUDIT ───────────────────────────────────────────────────
export const auditApi = {
  getAll: async (): Promise<AuditLog[]> => {
    const { data } = await supabase
      .from('audit_log')
      .select('*, user:profiles(*)')
      .order('created_at', { ascending: false })
      .limit(200)
    return data ?? []
  },

  log: async (userId: string, action: string, target: string, detail: string): Promise<void> => {
    const { error } = await supabase.from('audit_log').insert({ user_id: userId, action, target, detail })
    if (error) console.warn('[Audit] insertion ignoree', error.message)
  },
}

// ─── SITE CONFIG ─────────────────────────────────────────────
export const siteConfigApi = {
  get: async (): Promise<SiteConfig | null> => {
    const { data } = await supabase.from('site_config').select('*').single()
    return data
  },

  update: async (updates: Partial<SiteConfig>): Promise<void> => {
    const { error } = await supabase.from('site_config').update(updates).eq('id', 1)
    ensureNoError(error, 'Mise a jour configuration site')
  },
}

// ─── REALTIME ────────────────────────────────────────────────
export const subscribeToInterventions = (callback: (payload: any) => void) => {
  return supabase
    .channel('interventions_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'interventions' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'intervention_comments' }, callback)
    .subscribe()
}