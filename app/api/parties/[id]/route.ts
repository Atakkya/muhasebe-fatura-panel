import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()

  const { data, error } = await supabase
    .from('parties')
    .update({
      name: body.name,
      party_type: body.party_type,
      tax_id: body.tax_id,
      tax_office: body.tax_office ?? null,
      address: body.address ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      iban: body.iban ?? null,
      notes: body.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Party update error:', error)
    return NextResponse.json({ error: 'Cari güncellenemedi' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  await supabase
    .from('invoices')
    .update({ seller_party_id: null })
    .eq('seller_party_id', id)
    .eq('user_id', user.id)

  await supabase
    .from('invoices')
    .update({ buyer_party_id: null })
    .eq('buyer_party_id', id)
    .eq('user_id', user.id)

  const { error } = await supabase
    .from('parties')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Party delete error:', error)
    return NextResponse.json({ error: 'Cari silinemedi' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: party, error } = await supabase
    .from('parties')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !party) {
    return NextResponse.json({ error: 'Cari bulunamadı' }, { status: 404 })
  }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, invoice_date, total_amount, vat_amount, status, seller_party_id, buyer_party_id')
    .or(`seller_party_id.eq.${id},buyer_party_id.eq.${id}`)
    .eq('user_id', user.id)
    .order('invoice_date', { ascending: false })

  return NextResponse.json({ data: { party, invoices: invoices ?? [] } })
}
