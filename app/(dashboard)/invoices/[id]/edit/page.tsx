import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import InvoiceForm from '@/components/InvoiceForm'

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, items:invoice_items(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !invoice) {
    redirect('/invoices')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/invoices" className="text-gray-400 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Faturayı Düzenle</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {invoice.invoice_number} — değişiklikleri kaydetmeyi unutmayın
          </p>
        </div>
      </div>

      <InvoiceForm
        initialData={invoice}
        invoiceId={invoice.id}
        extractedFields={[]}
      />
    </div>
  )
}
