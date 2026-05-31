'use client'

import { useState, useCallback, useRef } from 'react'
import { BulkUploadItem } from '@/lib/types'
import { autoScanQr } from '@/lib/qr-from-image'
import { parseQrCode } from '@/lib/qr-parser'

const CONCURRENCY = 3

export function useBulkUpload() {
  const [items, setItems] = useState<BulkUploadItem[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const activeCount = useRef(0)
  const queue = useRef<string[]>([])

  const updateItem = useCallback((id: string, update: Partial<BulkUploadItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...update } : item))
  }, [])

  const processQueue = useCallback(() => {}, []) // forward declaration, filled below

  const processItem = useCallback(async (item: BulkUploadItem) => {
    activeCount.current++

    try {
      updateItem(item.id, { status: 'uploading', progress: 10 })
      let qrData: string | undefined
      try {
        const qr = await autoScanQr(item.file)
        if (qr) {
          qrData = qr
          parseQrCode(qr)
          updateItem(item.id, { qrData: qr, progress: 20 })
        }
      } catch {}

      updateItem(item.id, { status: 'processing', progress: 30 })

      const formData = new FormData()
      formData.append('file', item.file)
      if (qrData) formData.append('qrData', qrData)

      const res = await fetch('/api/extract', { method: 'POST', body: formData })
      updateItem(item.id, { progress: 70 })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'AI işleme başarısız')
      }

      const json = await res.json()
      const extractedData = json.data

      updateItem(item.id, { progress: 85 })

      const saveRes = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...extractedData,
          qr_raw_data: qrData ?? null,
          status: 'draft',
          source: 'bulk_upload',
        }),
      })

      if (!saveRes.ok) throw new Error('Fatura kaydedilemedi')

      const savedInvoice = await saveRes.json()
      updateItem(item.id, {
        status: 'done',
        progress: 100,
        invoiceId: savedInvoice.data?.id,
        extractedData,
      })
    } catch (err) {
      updateItem(item.id, {
        status: 'error',
        progress: 0,
        error: err instanceof Error ? err.message : 'Bilinmeyen hata',
      })
    } finally {
      activeCount.current--
      drainQueue()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateItem])

  function drainQueue() {
    setItems(prev => {
      let remaining = [...queue.current]
      while (activeCount.current < CONCURRENCY && remaining.length > 0) {
        const nextId = remaining.shift()!
        queue.current = remaining
        const item = prev.find(i => i.id === nextId)
        if (item && item.status === 'queued') {
          processItem(item)
        }
      }
      const allDone = prev.every(i => i.status === 'done' || i.status === 'error')
      if (allDone && prev.length > 0) setIsRunning(false)
      return prev
    })
  }

  const addFiles = useCallback((files: File[], maxAllowed: number) => {
    const validFiles = files
      .filter(f => ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(f.type))
      .slice(0, maxAllowed - items.length)

    if (validFiles.length === 0) return

    const newItems: BulkUploadItem[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'queued',
      progress: 0,
    }))

    setItems(prev => [...prev, ...newItems])
    newItems.forEach(item => queue.current.push(item.id))
  }, [items.length])

  const startProcessing = useCallback(() => {
    setIsRunning(true)
    drainQueue()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const retryItem = useCallback((id: string) => {
    updateItem(id, { status: 'queued', progress: 0, error: undefined })
    queue.current.push(id)
    setIsRunning(true)
    drainQueue()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateItem])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    queue.current = queue.current.filter(qId => qId !== id)
  }, [])

  const reset = useCallback(() => {
    setItems([])
    setIsRunning(false)
    activeCount.current = 0
    queue.current = []
  }, [])

  const stats = {
    total: items.length,
    done: items.filter(i => i.status === 'done').length,
    error: items.filter(i => i.status === 'error').length,
    processing: items.filter(i => i.status === 'processing' || i.status === 'uploading').length,
    queued: items.filter(i => i.status === 'queued').length,
  }

  return { items, isRunning, stats, addFiles, startProcessing, retryItem, removeItem, reset }
}
