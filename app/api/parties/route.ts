import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: parties, error } = await supabase
    .from('parties')
    .select(`
      *,
      sold_invoices:invoices!seller_party_id(total_amount, invoice_type),
      bought_invoices:invoices!buyer_party_id(total_amount, invoice_type)
    `)
    .eq('user_id', user.id)
    .order('name')

  if (error) {
    console.error('Parties query error:', error)
    return NextResponse.json({ error: 'Veri çekilemedi' }, { status: 500 })
  }

  const withBalance = (parties ?? []).map((p) => {
    const soldInvoices = (p.sold_invoices ?? []) as Array<{ total_amount: number; invoice_type: string }>
    const boughtInvoices = (p.bought_invoices ?? []) as Array<{ total_amount: number; invoice_type: string }>

    const totalPurchase = soldInvoices.reduce((s, i) => s + (i.total_amount ?? 0), 0)
    const totalSale = boughtInvoices.reduce((s, i) => s + (i.total_amount ?? 0), 0)

    return {
      ...p,
      invoice_count: soldInvoices.length + boughtInvoices.length,
      total_purchase: totalPurchase,
      total_sale: totalSale,
      balance: totalSale - totalPurchase,
      sold_invoices: undefined,
      bought_invoices: undefined,
    }
  })

  return NextResponse.json({ data: withBalance })
}
