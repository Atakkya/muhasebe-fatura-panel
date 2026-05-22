import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { qrUrl } = await req.json()
    if (!qrUrl) return NextResponse.json({ error: 'URL gerekli' }, { status: 400 })

    // TODO: GİB scraping burada yapılacak (sonraki faz)
    return NextResponse.json({
      supported: false,
      reason: 'GIB integration not yet implemented',
      qrUrl,
    })
  } catch (err) {
    console.error('GIB fetch error:', err)
    return NextResponse.json({ error: 'GIB sorgusu başarısız' }, { status: 500 })
  }
}
