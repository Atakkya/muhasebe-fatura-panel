export interface QrParsedData {
  ettn: string | null
  rawUrl: string | null
  isGib: boolean
}

export function parseQrCode(raw: string): QrParsedData {
  const result: QrParsedData = { ettn: null, rawUrl: null, isGib: false }

  const isUrl = raw.startsWith('http://') || raw.startsWith('https://')
  if (isUrl) {
    result.rawUrl = raw
    result.isGib = raw.includes('efatura.gov.tr') || raw.includes('earsivportal')

    // Extract ETTN/UUID from GİB URL query params or path
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    const match = raw.match(uuidRegex)
    if (match) result.ettn = match[0]

    // Also check token param which may be base64 encoded
    try {
      const url = new URL(raw)
      const token = url.searchParams.get('token')
      if (token && !result.ettn) {
        const decoded = atob(token)
        const uuidMatch = decoded.match(uuidRegex)
        if (uuidMatch) result.ettn = uuidMatch[0]
      }
    } catch {}

    return result
  }

  // Try parsing as JSON (some QR codes embed structured data)
  try {
    const obj = JSON.parse(raw)
    result.ettn = obj.ettn ?? obj.ETTN ?? obj.uuid ?? null
    return result
  } catch {}

  // Try UUID directly
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  const match = raw.match(uuidRegex)
  if (match) result.ettn = match[0]

  return result
}
