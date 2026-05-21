import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

function fmtMoney(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(n) + ' ₺'
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, invoice_date, seller_name, buyer_name, total_amount, invoice_type, payment_status, status, source, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: stats } = await supabase
    .from('invoices')
    .select('invoice_type, payment_status, total_amount')
    .eq('user_id', user!.id)

  const purchases = stats?.filter(i => i.invoice_type === 'purchase') ?? []
  const sales = stats?.filter(i => i.invoice_type === 'sale') ?? []
  const pending = stats?.filter(i => i.payment_status === 'pending') ?? []

  const totalPurchase = purchases.reduce((s, i) => s + (i.total_amount ?? 0), 0)
  const totalSales = sales.reduce((s, i) => s + (i.total_amount ?? 0), 0)
  const totalPending = pending.reduce((s, i) => s + (i.total_amount ?? 0), 0)

  const statusColors: Record<string, string> = {
    pending: 'text-amber-400 bg-amber-950/40',
    paid: 'text-green-400 bg-green-950/40',
    overdue: 'text-red-400 bg-red-950/40',
  }
  const statusLabels: Record<string, string> = {
    pending: 'Bekliyor', paid: 'Ödendi', overdue: 'Gecikmiş',
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Genel Bakış</h1>
          <p className="text-gray-500 text-sm mt-0.5">Muhasebe durumunuz</p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Fatura
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#141414] border border-[#222] rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Toplam Alış</div>
          <div className="text-xl font-bold text-white">{fmtMoney(totalPurchase)}</div>
          <div className="text-xs text-gray-600 mt-1">{purchases.length} fatura</div>
        </div>
        <div className="bg-[#141414] border border-[#222] rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Toplam Satış</div>
          <div className="text-xl font-bold text-teal-400">{fmtMoney(totalSales)}</div>
          <div className="text-xs text-gray-600 mt-1">{sales.length} fatura</div>
        </div>
        <div className="bg-[#141414] border border-[#222] rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Bekleyen Ödeme</div>
          <div className="text-xl font-bold text-amber-400">{fmtMoney(totalPending)}</div>
          <div className="text-xs text-gray-600 mt-1">{pending.length} fatura</div>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="bg-[#141414] border border-[#222] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
          <span className="text-sm font-medium text-white">Son Faturalar</span>
          <Link href="/invoices" className="text-xs text-teal-400 hover:text-teal-300">Tümünü gör</Link>
        </div>

        {!invoices?.length ? (
          <div className="py-12 text-center text-gray-600">
            <p className="mb-3">Henüz fatura yok</p>
            <Link href="/invoices/new" className="text-teal-400 hover:text-teal-300 text-sm">
              İlk faturanı ekle →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {['Fatura No', 'Taraf', 'Tür', 'Tutar', 'Durum'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-4 py-2.5">
                    <Link href={`/invoices/${inv.id}`} className="text-teal-400 hover:text-teal-300 font-mono text-xs">
                      {inv.invoice_number ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-300">
                    {inv.invoice_type === 'purchase' ? inv.seller_name : inv.buyer_name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${inv.invoice_type === 'purchase' ? 'text-blue-400 bg-blue-950/40' : 'text-purple-400 bg-purple-950/40'}`}>
                      {inv.invoice_type === 'purchase' ? 'Alış' : 'Satış'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-white font-medium">{fmtMoney(inv.total_amount)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[inv.payment_status] ?? ''}`}>
                      {statusLabels[inv.payment_status] ?? inv.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
