'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Invoice } from '@/lib/types'
import { exportInvoicesToExcel } from '@/lib/excel-export'
import BulkUploadModal from './BulkUploadModal'
import InvoiceRowMenu from './InvoiceRowMenu'

interface Props {
  invoices: Invoice[]
}

const STATUS_LABELS: Record<string, string> = { pending: 'Bekliyor', paid: 'Ödendi', overdue: 'Gecikmiş' }
const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-600 bg-amber-50',
  paid: 'text-green-600 bg-green-50',
  overdue: 'text-red-500 bg-red-50',
}
const TYPE_LABELS: Record<string, string> = { purchase: 'Alış', sale: 'Satış' }
const TYPE_COLORS: Record<string, string> = {
  purchase: 'text-[#2456DB] bg-blue-50',
  sale: 'text-purple-600 bg-purple-50',
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
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [exporting, setExporting] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)

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

  const allFilteredIds = filtered.map(inv => inv.id!).filter(Boolean)
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.includes(id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)))
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allFilteredIds])])
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/invoices/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds.length > 0 ? selectedIds : undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Hata')
      const today = new Date().toISOString().split('T')[0]
      exportInvoicesToExcel(json.data, `faturalar_${today}.xlsx`)
    } catch (err) {
      alert('Excel oluşturulamadı: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'))
    } finally {
      setExporting(false)
    }
  }

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
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#2456DB] w-56"
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-[#2456DB]">
          <option value="">Tür: Hepsi</option>
          <option value="purchase">Alış</option>
          <option value="sale">Satış</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-[#2456DB]">
          <option value="">Ödeme: Hepsi</option>
          <option value="pending">Bekliyor</option>
          <option value="paid">Ödendi</option>
          <option value="overdue">Gecikmiş</option>
        </select>
        <div className="flex-1" />
        {selectedIds.length > 0 && (
          <span className="text-xs text-gray-500">{selectedIds.length} fatura seçildi</span>
        )}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2456DB] hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {exporting ? 'İndiriliyor...' : selectedIds.length > 0
            ? `Seçilenleri Excel'e Aktar (${selectedIds.length})`
            : "Tümünü Excel'e Aktar"}
        </button>
        <button onClick={exportCsv}
          className="flex items-center gap-2 border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 px-3 py-2 rounded-lg text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          CSV İndir
        </button>
        <button
          onClick={() => setBulkOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all hover:scale-105"
          style={{ borderColor: '#2456DB', color: '#2456DB' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Toplu Yükle
        </button>
        <Link href="/invoices/new"
          className="flex items-center gap-2 bg-[#2456DB] hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Fatura
        </Link>
      </div>

      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        maxFiles={20}
        onComplete={() => router.refresh()}
      />

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="mb-2">Sonuç bulunamadı</p>
            <Link href="/invoices/new" className="text-[#2456DB] hover:text-blue-700 text-sm">
              Yeni fatura ekle →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pl-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 bg-white accent-[#2456DB]"
                  />
                </th>
                {['Fatura No', 'Tarih', 'Tür', 'Taraf', 'Tutar', 'Ödeme', 'Hesap Kodu', 'İşlemler'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="pl-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(inv.id!)}
                      onChange={() => toggleSelect(inv.id!)}
                      className="rounded border-gray-300 bg-white accent-[#2456DB]"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/invoices/${inv.id}`} className="text-[#2456DB] hover:text-blue-700 font-mono text-xs">
                      {inv.invoice_number ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{fmtDate(inv.invoice_date)}</td>
                  <td className="px-4 py-2.5">
                    {inv.invoice_type && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[inv.invoice_type] ?? ''}`}>
                        {TYPE_LABELS[inv.invoice_type]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-700 max-w-[160px] truncate">
                    {inv.invoice_type === 'purchase' ? inv.seller_name : inv.buyer_name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-900 font-medium">{fmtMoney(inv.total_amount)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.payment_status] ?? ''}`}>
                      {STATUS_LABELS[inv.payment_status] ?? inv.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">{inv.accounting_code ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <InvoiceRowMenu
                      invoiceId={inv.id!}
                      partyName={inv.invoice_type === 'purchase' ? inv.seller_name : inv.buyer_name}
                      onDeleted={() => router.refresh()}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-500">{filtered.length} fatura gösteriliyor</p>
    </div>
  )
}
