'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { PartyWithBalance } from '@/lib/types'

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
        <h1 className="text-2xl font-bold text-white">Cariler</h1>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#141414] border border-[#222] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Toplam Cari</span>
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-2xl font-semibold text-white">{partyCount}</div>
        </div>

        <div className="bg-[#141414] border border-[#222] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Toplam Borç</span>
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
          <div className="text-2xl font-semibold text-red-400">{fmtMoney(totals.debt)} ₺</div>
          <div className="text-[10px] text-gray-600 mt-1">Ödenecekler</div>
        </div>

        <div className="bg-[#141414] border border-[#222] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Toplam Alacak</span>
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-2xl font-semibold text-green-400">{fmtMoney(totals.receivable)} ₺</div>
          <div className="text-[10px] text-gray-600 mt-1">Tahsil edilecekler</div>
        </div>

        <div className={`border rounded-xl p-4 ${
          netBalance >= 0
            ? 'bg-green-950/20 border-green-900/50'
            : 'bg-red-950/20 border-red-900/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Net Bakiye</span>
            <svg className={`w-4 h-4 ${netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className={`text-2xl font-semibold ${netBalance >= 0 ? 'text-green-300' : 'text-red-300'}`}>
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
          className="w-full max-w-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500"
        />
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm py-12 text-center">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500 text-sm py-12 text-center">
          {search ? 'Eşleşen cari bulunamadı.' : 'Henüz cari yok. Fatura yüklemeye başlayın, cariler otomatik oluşturulur.'}
        </div>
      ) : (
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                <th className="px-4 py-3 text-left text-gray-500 font-medium">Tip</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">Ad / Ünvan</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">VKN/TCKN</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">Fatura</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">Borç</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">Alacak</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">Bakiye</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-[#1a1a1a] hover:bg-[#141414] transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${p.party_type === 'corporate' ? 'bg-blue-950 text-blue-300' : 'bg-purple-950 text-purple-300'}`}>
                      {p.party_type === 'corporate' ? 'Firma' : 'Şahıs'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.tax_id}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{p.invoice_count}</td>
                  <td className="px-4 py-3 text-right text-red-400">{fmtMoney(p.total_purchase)} ₺</td>
                  <td className="px-4 py-3 text-right text-teal-400">{fmtMoney(p.total_sale)} ₺</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    <span className={p.balance >= 0 ? 'text-teal-400' : 'text-red-400'}>
                      {p.balance >= 0 ? '+' : ''}{fmtMoney(p.balance)} ₺
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/parties/${p.id}`}
                      className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      Detay →
                    </Link>
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
