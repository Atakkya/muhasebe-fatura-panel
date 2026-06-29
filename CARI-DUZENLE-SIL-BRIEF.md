# Cari Düzenle/Sil — Claude Code Brief

CLAUDE.md'yi ve mevcut kodu oku, sonra sırayla uygula.
Bu görev, fatura listesinde zaten çalışan InvoiceRowMenu (Portal ile açılan 
dropdown menü) pattern'inin AYNISINI Cariler sayfasına uygular.

## Amaç
Cariler listesinde her satırın sonuna "..." menüsü ekle.
Menüde: "Düzenle" ve "Sil" seçenekleri olsun.
Silme: Önce o cariye bağlı faturalardaki seller_party_id/buyer_party_id'yi 
NULL yap (faturalar silinmez, sadece cari bağlantısı kalkar), sonra cariyi sil.
Onay modalı çıksın, cari adını göstersin.

## ADIM 1 — Mevcut Yapıyı İncele

components/InvoiceRowMenu.tsx dosyasını oku — bu referans olacak, AYNI mantığı kullan.
app/(dashboard)/parties/page.tsx dosyasını oku.
app/api/parties/[id]/route.ts dosyasını oku (DELETE/PATCH var mı kontrol et).

## ADIM 2 — PATCH ve DELETE Endpoint (Yoksa Ekle)

app/api/parties/[id]/route.ts dosyasında GET zaten varsa, yanına PATCH ve DELETE ekle:

```typescript
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()

  const { data, error } = await supabase
    .from('parties')
    .update({
      name: body.name,
      party_type: body.party_type,
      tax_id: body.tax_id,
      tax_office: body.tax_office ?? null,
      address: body.address ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      iban: body.iban ?? null,
      notes: body.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Party update error:', error)
    return NextResponse.json({ error: 'Cari güncellenemedi' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  // Önce bu cariye bağlı faturalardaki referansı kaldır (faturalar silinmez)
  await supabase
    .from('invoices')
    .update({ seller_party_id: null })
    .eq('seller_party_id', id)
    .eq('user_id', user.id)

  await supabase
    .from('invoices')
    .update({ buyer_party_id: null })
    .eq('buyer_party_id', id)
    .eq('user_id', user.id)

  // Sonra cariyi sil
  const { error } = await supabase
    .from('parties')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Party delete error:', error)
    return NextResponse.json({ error: 'Cari silinemedi' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

## ADIM 3 — PartyRowMenu Bileşeni

Yeni dosya: components/PartyRowMenu.tsx

InvoiceRowMenu.tsx ile AYNI yapıyı kullan (Portal, akıllı konumlandırma — 
viewport altına yakınsa üstte aç, sağ kenardan taşmasın). Sadece içerik/route 
farklı:

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  partyId: string
  partyName?: string | null
  onDeleted?: () => void
}

const MENU_HEIGHT = 84
const MENU_WIDTH = 176

export default function PartyRowMenu({ partyId, partyName, onDeleted }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function toggleMenu(e: React.MouseEvent) {
    e.stopPropagation()
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const openUpward = spaceBelow < MENU_HEIGHT + 16

      setMenuPos({
        top: openUpward
          ? rect.top + window.scrollY - MENU_HEIGHT - 4
          : rect.bottom + window.scrollY + 4,
        left: Math.min(
          rect.right + window.scrollX - MENU_WIDTH,
          window.innerWidth - MENU_WIDTH - 12
        ),
      })
    }
    setOpen(!open)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/parties/${partyId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Silme başarısız')
      }
      setConfirmOpen(false)
      if (onDeleted) {
        onDeleted()
      } else {
        router.refresh()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {mounted && open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999, minWidth: 176 }}
          className="bg-white rounded-xl shadow-lg border border-slate-200 py-1.5"
        >
          <Link
            href={`/parties/${partyId}/edit`}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            onClick={() => setOpen(false)}
          >
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Düzenle
          </Link>
          <button
            onClick={() => { setOpen(false); setConfirmOpen(true) }}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left whitespace-nowrap"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Sil
          </button>
        </div>,
        document.body
      )}

      {mounted && confirmOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !deleting && setConfirmOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1.5">Cariyi sil</h3>
            <p className="text-sm text-slate-500 mb-6">
              {partyName ? <><strong className="text-slate-700">{partyName}</strong></> : 'Bu cari'} kalıcı olarak silinecek.
              Bu cariye ait faturalar SİLİNMEZ, sadece cari bağlantısı kaldırılır.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {deleting ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
```

## ADIM 4 — Cariler Listesine Entegre Et

app/(dashboard)/parties/page.tsx dosyasında:

1. Import ekle:
```typescript
import PartyRowMenu from '@/components/PartyRowMenu'
```

2. Tablonun her satırının sonuna ekle:
```tsx
<td className="px-4 py-3 text-right">
  <PartyRowMenu
    partyId={party.id}
    partyName={party.name}
    onDeleted={() => router.refresh()}
  />
</td>
```

E�er "İşlemler" sütunu yoksa, tabloya yeni bir sütun başlığı ekle (diğer 
sütunların stiline uygun şekilde, en sağda).

## ADIM 5 — Cari Düzenleme Sayfası

Yeni dosya: app/(dashboard)/parties/[id]/edit/page.tsx

```tsx
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import PartyForm from '@/components/PartyForm'

export default async function EditPartyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: party, error } = await supabase
    .from('parties')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !party) {
    redirect('/parties')
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Cariyi Düzenle</h1>
        <p className="text-sm text-slate-500 mt-1">{party.name}</p>
      </div>

      <PartyForm initialData={party} partyId={party.id} />
    </div>
  )
}
```

## ADIM 6 — PartyForm Bileşeni (Basit Form)

Yeni dosya: components/PartyForm.tsx

```tsx
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

  const inputClass = "w-full rounded-lg px-3 py-2 text-sm border border-slate-200 focus:border-blue-400 focus:outline-none transition-colors"

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
        <button onClick={() => router.back()}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
          İptal
        </button>
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #2456DB, #1ABC9C)' }}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}
```

## ADIM 7 — Build & Test

```bash
npm run build
```

```bash
npm run dev
```

Test:
1. /parties sayfasında her satırda "..." menüsü görünmeli
2. "Düzenle" → form açılmalı, mevcut veriler dolu, kaydet çalışmalı
3. "Sil" → onay modalı, cari adı görünmeli, "faturalar silinmez" notu olmalı
4. Bağlı faturası olan bir cariyi sil → cari silinmeli, fatura listesinde 
   o fatura HALA durmalı ama artık cariye bağlı olmamalı
5. /parties listesinde cari artık görünmemeli

## YAPMA
- Invoice sistemine dokunma
- AI/QR kodlarına dokunma
- Cari otomatik oluşturma mantığını değiştirme

## Bana Bildir
- Build başarılı mı
- Menü/düzenleme/silme çalışıyor mu
- Bağlı fatura testi nasıl sonuçlandı
