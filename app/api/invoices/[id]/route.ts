import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PartyType } from '@/lib/types'

async function findOrCreateParty(
  supabase: SupabaseClient,
  userId: string,
  taxId: string | null | undefined,
  name: string | null | undefined,
  taxOffice: string | null | undefined,
  address: string | null | undefined
): Promise<string | null> {
  if (!taxId || !name) return null

  const { data: existing } = await supabase
    .from('parties')
    .select('id')
    .eq('user_id', userId)
    .eq('tax_id', taxId)
    .maybeSingle()

  if (existing) return existing.id

  const partyType: PartyType = taxId.length === 11 ? 'individual' : 'corporate'

  const { data: created, error } = await supabase
    .from('parties')
    .insert({
      user_id: userId,
      party_type: partyType,
      tax_id: taxId,
      name,
      tax_office: taxOffice ?? null,
      address: address ?? null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Party create error:', error)
    return null
  }
  return created.id
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const { items, ...invoiceData } = body

  const sellerPartyId = await findOrCreateParty(
    supabase, user.id,
    body.seller_tax_id, body.seller_name, body.seller_tax_office, body.seller_address
  )
  const buyerPartyId = await findOrCreateParty(
    supabase, user.id,
    body.buyer_tax_id, body.buyer_name, body.buyer_tax_office, body.buyer_address
  )

  const { data, error } = await supabase
    .from('invoices')
    .update({ ...invoiceData, seller_party_id: sellerPartyId, buyer_party_id: buyerPartyId })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items !== undefined) {
    await supabase.from('invoice_items').delete().eq('invoice_id', id)
    if (items.length) {
      await supabase.from('invoice_items').insert(
        items.map((item: object, i: number) => ({ ...item, invoice_id: id, sort_order: i }))
      )
    }
  }

  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  await supabase.from('invoice_items').delete().eq('invoice_id', id)

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Fatura silinemedi' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
