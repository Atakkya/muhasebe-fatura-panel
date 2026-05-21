'use client'

import { useState } from 'react'
import QrScanner from '@/components/QrScanner'
import FileUpload from '@/components/FileUpload'
import InvoiceForm from '@/components/InvoiceForm'
import { parseQrCode } from '@/lib/qr-parser'
import { ExtractedInvoiceData, Invoice } from '@/lib/types'

type Step = 'choose' | 'form'

export default function NewInvoicePage() {
  const [step, setStep] = useState<Step>('choose')
  const [showQr, setShowQr] = useState(false)
  const [initialData, setInitialData] = useState<Partial<Invoice>>({})
  const [extractedFields, setExtractedFields] = useState<(keyof Invoice)[]>([])
  const [source, setSource] = useState<'qr_scan' | 'file_upload' | 'manual'>('manual')

  function handleQrScan(raw: string) {
    setShowQr(false)
    const parsed = parseQrCode(raw)
    const data: Partial<Invoice> = {
      qr_raw_data: raw,
      source: 'qr_scan',
      ...(parsed.ettn ? { ettn: parsed.ettn } : {}),
    }
    setInitialData(data)
    setExtractedFields(parsed.ettn ? ['ettn'] : [])
    setSource('qr_scan')
    setStep('form')
  }

  function handleExtracted(data: ExtractedInvoiceData, src: 'file_upload') {
    const invoiceData: Partial<Invoice> = {
      source: src,
      invoice_number: data.invoice_number,
      invoice_date: data.invoice_date,
      due_date: data.due_date,
      ettn: data.ettn,
      seller_name: data.seller_name,
      seller_tax_id: data.seller_tax_id,
      seller_tax_office: data.seller_tax_office,
      seller_address: data.seller_address,
      buyer_name: data.buyer_name,
      buyer_tax_id: data.buyer_tax_id,
      buyer_tax_office: data.buyer_tax_office,
      buyer_address: data.buyer_address,
      currency: data.currency ?? 'TRY',
      subtotal: data.subtotal,
      vat_amount: data.vat_amount,
      total_amount: data.total_amount,
      items: data.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        vat_amount: item.quantity * item.unit_price * (item.vat_rate / 100),
        total_price: item.total_price,
      })),
    }

    // Track which fields were auto-extracted (non-null)
    const extracted = (Object.keys(invoiceData) as (keyof Invoice)[]).filter(
      k => k !== 'source' && k !== 'items' && invoiceData[k] != null
    )

    setInitialData(invoiceData)
    setExtractedFields(extracted)
    setSource(src)
    setStep('form')
  }

  if (step === 'form') {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStep('choose')} className="text-gray-500 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Yeni Fatura</h1>
            <p className="text-gray-500 text-sm">
              {source === 'file_upload' && 'Claude AI ile otomatik dolduruldu'}
              {source === 'qr_scan' && 'QR koddan alındı'}
              {source === 'manual' && 'Manuel giriş'}
            </p>
          </div>
        </div>
        <InvoiceForm initialData={initialData} extractedFields={extractedFields} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Yeni Fatura Ekle</h1>
        <p className="text-gray-500 text-sm mt-0.5">Faturayı nasıl eklemek istersiniz?</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* QR Scan */}
        <button
          onClick={() => setShowQr(true)}
          className="flex items-start gap-4 p-5 bg-[#141414] border border-[#222] hover:border-teal-800 rounded-xl text-left transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-teal-950 border border-teal-900 flex items-center justify-center flex-shrink-0 group-hover:border-teal-700">
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-white">QR Kod Tara</div>
            <div className="text-sm text-gray-500 mt-0.5">Kamera ile faturadaki QR kodu okut — ETTN/UUID otomatik alınır</div>
          </div>
        </button>

        {/* File Upload */}
        <div className="p-5 bg-[#141414] border border-[#222] rounded-xl">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-950 border border-purple-900 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-white">PDF / Görsel Yükle</div>
              <div className="text-sm text-gray-500 mt-0.5">Claude AI tüm fatura bilgilerini otomatik çıkarır</div>
            </div>
          </div>
          <FileUpload onExtracted={handleExtracted} />
        </div>

        {/* Manual */}
        <button
          onClick={() => setStep('form')}
          className="flex items-start gap-4 p-5 bg-[#141414] border border-[#222] hover:border-[#444] rounded-xl text-left transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] border border-[#333] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-white">Manuel Giriş</div>
            <div className="text-sm text-gray-500 mt-0.5">Tüm alanları kendiniz doldurun</div>
          </div>
        </button>
      </div>

      {showQr && <QrScanner onScan={handleQrScan} onClose={() => setShowQr(false)} />}
    </div>
  )
}
