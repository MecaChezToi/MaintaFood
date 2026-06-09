import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

async function authenticate(req: NextRequest, supabase: any) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', data.user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') return null
  return profile
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getAdminClient()
  if (!supabase) return NextResponse.json({ error: 'Configuration serveur manquante.' }, { status: 500 })

  const requester = await authenticate(req, supabase)
  if (!requester) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const name = String(body?.name || '').trim()
  const role = String(body?.role || '')

  if (!name) return NextResponse.json({ error: 'Nom requis.' }, { status: 400 })
  if (!['admin', 'chef', 'technician'].includes(role)) return NextResponse.json({ error: 'Rôle invalide.' }, { status: 400 })

  // Vérifier que le user cible est dans la même organisation
  const { data: target } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', params.id)
    .maybeSingle()

  if (target?.organization_id !== requester.organization_id) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ name, role })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Sync organization_members
  await supabase
    .from('organization_members')
    .update({ role })
    .eq('user_id', params.id)
    .eq('organization_id', requester.organization_id)

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getAdminClient()
  if (!supabase) return NextResponse.json({ error: 'Configuration serveur manquante.' }, { status: 500 })

  const requester = await authenticate(req, supabase)
  if (!requester) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

  // Vérifier même organisation
  const { data: target } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', params.id)
    .maybeSingle()

  if (target?.organization_id !== requester.organization_id) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
  }

  // Supprimer le compte Auth (cascade sur profiles via trigger)
  const { error } = await supabase.auth.admin.deleteUser(params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
