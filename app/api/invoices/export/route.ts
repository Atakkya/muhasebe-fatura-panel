import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const ids: string[] | undefined = body.ids

  let query = supabase
    .from('invoices')
    .select('*, items:invoice_items(*)')
    .eq('user_id', user.id)
    .order('invoice_date', { ascending: false })

  if (ids && ids.length > 0) {
    query = query.in('id', ids)
  }

  const { data, error } = await query

  if (error) {
    console.error('Export query error:', error)
    return NextResponse.json({ error: 'Veri çekilemedi' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
