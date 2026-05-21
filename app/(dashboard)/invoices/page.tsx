import { createServerSupabaseClient } from '@/lib/supabase-server'
import InvoiceList from '@/components/InvoiceList'

export default async function InvoicesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Faturalar</h1>
        <p className="text-gray-500 text-sm mt-0.5">Tüm alış ve satış faturalarınız</p>
      </div>
      <InvoiceList invoices={invoices ?? []} />
    </div>
  )
}
