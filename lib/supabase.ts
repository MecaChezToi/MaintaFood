import { createClient } from '@supabase/supabase-js'
import type {
  Profile, Equipment, Part, Intervention,
  InterventionComment, InterventionPhoto, InterventionPart,
  AuditLog, SiteConfig
} from '@/types'

// ─── CLIENT ─────────────────────────────────────────────────
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

// ─── PROFILS ─────────────────────────────────────────────────
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

  getCurrent: async (): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    return data
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

  create: async (eq: Partial<Equipment>): Promise<Equipment | null> => {
    const { data } = await supabase
      .from('equipments')
      .insert(eq)
      .select()
      .single()
    return data
  },

  update: async (id: string, updates: Partial<Equipment>): Promise<Equipment | null> => {
    const { data } = await supabase
      .from('equipments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return data
  },

  // Récupérer les pièces compatibles d'un équipement
  getParts: async (equipmentId: string): Promise<Part[]> => {
    const { data } = await supabase
      .from('equipment_parts')
      .select('parts(*)')
      .eq('equipment_id', equipmentId)
    return (data ?? []).map((d: any) => d.parts)
  },
}

// ─── PIÈCES ──────────────────────────────────────────────────
export const partsApi = {
  getAll: async (): Promise<Part[]> => {
    const { data } = await supabase
      .from('parts')
      .select('*')
      .order('name')
    return data ?? []
  },

  create: async (part: Partial<Part>): Promise<Part | null> => {
    const { data } = await supabase
      .from('parts')
      .insert(part)
      .select()
      .single()
    return data
  },

  update: async (id: string, updates: Partial<Part>): Promise<Part | null> => {
    const { data } = await supabase
      .from('parts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return data
  },

  adjustStock: async (id: string, newQty: number): Promise<void> => {
    await supabase
      .from('parts')
      .update({ qty: newQty })
      .eq('id', id)
  },
}

// ─── INTERVENTIONS ───────────────────────────────────────────
export const interventionsApi = {
  // Toutes les interventions (admin/chef) ou les siennes (technicien)
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

  create: async (interv: Partial<Intervention>): Promise<Intervention | null> => {
    const { data } = await supabase
      .from('interventions')
      .insert(interv)
      .select()
      .single()
    return data
  },

  updateStatus: async (id: string, status: string): Promise<void> => {
    await supabase.from('interventions').update({ status }).eq('id', id)
  },

  // Sauvegarder le rapport complet + signer
  submitReport: async (id: string, report: {
    actions: string
    observations: string
    duration: number
    verdict: string
    hygiene: boolean
    cleaning: boolean
    signed_by: string
  }): Promise<void> => {
    await supabase.from('interventions').update({
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
  },

  // Ajouter un commentaire
  addComment: async (interventionId: string, text: string, authorId: string): Promise<InterventionComment | null> => {
    const { data } = await supabase
      .from('intervention_comments')
      .insert({ intervention_id: interventionId, text, author_id: authorId })
      .select('*, author:profiles(*)')
      .single()
    return data
  },

  // Utiliser une pièce (déduit le stock via trigger)
  usePart: async (interventionId: string, partId: string, qty: number): Promise<void> => {
    await supabase.from('intervention_parts').insert({
      intervention_id: interventionId,
      part_id: partId,
      qty_used: qty,
    })
  },
}

// ─── PHOTOS ──────────────────────────────────────────────────
export const photosApi = {
  // Upload photo vers Supabase Storage
  upload: async (file: File, interventionId: string, userId: string): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const path = `${interventionId}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('intervention-photos')
      .upload(path, file, { contentType: file.type })

    if (error) { console.error(error); return null }

    const { data: urlData } = supabase.storage
      .from('intervention-photos')
      .getPublicUrl(path)

    // Enregistrer en base
    await supabase.from('intervention_photos').insert({
      intervention_id: interventionId,
      url: urlData.publicUrl,
      filename: file.name,
      uploaded_by: userId,
    })

    return urlData.publicUrl
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
    await supabase.from('audit_log').insert({ user_id: userId, action, target, detail })
  },
}

// ─── SITE CONFIG ─────────────────────────────────────────────
export const siteConfigApi = {
  get: async (): Promise<SiteConfig | null> => {
    const { data } = await supabase.from('site_config').select('*').single()
    return data
  },

  update: async (updates: Partial<SiteConfig>): Promise<void> => {
    await supabase.from('site_config').update(updates).eq('id', 1)
  },
}

// ─── REALTIME ────────────────────────────────────────────────
// Écoute les changements en temps réel sur les interventions
export const subscribeToInterventions = (callback: (payload: any) => void) => {
  return supabase
    .channel('interventions_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'interventions' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'intervention_comments' }, callback)
    .subscribe()
}
