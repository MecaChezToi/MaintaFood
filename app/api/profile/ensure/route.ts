import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    return NextResponse.json({ error: 'Configuration serveur manquante (SUPABASE_SERVICE_ROLE_KEY).' }, { status: 500 })
  }

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null

  if (!token) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData.user) return NextResponse.json({ error: 'Session invalide.' }, { status: 401 })

  const u = authData.user
  const name =
    String((u.user_metadata as any)?.name || '').trim()
    || (u.email ? u.email.split('@')[0] : 'Utilisateur')

  const row = {
    id: u.id,
    name,
    role: 'technician',
    avatar: initials(name),
    color: '#3c82e8',
    active: true,
  }

  const { data: existing } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
  if (existing) return NextResponse.json(existing)

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert(row)
    .select('*')
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })
  return NextResponse.json(inserted)
}

