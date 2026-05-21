'use client'

import { useState } from 'react'
import { Invoice, InvoiceItem, AUTO_EXTRACTED_FIELDS, MANUAL_REQUIRED_FIELDS } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface Props {
  initialData?: Partial<Invoice>
  extractedFields?: (keyof Invoice)[]
  invoiceId?: string
}

const emptyInvoice = (): Partial<Invoice> => ({
  invoice_number: null, invoice_date: null, due_date: null, ettn: null,
  seller_name: null, seller_tax_id: null, seller_tax_office: null, seller_address: null,
  buyer_name: null, buyer_tax_id: null, buyer_tax_office: null, buyer_address: null,
  currency: 'TRY', subtotal: null, vat_amount: null, total_amount: null,
  source: 'manual', qr_raw_data: null, file_url: null,
  invoice_type: null, accounting_code: null, cost_center: null, project_code: null,
  payment_status: 'pending', payment_date: null, vat_deductible: true,
  notes: null, category: null, status: 'draft',
})

const emptyItem = (): InvoiceItem => ({
  description: '', quantity: 1, unit_price: 0, vat_rate: 20, vat_amount: 0, total_price: 0,
})

function fmtMoney(n: number) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function calcItem(item: InvoiceItem): InvoiceItem {
  const base = item.quantity * item.unit_price
  const vat = base * (item.vat_rate / 100)
  return { ...item, vat_amount: vat, total_price: base + vat }
}

