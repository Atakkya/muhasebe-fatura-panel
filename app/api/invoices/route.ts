import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const q = searchParams.get('q')

  let query = supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (type) query = query.eq('invoice_type', type)
  if (q) query = query.or(`invoice_number.ilike.%${q}%,seller_name.ilike.%${q}%,buyer_name.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const { items, ...invoiceData } = body

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({ ...invoiceData, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items?.length) {
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(items.map((item: object, i: number) => ({ ...item, invoice_id: invoice.id, sort_order: i })))
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({ data: invoice }, { status: 201 })
}
