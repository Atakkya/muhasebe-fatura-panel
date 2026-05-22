# QR Geliştirmesi — Claude Code Brief (v2)

CLAUDE.md ve mevcut kodu okuduktan sonra bu görevi sırayla yap. Her adım bittiğinde bana özetle. Hata olursa dur ve sor.

## Hedef
1. `jsqr` yerine **`@zxing/browser`** kullan (daha güçlü QR okuma)
2. Yüklenen fotoğraf/PDF'ten otomatik QR tara
3. Kamera tarayıcıyı güçlendir
4. GİB scraping için ileride hazır altyapı kur (şimdi scraping yapma, sadece yer hazırla)
5. AI ile QR verilerini doğrula

## Mevcut Yapı
- `lib/qr-parser.ts` — QR string'i parse eder — **DOKUNMA**, çalışıyor
- `components/QrScanner.tsx` — Kamera UI — GÜNCELLE
- `components/FileUpload.tsx` — Dosya yükleme — QR taraması EKLE
- `app/(dashboard)/invoices/new/page.tsx` — Akışı BAĞLA
- `lib/claude.ts` — AI servisi — DOKUNMA

---

## ADIM 1: Paket Kur

```bash
npm install @zxing/browser @zxing/library
```

`jsqr` paketini şimdi silme. Sonra temizleriz.

---

## ADIM 2: Görüntüden QR Tarayan Util

Yeni dosya: `lib/qr-from-image.ts`

```typescript
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
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

  // PDF'in ilk 3 sayfasını dene (genelde QR ilk sayfada)
  const maxPages = Math.min(pdf.numPages, 3)
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, viewport }).promise

    const blob: Blob = await new Promise(resolve =>
      canvas.toBlob(b => resolve(b!), 'image/png')
    )
    const result = await scanQrFromImage(blob)
    if (result) return result
  }
  return null
}

// Dosya tipine göre otomatik
export async function autoScanQr(file: File): Promise<string | null> {
  if (file.type === 'application/pdf') return scanQrFromPdf(file)
  if (file.type.startsWith('image/')) return scanQrFromImage(file)
  return null
}
```

---

## ADIM 3: GİB Hazırlık Endpoint'i (Şimdilik Stub)

Yeni dosya: `app/api/gib-fetch/route.ts`

İçeriği — şimdilik **placeholder/stub** olsun, sadece QR URL'ini alıp `{ supported: false }` dönsün. Gerçek scraping sonraki adımda eklenecek:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { qrUrl } = await req.json()
    if (!qrUrl) return NextResponse.json({ error: 'URL gerekli' }, { status: 400 })

    // TODO: GİB scraping burada yapılacak (sonraki faz)
    // Şimdilik desteklenmiyor olarak işaretle
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
```

Bu endpoint **şimdi çağrılmayacak**, sadece dosyası dursun.

---

## ADIM 4: FileUpload Bileşenini Güncelle

`components/FileUpload.tsx` dosyasını oku.

**Değişiklikler:**

1. Props'a yeni callback ekle:
   ```typescript
   onQrDetected?: (qrRawData: string) => void
   ```

2. Dosya seçildikten **sonra**, AI'ya göndermeden **önce**:
   ```typescript
   import { autoScanQr } from '@/lib/qr-from-image'
   
   // ...
   const qrData = await autoScanQr(file)
   if (qrData && onQrDetected) {
     onQrDetected(qrData)
   }
   ```

3. QR taraması **arka planda** sessiz çalışsın — bulunmazsa hata gösterme, normal akış devam etsin.

4. UI'ya küçük indikatör ekle: QR bulunduysa yeşil tik "QR algılandı" diye küçük bir text görünsün.

---

## ADIM 5: Yeni Fatura Sayfasını Bağla

`app/(dashboard)/invoices/new/page.tsx` dosyasını oku.

**Eklemeler:**

1. State ekle:
   ```typescript
   const [qrData, setQrData] = useState<string | null>(null)
   const [qrEttn, setQrEttn] = useState<string | null>(null)
   const [ettnMismatch, setEttnMismatch] = useState(false)
   ```

2. FileUpload'a callback geçir:
   ```typescript
   <FileUpload onQrDetected={(raw) => {
     setQrData(raw)
     const parsed = parseQrCode(raw)
     setQrEttn(parsed.ettn)
   }} />
   ```

3. AI'dan veri geldiğinde karşılaştır:
   ```typescript
   // AI extract sonucu invoice.ettn varsa
   if (qrEttn && extractedData.ettn && qrEttn !== extractedData.ettn) {
     setEttnMismatch(true)
   }
   ```

4. UI'da:
   - QR algılandıysa form üstünde küçük yeşil badge: "✓ QR algılandı: ETTN xxx"
   - ETTN uyuşmazlığı varsa sarı uyarı banner: "⚠️ AI ve QR'dan gelen ETTN farklı, lütfen kontrol edin"

5. Form submit edilirken `qr_raw_data` alanına `qrData` değerini de kaydet.

---

## ADIM 6: Kamera Tarayıcıyı Güçlendir

`components/QrScanner.tsx` dosyasını **yeniden yaz** — ZXing kullanacak.

**Değişiklikler:**

1. `jsqr` ve `setInterval` kullanan eski kodu sil
2. Yerine:
   ```typescript
   import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser'
   import { DecodeHintType, BarcodeFormat } from '@zxing/library'
   ```

3. ZXing reader oluştur:
   ```typescript
   const hints = new Map()
   hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE])
   hints.set(DecodeHintType.TRY_HARDER, true)
   const reader = new BrowserMultiFormatReader(hints)
   ```

4. Kamera açma + tarama:
   ```typescript
   const controls = await reader.decodeFromVideoDevice(
     undefined, // varsayılan kamera (arka)
     videoRef.current!,
     (result, err) => {
       if (result) {
         controls.stop()
         onScan(result.getText())
       }
       // err her frame'de gelir, görmezden gel
     }
   )
   ```

5. Tarama çerçevesini büyüt: `w-48 h-48` → `w-72 h-72` (192 → 288 px)

6. Çözünürlüğü artır — kamerayı açan kısmı:
   ```typescript
   navigator.mediaDevices.getUserMedia({
     video: {
       facingMode: 'environment',
       width: { ideal: 1920 },
       height: { ideal: 1080 }
     }
   })
   ```

---

## ADIM 7: Build ve Test

```bash
npm run build
```

Hata varsa düzelt.

Sonra:
```bash
npm run dev
```

Test:
1. `http://localhost:3000` aç, giriş yap
2. Yeni fatura sayfasına git
3. **Fotoğraf yükle** (içinde QR olan) → QR algılandı yazısı çıkıyor mu?
4. **PDF yükle** → QR algılandı mı?
5. **QR Tara butonu** → kameradan dene, eski faturayla → okuyor mu, eskisinden hızlı mı?
6. AI verisi geldiğinde ETTN uyuşması doğru çalışıyor mu?

---

## YAPMA Listesi
- Gerçek GİB scraping kodunu YAZMA — sadece stub endpoint
- `qr-parser.ts` dosyasını değiştirme
- DB şemasını değiştirme
- `lib/claude.ts` dosyasına dokunma
- `jsqr` paketini silme (henüz)

---

## Sonuç Raporu (Bittiğinde Bana Ver)
- Değiştirilen dosyalar listesi
- `npm run build` başarılı mı?
- Test sonuçları (fotoğraf, PDF, kamera için ayrı ayrı)
- Karşılaştığın hatalar
- Atılan adımların özeti

Başla.
