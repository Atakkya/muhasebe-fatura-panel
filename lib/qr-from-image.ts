import { BrowserMultiFormatReader } from '@zxing/browser'
import { DecodeHintType, BarcodeFormat } from '@zxing/library'

function getReader() {
  const hints = new Map()
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE])
  hints.set(DecodeHintType.TRY_HARDER, true)
  return new BrowserMultiFormatReader(hints)
}

export async function scanQrFromImage(file: File | Blob): Promise<string | null> {
  const reader = getReader()
  const url = URL.createObjectURL(file)
  try {
    const result = await reader.decodeFromImageUrl(url)
    return result.getText()
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function scanQrFromPdf(file: File): Promise<string | null> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

  const maxPages = Math.min(pdf.numPages, 3)
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx as CanvasRenderingContext2D, viewport, canvas }).promise

    const blob: Blob = await new Promise(resolve =>
      canvas.toBlob(b => resolve(b!), 'image/png')
    )
    const result = await scanQrFromImage(blob)
    if (result) return result
  }
  return null
}

export async function autoScanQr(file: File): Promise<string | null> {
  if (file.type === 'application/pdf') return scanQrFromPdf(file)
  if (file.type.startsWith('image/')) return scanQrFromImage(file)
  return null
}
