'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Party {
  id?: string
  name: string
  party_type: 'corporate' | 'individual'
  tax_id: string
  tax_office: string | null
  address: string | null
  phone: string | null
  email: string | null
  iban: string | null
  notes: string | null
}

interface Props {
  initialData?: Partial<Party>
  partyId?: string
}

export default function PartyForm({ initialData, partyId }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<Partial<Party>>({
    name: initialData?.name ?? '',
    party_type: initialData?.party_type ?? 'corporate',
    tax_id: initialData?.tax_id ?? '',
    tax_office: initialData?.tax_office ?? '',
    address: initialData?.address ?? '',
    phone: initialData?.phone ?? '',
    email: initialData?.email ?? '',
    iban: initialData?.iban ?? '',
    notes: initialData?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof Party, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const url = partyId ? `/api/parties/${partyId}` : '/api/parties'
      const method = partyId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Kayıt başarısız')
      }
      router.push('/parties')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      setSaving(false)
    }
  }

  const inputClass = 'w-full rounded-lg px-3 py-2 text-sm border border-slate-200 focus:border-blue-400 focus:outline-none transition-colors'

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs text-slate-500 mb-1.5">Ad / Ünvan</label>
          <input className={inputClass} value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Tip</label>
          <select className={inputClass} value={form.party_type} onChange={e => set('party_type', e.target.value)}>
            <option value="corporate">Firma</option>
            <option value="individual">Şahıs</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">VKN/TCKN</label>
          <input className={`${inputClass} font-mono`} value={form.tax_id ?? ''} onChange={e => set('tax_id', e.target.value)} />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Vergi Dairesi</label>
          <input className={inputClass} value={form.tax_office ?? ''} onChange={e => set('tax_office', e.target.value)} />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Telefon</label>
          <input className={inputClass} value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} />
        </div>

        <div className="col-span-2">
          <label className="block text-xs text-slate-500 mb-1.5">Adres</label>
          <textarea className={`${inputClass} resize-none`} rows={2} value={form.address ?? ''} onChange={e => set('address', e.target.value)} />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">E-posta</label>
          <input className={inputClass} value={form.email ?? ''} onChange={e => set('email', e.target.value)} />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">IBAN</label>
          <input className={`${inputClass} font-mono`} value={form.iban ?? ''} onChange={e => set('iban', e.target.value)} />
        </div>

        <div className="col-span-2">
          <label className="block text-xs text-slate-500 mb-1.5">Notlar</label>
          <textarea className={`${inputClass} resize-none`} rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
        >
          İptal
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #2456DB, #1ABC9C)' }}
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}
