'use client'

import { useRef, useState } from 'react'
import { ExtractedInvoiceData } from '@/lib/types'
import { autoScanQr } from '@/lib/qr-from-image'

interface Props {
  onExtracted: (data: ExtractedInvoiceData, source: 'file_upload') => void
  onQrDetected?: (qrRawData: string) => void
}

export default function FileUpload({ onExtracted, onQrDetected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [qrFound, setQrFound] = useState(false)

  async function processFile(file: File) {
    setLoading(true)
    setError('')
    setQrFound(false)

    // QR tarama arka planda sessizce çalışır
    autoScanQr(file).then(qrData => {
      if (qrData) {
        setQrFound(true)
        onQrDetected?.(qrData)
      }
    }).catch(() => {})

    try {
      let base64: string
      let mediaType: string

      if (file.type === 'application/pdf') {
        base64 = await pdfToBase64(file)
        mediaType = 'image/png'
      } else {
        base64 = await fileToBase64(file)
        mediaType = file.type || 'image/jpeg'
      }

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      onExtracted(json.data, 'file_upload')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dosya işlenemedi')
    } finally {
      setLoading(false)
    }
  }

  async function pdfToBase64(file: File): Promise<string> {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const page = await pdf.getPage(1)

    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!

    await page.render({ canvasContext: ctx as CanvasRenderingContext2D, viewport, canvas }).promise
    return canvas.toDataURL('image/png').split(',')[1]
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !loading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-teal-400 bg-teal-950/20' : 'border-[#333] hover:border-[#555]'
        } ${loading ? 'opacity-60 cursor-wait' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleChange}
          className="hidden"
        />
        {loading ? (
          <div className="space-y-3">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400 text-sm">Claude faturayı analiz ediyor...</p>
          </div>
        ) : (
          <>
            <svg className="w-10 h-10 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-300 text-sm font-medium">PDF veya görsel yükle</p>
            <p className="text-gray-600 text-xs mt-1">Sürükle bırak veya tıkla • PDF, JPG, PNG</p>
          </>
        )}
      </div>

      {qrFound && (
        <div className="flex items-center gap-2 text-teal-400 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          QR algılandı
        </div>
      )}

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-lg px-3 py-2 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
