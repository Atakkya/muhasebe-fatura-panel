'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Invoice } from '@/lib/types'

interface Props {
  invoices: Invoice[]
}

const STATUS_LABELS: Record<string, string> = { pending: 'Bekliyor', paid: 'Ödendi', overdue: 'Gecikmiş' }
const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-400 bg-amber-950/40',
  paid: 'text-green-400 bg-green-950/40',
  overdue: 'text-red-400 bg-red-950/40',
}
const TYPE_LABELS: Record<string, string> = { purchase: 'Alış', sale: 'Satış' }
const TYPE_COLORS: Record<string, string> = {
  purchase: 'text-blue-400 bg-blue-950/40',
  sale: 'text-purple-400 bg-purple-950/40',
}

function fmtMoney(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(n) + ' ₺'
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('tr-TR')
}

export default function InvoiceList({ invoices }: Props) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = invoices.filter(inv => {
    if (typeFilter && inv.invoice_type !== typeFilter) return false
    if (statusFilter && inv.payment_status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        inv.invoice_number?.toLowerCase().includes(q) ||
        inv.seller_name?.toLowerCase().includes(q) ||
        inv.buyer_name?.toLowerCase().includes(q)
      )
    }
    return true
  })

  function exportCsv() {
    const rows = [
      ['Fatura No', 'Tarih', 'Tür', 'Satıcı', 'Alıcı', 'Toplam', 'Ödeme', 'Hesap Kodu'],
      ...filtered.map(i => [
        i.invoice_number ?? '', i.invoice_date ?? '', i.invoice_type ?? '',
        i.seller_name ?? '', i.buyer_name ?? '', i.total_amount ?? '',
        i.payment_status ?? '', i.accounting_code ?? '',
      ]),
    ]
    const csv = '﻿' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'faturalar.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 items-center">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Ara..."
          className="bg-[#141414] border border-[#222] rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-teal-500 w-56"
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-[#141414] border border-[#222] rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:border-teal-500">
          <option value="">Tür: Hepsi</option>
          <option value="purchase">Alış</option>
          <option value="sale">Satış</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#141414] border border-[#222] rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:border-teal-500">
          <option value="">Ödeme: Hepsi</option>
          <option value="pending">Bekliyor</option>
          <option value="paid">Ödendi</option>
          <option value="overdue">Gecikmiş</option>
        </select>
        <div className="flex-1" />
        <button onClick={exportCsv}
          className="flex items-center gap-2 border border-[#333] text-gray-400 hover:text-white hover:border-[#555] px-3 py-2 rounded-lg text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          CSV İndir
        </button>
        <Link href="/invoices/new"
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Fatura
        </Link>
      </div>

      {/* Table */}
      <div className="bg-[#141414] border border-[#222] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-600">
            <p className="mb-2">Sonuç bulunamadı</p>
            <Link href="/invoices/new" className="text-teal-400 hover:text-teal-300 text-sm">
              Yeni fatura ekle →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {['Fatura No', 'Tarih', 'Tür', 'Taraf', 'Tutar', 'Ödeme', 'Hesap Kodu', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-4 py-2.5">
                    <Link href={`/invoices/${inv.id}`} className="text-teal-400 hover:text-teal-300 font-mono text-xs">
                      {inv.invoice_number ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{fmtDate(inv.invoice_date)}</td>
                  <td className="px-4 py-2.5">
                    {inv.invoice_type && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[inv.invoice_type] ?? ''}`}>
                        {TYPE_LABELS[inv.invoice_type]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-300 max-w-[160px] truncate">
                    {inv.invoice_type === 'purchase' ? inv.seller_name : inv.buyer_name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-white font-medium">{fmtMoney(inv.total_amount)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.payment_status] ?? ''}`}>
                      {STATUS_LABELS[inv.payment_status] ?? inv.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">{inv.accounting_code ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/invoices/${inv.id}`}
                      className="text-gray-600 hover:text-gray-300 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-600">{filtered.length} fatura gösteriliyor</p>
    </div>
  )
}
