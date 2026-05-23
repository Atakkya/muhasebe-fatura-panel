'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Party } from '@/lib/types'

interface InvoiceRow {
  id: string
  invoice_number: string | null
  invoice_date: string | null
  total_amount: number | null
  vat_amount: number | null
  status: string
  seller_party_id: string | null
  buyer_party_id: string | null
}

function fmt(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm text-gray-200 mt-0.5">{value}</div>
    </div>
  )
}

export default function PartyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [party, setParty] = useState<Party | null>(null)
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/parties/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setParty(d.data.party)
          setInvoices(d.data.invoices)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-8 text-gray-500 text-sm">Yükleniyor...</div>
  if (!party) return <div className="p-8 text-red-400 text-sm">Cari bulunamadı.</div>

  const totalPurchase = invoices
    .filter((i) => i.seller_party_id === id)
    .reduce((s, i) => s + (i.total_amount ?? 0), 0)
  const totalSale = invoices
    .filter((i) => i.buyer_party_id === id)
    .reduce((s, i) => s + (i.total_amount ?? 0), 0)
  const balance = totalSale - totalPurchase

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/parties" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
          ← Cariler
        </Link>
        <button
          disabled
          className="text-xs px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-gray-600 cursor-not-allowed"
        >
          Düzenle
        </button>
      </div>

      {/* Cari bilgileri kartı */}
      <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-6 mb-4">
        <div className="flex items-start gap-4 mb-5">
          <div>
            <h1 className="text-xl font-bold text-white">{party.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${party.party_type === 'corporate' ? 'bg-blue-950 text-blue-300' : 'bg-purple-950 text-purple-300'}`}>
                {party.party_type === 'corporate' ? 'Firma' : 'Şahıs'}
              </span>
              <span className="text-gray-500 font-mono text-xs">{party.tax_id}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Vergi Dairesi" value={party.tax_office} />
          <Field label="Adres" value={party.address} />
          <Field label="Telefon" value={party.phone} />
          <Field label="E-posta" value={party.email} />
          <Field label="IBAN" value={party.iban} />
          <Field label="Notlar" value={party.notes} />
        </div>
      </div>

      {/* Bakiye kartı */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Borç (Alış)</div>
          <div className="text-xl font-bold text-red-400">{fmt(totalPurchase)} ₺</div>
        </div>
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Alacak (Satış)</div>
          <div className="text-xl font-bold text-teal-400">{fmt(totalSale)} ₺</div>
        </div>
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Net Bakiye</div>
          <div className={`text-xl font-bold ${balance >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
            {balance >= 0 ? '+' : ''}{fmt(balance)} ₺
          </div>
        </div>
      </div>

      {/* Fatura listesi */}
      <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#1a1a1a]">
          <h2 className="text-sm font-semibold text-gray-300">Faturalar ({invoices.length})</h2>
        </div>
        {invoices.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-600">Bu cariye ait fatura yok.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                <th className="px-4 py-3 text-left text-gray-500 font-medium">Fatura No</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">Tarih</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">Tip</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">Tutar</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const isSale = inv.buyer_party_id === id
                return (
                  <tr key={inv.id} className="border-b border-[#1a1a1a] hover:bg-[#141414] transition-colors">
                    <td className="px-4 py-3 text-white font-mono text-xs">{inv.invoice_number ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{inv.invoice_date ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isSale ? 'bg-teal-950 text-teal-300' : 'bg-orange-950 text-orange-300'}`}>
                        {isSale ? 'Satış' : 'Alış'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-200">{fmt(inv.total_amount ?? 0)} ₺</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === 'confirmed' ? 'bg-teal-950 text-teal-300' : 'bg-yellow-950 text-yellow-300'}`}>
                        {inv.status === 'confirmed' ? 'Onaylı' : 'Taslak'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/invoices/${inv.id}`} className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                        Detay →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
