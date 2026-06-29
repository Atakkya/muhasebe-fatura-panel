'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { PartyWithBalance } from '@/lib/types'
import PartyRowMenu from '@/components/PartyRowMenu'

function fmtMoney(n: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export default function PartiesPage() {
  const [parties, setParties] = useState<PartyWithBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/parties')
      .then((r) => r.json())
      .then((d) => setParties(d.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = parties.filter((p) => {
    const q = search.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.tax_id.includes(q)
  })

  const totals = parties.reduce(
    (acc, p) => ({
      debt: acc.debt + (p.total_purchase ?? 0),
      receivable: acc.receivable + (p.total_sale ?? 0),
    }),
    { debt: 0, receivable: 0 }
  )
  const netBalance = totals.receivable - totals.debt
  const partyCount = parties.length

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cariler</h1>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Toplam Cari</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{partyCount}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Toplam Borç</span>
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
          <div className="text-2xl font-semibold text-red-500">{fmtMoney(totals.debt)} ₺</div>
          <div className="text-[10px] text-gray-400 mt-1">Ödenecekler</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Toplam Alacak</span>
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-2xl font-semibold text-green-600">{fmtMoney(totals.receivable)} ₺</div>
          <div className="text-[10px] text-gray-400 mt-1">Tahsil edilecekler</div>
        </div>

        <div className={`border rounded-xl p-4 ${
          netBalance >= 0
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Net Bakiye</span>
            <svg className={`w-4 h-4 ${netBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className={`text-2xl font-semibold ${netBalance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {netBalance >= 0 ? '+' : ''}{fmtMoney(netBalance)} ₺
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {netBalance >= 0 ? 'Pozitif (alacaklıyız)' : 'Negatif (borçluyuz)'}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Ad veya VKN/TCKN ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2456DB]"
        />
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm py-12 text-center">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500 text-sm py-12 text-center">
          {search ? 'Eşleşen cari bulunamadı.' : 'Henüz cari yok. Fatura yüklemeye başlayın, cariler otomatik oluşturulur.'}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-gray-500 font-medium">Tip</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">Ad / Ünvan</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">VKN/TCKN</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">Fatura</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">Borç</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">Alacak</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">Bakiye</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${p.party_type === 'corporate' ? 'bg-blue-50 text-[#2456DB]' : 'bg-purple-50 text-purple-600'}`}>
                      {p.party_type === 'corporate' ? 'Firma' : 'Şahıs'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.tax_id}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{p.invoice_count}</td>
                  <td className="px-4 py-3 text-right text-red-500">{fmtMoney(p.total_purchase)} ₺</td>
                  <td className="px-4 py-3 text-right" style={{ color: '#1ABC9C' }}>{fmtMoney(p.total_sale)} ₺</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    <span style={{ color: p.balance >= 0 ? '#1ABC9C' : undefined }} className={p.balance >= 0 ? '' : 'text-red-500'}>
                      {p.balance >= 0 ? '+' : ''}{fmtMoney(p.balance)} ₺
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/parties/${p.id}`}
                        className="text-xs text-[#2456DB] hover:text-blue-700 transition-colors"
                      >
                        Detay →
                      </Link>
                      <PartyRowMenu
                        partyId={p.id}
                        partyName={p.name}
                        onDeleted={() => setParties(prev => prev.filter(x => x.id !== p.id))}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
