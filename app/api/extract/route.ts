import { NextRequest, NextResponse } from 'next/server'
import { extractInvoiceFromImage } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const { image, mediaType } = await req.json()

    if (!image) {
      return NextResponse.json({ error: 'Görsel gerekli' }, { status: 400 })
    }

    const base64 = image.includes(',') ? image.split(',')[1] : image
    const type = mediaType ?? 'image/png'

    const data = await extractInvoiceFromImage(base64, type)
    return NextResponse.json({ data })
  } catch (err) {
    console.error('Extract error:', err)
    return NextResponse.json({ error: 'Fatura okunamadı' }, { status: 500 })
  }
}
