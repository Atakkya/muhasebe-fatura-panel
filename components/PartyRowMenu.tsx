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

  useEffect(() => { setMounted(true) }, [])

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
    setOpen(prev => !prev)
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
        <div
          className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !deleting && setConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1.5">Cariyi sil</h3>
            <p className="text-sm text-slate-500 mb-6">
              {partyName
                ? <><strong className="text-slate-700">{partyName}</strong> kalıcı olarak silinecek.</>
                : 'Bu cari kalıcı olarak silinecek.'
              }
              {' '}Bu cariye ait faturalar SİLİNMEZ, sadece cari bağlantısı kaldırılır.
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
