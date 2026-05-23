import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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
