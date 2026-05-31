'use client'

import { useCallback, useRef, useState } from 'react'
import { useBulkUpload } from '@/hooks/useBulkUpload'
import { BulkUploadItem } from '@/lib/types'

const GRADIENT = 'linear-gradient(135deg, #2456DB, #1ABC9C)'

interface Props {
  open: boolean
  onClose: () => void
  maxFiles?: number
  onComplete?: () => void
}

export default function BulkUploadModal({ open, onClose, maxFiles = 10, onComplete }: Props) {
  const { items, isRunning, stats, addFiles, startProcessing, retryItem, removeItem, reset } = useBulkUpload()
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    addFiles(Array.from(files), maxFiles)
  }, [addFiles, maxFiles])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleClose = useCallback(() => {
    if (isRunning) return
    if (stats.done > 0 && onComplete) onComplete()
    reset()
    onClose()
  }, [isRunning, stats.done, onComplete, reset, onClose])

  if (!open) return null

  const progressPercent = stats.total > 0
    ? Math.round((stats.done + stats.error) / stats.total * 100)
    : 0

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Toplu Fatura Yükle
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Max {maxFiles} dosya — JPG, PNG, PDF
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isRunning}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drag & Drop */}
        {items.length < maxFiles && !isRunning && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mx-6 mt-6 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div
              className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #EEF2FF, #ECFDF5)' }}
            >
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-slate-700 font-medium">Dosyaları buraya sürükle</p>
            <p className="text-slate-400 text-sm mt-1">
              veya tıkla seç · {maxFiles - items.length} fatura daha eklenebilir
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
          </div>
        )}

        {/* Dosya Listesi */}
        {items.length > 0 && (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {items.map(item => (
              <FileItem
                key={item.id}
                item={item}
                onRetry={() => retryItem(item.id)}
                onRemove={() => removeItem(item.id)}
                isRunning={isRunning}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-slate-100">
          {(isRunning || stats.done > 0 || stats.error > 0) && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-slate-500 mb-2">
                <span>{stats.done} tamamlandı, {stats.error} hata, {stats.queued} bekliyor</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%`, background: GRADIENT }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            {!isRunning && stats.total === 0 && (
              <button
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
              >
                İptal
              </button>
            )}

            {items.length > 0 && !isRunning && stats.done === 0 && stats.error === 0 && (
              <>
                <button
                  onClick={reset}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
                >
                  Temizle
                </button>
                <button
                  onClick={startProcessing}
                  disabled={items.filter(i => i.status === 'queued').length === 0}
                  className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: GRADIENT }}
                >
                  {items.length} Faturayı İşle →
                </button>
              </>
            )}

            {isRunning && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                {stats.processing} fatura işleniyor...
              </div>
            )}

            {!isRunning && (stats.done > 0 || stats.error > 0) && (
              <>
                {stats.error > 0 && (
                  <button
                    onClick={reset}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
                  >
                    Yeni Yükleme
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: GRADIENT }}
                >
                  Tamamlandı — Kapat ✓
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FileItem({ item, onRetry, onRemove, isRunning }: {
  item: BulkUploadItem
  onRetry: () => void
  onRemove: () => void
  isRunning: boolean
}) {
  const statusConfig = {
    queued:     { label: 'Bekliyor',    color: 'text-slate-400', bg: 'bg-slate-100' },
    uploading:  { label: 'Yükleniyor', color: 'text-blue-600',  bg: 'bg-blue-100'  },
    processing: { label: 'AI işliyor', color: 'text-blue-600',  bg: 'bg-blue-100'  },
    done:       { label: 'Tamamlandı', color: 'text-green-600', bg: 'bg-green-100' },
    error:      { label: 'Hata',       color: 'text-red-600',   bg: 'bg-red-100'   },
  }

  const config = statusConfig[item.status]
  const isImage = item.file.type.startsWith('image/')

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        {isImage
          ? <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          : <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">{item.file.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color} ${config.bg}`}>
            {config.label}
          </span>
          <span className="text-xs text-slate-400">{(item.file.size / 1024).toFixed(0)} KB</span>
          {item.error && <span className="text-xs text-red-500 truncate">{item.error}</span>}
        </div>
        {(item.status === 'uploading' || item.status === 'processing') && (
          <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${item.progress}%`, background: 'linear-gradient(90deg, #2456DB, #1ABC9C)' }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {item.status === 'error' && (
          <button
            onClick={onRetry}
            className="text-xs px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium"
          >
            Tekrar
          </button>
        )}
        {item.status === 'done' && item.invoiceId && (
          <a
            href={`/invoices/${item.invoiceId}`}
            className="text-xs px-3 py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 font-medium"
          >
            Görüntüle
          </a>
        )}
        {!isRunning && item.status !== 'processing' && item.status !== 'uploading' && (
          <button onClick={onRemove} className="p-1.5 text-slate-300 hover:text-red-400 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