export default function InvoiceForm({ initialData, extractedFields = [], invoiceId }: Props) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<Partial<Invoice>>({ ...emptyInvoice(), ...initialData })
  const [items, setItems] = useState<InvoiceItem[]>(
    (initialData?.items as InvoiceItem[]) ?? [emptyItem()]
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isExtracted = (field: keyof Invoice) =>
    extractedFields.includes(field) || (AUTO_EXTRACTED_FIELDS.includes(field) && initialData?.[field] != null)

  const isManualRequired = (field: keyof Invoice) => MANUAL_REQUIRED_FIELDS.includes(field)

  function fieldClass(field: keyof Invoice) {
    if (isManualRequired(field) && !invoice[field]) {
      return 'border-orange-500 bg-orange-950/10 focus:border-orange-400'
    }
    if (isExtracted(field)) {
      return 'border-green-800 bg-green-950/10 focus:border-green-500'
    }
    return 'border-[#333] bg-[#1a1a1a] focus:border-teal-500'
  }

  function labelExtra(field: keyof Invoice) {
    if (isManualRequired(field) && !invoice[field]) {
      return <span className="text-orange-400 text-xs ml-1">* Manuel gerekli</span>
    }
    if (isExtracted(field)) {
      return <span className="text-green-600 text-xs ml-1">✓ Otomatik</span>
    }
    return null
  }

  function set(field: keyof Invoice, value: unknown) {
    setInvoice(prev => ({ ...prev, [field]: value }))
  }

  function updateItem(idx: number, field: keyof InvoiceItem, value: string | number) {
    setItems(prev => {
      const updated = [...prev]
      updated[idx] = calcItem({ ...updated[idx], [field]: value })
      return updated
    })
  }

  function addItem() { setItems(prev => [...prev, emptyItem()]) }
  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const vatTotal = items.reduce((s, i) => s + i.vat_amount, 0)
  const grandTotal = subtotal + vatTotal

  async function handleSave(confirmStatus?: 'confirmed') {
    setSaving(true)
    setError('')

    const payload = {
      ...invoice,
      subtotal, vat_amount: vatTotal, total_amount: grandTotal,
      status: confirmStatus ?? invoice.status ?? 'draft',
      items: items.map((item, i) => ({ ...item, sort_order: i })),
    }

    const url = invoiceId ? `/api/invoices/${invoiceId}` : '/api/invoices'
    const method = invoiceId ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Kayıt başarısız')
      setSaving(false)
      return
    }

    router.push('/invoices')
    router.refresh()
  }

  const inputBase = 'w-full rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none transition-colors'

  return (
    <div className="space-y-5">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-green-700 bg-green-950/30 inline-block" />
          Otomatik çekildi
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-orange-500 bg-orange-950/20 inline-block" />
          Manuel girilmesi zorunlu
        </span>
      </div>

      {/* Invoice info */}
      <Section title="Fatura Bilgileri">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fatura No" extra={labelExtra('invoice_number')}>
            <input className={`${inputBase} ${fieldClass('invoice_number')}`}
              value={invoice.invoice_number ?? ''} onChange={e => set('invoice_number', e.target.value || null)}
              placeholder="FTR-2026-001" />
          </Field>
          <Field label="Fatura Tarihi" extra={labelExtra('invoice_date')}>
            <input type="date" className={`${inputBase} ${fieldClass('invoice_date')}`}
              value={invoice.invoice_date ?? ''} onChange={e => set('invoice_date', e.target.value || null)} />
          </Field>
          <Field label="Vade Tarihi" extra={labelExtra('due_date')}>
            <input type="date" className={`${inputBase} ${fieldClass('due_date')}`}
              value={invoice.due_date ?? ''} onChange={e => set('due_date', e.target.value || null)} />
          </Field>
          <Field label="ETTN/UUID" extra={labelExtra('ettn')}>
            <input className={`${inputBase} ${fieldClass('ettn')} font-mono text-xs`}
              value={invoice.ettn ?? ''} onChange={e => set('ettn', e.target.value || null)}
              placeholder="GİB e-fatura UUID" />
          </Field>
        </div>
      </Section>

      {/* Seller */}
      <Section title="Satıcı Bilgileri">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Satıcı Adı" extra={labelExtra('seller_name')} className="col-span-2">
            <input className={`${inputBase} ${fieldClass('seller_name')}`}
              value={invoice.seller_name ?? ''} onChange={e => set('seller_name', e.target.value || null)}
              placeholder="Şirket veya kişi adı" />
          </Field>
          <Field label="Vergi No" extra={labelExtra('seller_tax_id')}>
            <input className={`${inputBase} ${fieldClass('seller_tax_id')}`}
              value={invoice.seller_tax_id ?? ''} onChange={e => set('seller_tax_id', e.target.value || null)}
              placeholder="VKN / TCKN" />
          </Field>
          <Field label="Vergi Dairesi" extra={labelExtra('seller_tax_office')}>
            <input className={`${inputBase} ${fieldClass('seller_tax_office')}`}
              value={invoice.seller_tax_office ?? ''} onChange={e => set('seller_tax_office', e.target.value || null)}
              placeholder="Beşiktaş VD" />
          </Field>
          <Field label="Adres" extra={labelExtra('seller_address')} className="col-span-2">
            <textarea className={`${inputBase} ${fieldClass('seller_address')} resize-none`} rows={2}
              value={invoice.seller_address ?? ''} onChange={e => set('seller_address', e.target.value || null)}
              placeholder="Tam adres" />
          </Field>
        </div>
      </Section>

      {/* Buyer */}
      <Section title="Alıcı Bilgileri">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Alıcı Adı" extra={labelExtra('buyer_name')} className="col-span-2">
            <input className={`${inputBase} ${fieldClass('buyer_name')}`}
              value={invoice.buyer_name ?? ''} onChange={e => set('buyer_name', e.target.value || null)}
              placeholder="Şirket veya kişi adı" />
          </Field>
          <Field label="Vergi No" extra={labelExtra('buyer_tax_id')}>
            <input className={`${inputBase} ${fieldClass('buyer_tax_id')}`}
              value={invoice.buyer_tax_id ?? ''} onChange={e => set('buyer_tax_id', e.target.value || null)}
              placeholder="VKN / TCKN" />
          </Field>
          <Field label="Vergi Dairesi" extra={labelExtra('buyer_tax_office')}>
            <input className={`${inputBase} ${fieldClass('buyer_tax_office')}`}
              value={invoice.buyer_tax_office ?? ''} onChange={e => set('buyer_tax_office', e.target.value || null)}
              placeholder="Kadıköy VD" />
          </Field>
        </div>
      </Section>

      {/* Items */}
      <Section title="Kalemler">
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-1 text-xs text-gray-500 px-1">
            <span className="col-span-4">Açıklama</span>
            <span className="col-span-2">Miktar</span>
            <span className="col-span-2">Birim Fiyat</span>
            <span className="col-span-2">KDV %</span>
            <span className="col-span-1 text-right">Toplam</span>
            <span className="col-span-1" />
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-1 items-center">
              <input
                className={`${inputBase} border border-[#333] bg-[#1a1a1a] col-span-4`}
                value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                placeholder="Açıklama"
              />
              <input type="number" min={0} step="0.01"
                className={`${inputBase} border border-[#333] bg-[#1a1a1a] col-span-2`}
                value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} />
              <input type="number" min={0} step="0.01"
                className={`${inputBase} border border-[#333] bg-[#1a1a1a] col-span-2`}
                value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} />
              <select
                className={`${inputBase} border border-[#333] bg-[#1a1a1a] col-span-2`}
                value={item.vat_rate} onChange={e => updateItem(idx, 'vat_rate', parseInt(e.target.value))}>
                {[0, 1, 8, 10, 20].map(r => <option key={r} value={r}>%{r}</option>)}
              </select>
              <span className="col-span-1 text-right text-sm text-white font-medium">
                {fmtMoney(item.total_price)}
              </span>
              <button onClick={() => removeItem(idx)} className="col-span-1 flex justify-center text-gray-600 hover:text-red-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          <button onClick={addItem} className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1 mt-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Kalem Ekle
          </button>

          <div className="border-t border-[#222] pt-3 mt-3 space-y-1 text-sm text-right">
            <div className="flex justify-between text-gray-400">
              <span>Ara Toplam</span><span>{fmtMoney(subtotal)} ₺</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>KDV</span><span>{fmtMoney(vatTotal)} ₺</span>
            </div>
            <div className="flex justify-between text-white font-bold text-base border-t border-[#333] pt-2">
              <span>Genel Toplam</span><span>{fmtMoney(grandTotal)} ₺</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Manual required fields */}
      <Section title="Muhasebe Bilgileri">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fatura Türü" extra={labelExtra('invoice_type')}>
            <select className={`${inputBase} ${fieldClass('invoice_type')}`}
              value={invoice.invoice_type ?? ''} onChange={e => set('invoice_type', e.target.value || null)}>
              <option value="">Seçin...</option>
              <option value="purchase">Alış Faturası</option>
              <option value="sale">Satış Faturası</option>
            </select>
          </Field>
          <Field label="Muhasebe Hesap Kodu" extra={labelExtra('accounting_code')}>
            <input className={`${inputBase} ${fieldClass('accounting_code')}`}
              value={invoice.accounting_code ?? ''} onChange={e => set('accounting_code', e.target.value || null)}
              placeholder="320, 153.01.001..." />
          </Field>
          <Field label="KDV İndirilebilir">
            <div className="flex items-center gap-3 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={invoice.vat_deductible === true}
                  onChange={() => set('vat_deductible', true)}
                  className="accent-teal-500" />
                <span className="text-sm text-gray-300">Evet</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={invoice.vat_deductible === false}
                  onChange={() => set('vat_deductible', false)}
                  className="accent-teal-500" />
                <span className="text-sm text-gray-300">Hayır</span>
              </label>
            </div>
          </Field>
          <Field label="Ödeme Durumu">
            <select className={`${inputBase} border border-[#333] bg-[#1a1a1a] focus:border-teal-500`}
              value={invoice.payment_status ?? 'pending'} onChange={e => set('payment_status', e.target.value)}>
              <option value="pending">Bekliyor</option>
              <option value="paid">Ödendi</option>
              <option value="overdue">Gecikmiş</option>
            </select>
          </Field>
          <Field label="Maliyet Merkezi">
            <input className={`${inputBase} border border-[#333] bg-[#1a1a1a] focus:border-teal-500`}
              value={invoice.cost_center ?? ''} onChange={e => set('cost_center', e.target.value || null)}
              placeholder="Opsiyonel" />
          </Field>
          <Field label="Proje Kodu">
            <input className={`${inputBase} border border-[#333] bg-[#1a1a1a] focus:border-teal-500`}
              value={invoice.project_code ?? ''} onChange={e => set('project_code', e.target.value || null)}
              placeholder="Opsiyonel" />
          </Field>
          <Field label="Notlar" className="col-span-2">
            <textarea className={`${inputBase} border border-[#333] bg-[#1a1a1a] focus:border-teal-500 resize-none`}
              rows={2} value={invoice.notes ?? ''} onChange={e => set('notes', e.target.value || null)} />
          </Field>
        </div>
      </Section>

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-lg px-3 py-2 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <button onClick={() => router.back()}
          className="px-4 py-2 rounded-lg border border-[#333] text-gray-400 hover:text-white text-sm transition-colors">
          İptal
        </button>
        <button onClick={() => handleSave()} disabled={saving}
          className="px-4 py-2 rounded-lg border border-[#333] text-gray-300 hover:bg-[#222] text-sm transition-colors disabled:opacity-50">
          {saving ? 'Kaydediliyor...' : 'Taslak Kaydet'}
        </button>
        <button onClick={() => handleSave('confirmed')} disabled={saving}
          className="px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? 'Kaydediliyor...' : 'Onayla & Kaydet'}
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#141414] border border-[#222] rounded-xl p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, extra, children, className = '' }: {
  label: string; extra?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-xs text-gray-500 mb-1 flex items-center">
        {label}{extra}
      </label>
      {children}
    </div>
  )
}
