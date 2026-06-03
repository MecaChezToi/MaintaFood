import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const pickColor = (seed: string) => {
  const colors = ['#00c896', '#3c82e8', '#a855f7', '#e8643c', '#f59e0b', '#ff4757']
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return colors[h % colors.length]
}

const initials = (name: string) => {
  const clean = name.trim().replace(/\s+/g, ' ')
  if (!clean) return 'U'
  const parts = clean.split(' ')
  const a = parts[0]?.[0] || 'U'
  const b = parts.length > 1 ? (parts[1]?.[0] || '') : (parts[0]?.[1] || '')
  return (a + b).toUpperCase()
}

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return NextResponse.json({ error: 'Configuration serveur manquante.' }, { status: 500 })
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  // Vérifier l'authentification
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData.user) return NextResponse.json({ error: 'Session invalide.' }, { status: 401 })

  // Vérifier que le requérant est admin DE LA MÊME organisation
  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', authData.user.id)
    .maybeSingle()

  if (requesterProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé — admin requis.' }, { status: 403 })
  }

  const orgId = requesterProfile.organization_id

  // Valider le body
  const body = await req.json().catch(() => null) as any
  const email    = String(body?.email    || '').trim().toLowerCase()
  const password = String(body?.password || '')
  const name     = String(body?.name     || '').trim()
  const role     = String(body?.role     || 'technician')

  if (!email || !email.includes('@'))   return NextResponse.json({ error: 'Email invalide.' }, { status: 400 })
  if (!password || password.length < 6) return NextResponse.json({ error: 'Mot de passe trop court (min 6 car.).' }, { status: 400 })
  if (!name)                            return NextResponse.json({ error: 'Nom requis.' }, { status: 400 })
  if (!['admin', 'chef', 'technician'].includes(role)) return NextResponse.json({ error: 'Rôle invalide.' }, { status: 400 })

  // Vérifier si l'email existe déjà
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const alreadyExists = existingUsers?.users?.find(u => u.email === email)

  let userId: string

  if (alreadyExists) {
    userId = alreadyExists.id
  } else {
    // Créer le compte Auth — passer organization_id dans les metadata
    // pour que le trigger handle_new_user l'utilise
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, organization_id: orgId },
    })

    if (createError || !created.user?.id) {
      return NextResponse.json(
        { error: createError?.message || 'Création utilisateur échouée.' },
        { status: 400 }
      )
    }
    userId = created.user.id
  }

  const avatar = initials(name)
  const color  = pickColor(name)

  // Upsert profil avec organization_id
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    name,
    role,
    avatar,
    color,
    active: true,
    organization_id: orgId,
  }, { onConflict: 'id' })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  // S'assurer que le membre est bien dans organization_members
  await supabase.from('organization_members').upsert({
    organization_id: orgId,
    user_id: userId,
    role,
  }, { onConflict: 'organization_id,user_id' })

  return NextResponse.json({ id: userId })
}
