import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import InvoiceForm from '@/components/InvoiceForm'
import Link from 'next/link'

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!invoice) notFound()

  const { invoice_items: items, ...invoiceData } = invoice
  const initialData = { ...invoiceData, items: items ?? [] }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/invoices" className="text-gray-400 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {invoice.invoice_number ?? 'Fatura Detayı'}
          </h1>
          <p className="text-gray-500 text-sm">
            {invoice.source === 'file_upload' && 'PDF\'den otomatik okundu'}
            {invoice.source === 'qr_scan' && 'QR koddan alındı'}
            {invoice.source === 'manual' && 'Manuel giriş'}
            {invoice.status === 'confirmed' && ' · Onaylandı'}
          </p>
        </div>
      </div>

      <InvoiceForm initialData={initialData} invoiceId={id} />
    </div>
  )
}
