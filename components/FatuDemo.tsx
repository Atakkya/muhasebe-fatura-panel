'use client'

import { useState, useEffect, useRef } from 'react'

// ====== FATU MARKA ======
const BLUE = '#2456DB'
const TEAL = '#1ABC9C'
const GRADIENT = `linear-gradient(135deg, ${BLUE}, ${TEAL})`

// ====== ZAMAN ÇİZELGESİ (ms) ======
// faz 0: PDF + JPG dosyaları uçar     0     → 1600
// faz 1: fatura açılır                 1600  → 2400
// faz 2: AI tarama + tespit kutuları   2400  → 5600
// faz 3: alanlar dolar                 5600  → 9800
// faz 4: cari kartı oluşur             9800  → 12400
// faz 5: excel toast                   12400 → 15000
// reset                                15000 → 15800
const LOOP_MS = 15800

// Kurgusal demo verisi
const FIELDS = [
  { key: 'no',     label: 'Fatura No',     value: 'YKO2026000000847', delay: 5600, mono: true },
  { key: 'tarih',  label: 'Fatura Tarihi', value: '12.05.2026',       delay: 6100 },
  { key: 'satici', label: 'Satıcı',        value: 'YILDIZ KIRTASİYE VE OFİS MALZ. LTD.', delay: 6600 },
  { key: 'vkn',    label: 'VKN',           value: '1234567890',       delay: 7200, mono: true },
  { key: 'kdv',    label: 'KDV (%20)',     value: '8.045,20 ₺',       delay: 7800 },
  { key: 'toplam', label: 'Genel Toplam',  value: '48.271,20 ₺',      delay: 8500, big: true },
]

// Tespit sıralaması (tarama ilerlemesine göre)
const DETECT_AT = {
  satici: 0.20,
  qr: 0.32,
  vkn: 0.50,
  kalemler: 0.74,
  toplam: 0.93,
}

export default function FatuDemo() {
  const [t, setT] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      setT((Date.now() - startRef.current) % LOOP_MS)
    }, 50)
    return () => clearInterval(id)
  }, [])

  const phase =
    t < 1600 ? 0 :
    t < 2400 ? 1 :
    t < 5600 ? 2 :
    t < 9800 ? 3 :
    t < 12400 ? 4 :
    t < 15000 ? 5 : 6

  const filesFlying = t > 200 && phase === 0
  const invoiceOpen = phase >= 1
  const scanning = phase === 2
  const scanProgress = scanning ? (t - 2400) / 3200 : phase > 2 ? 1 : 0
  const detectionsActive = phase >= 2 && phase < 6
  const cariVisible = phase >= 4 && phase < 6
  const cariJustCreated = phase === 4 && t < 10600
  const showToast = phase === 5
  const fading = phase === 6

  const isDetected = (key: keyof typeof DETECT_AT) => detectionsActive && scanProgress >= DETECT_AT[key]

  return (
    <div style={{
      fontFamily: "'Open Sans', system-ui, sans-serif",
      background: 'linear-gradient(135deg, #EEF2FF 0%, #ECFDF5 100%)',
      borderRadius: 20,
      padding: 'clamp(16px, 4vw, 36px)',
      width: '100%',
      maxWidth: 980,
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.7s ease',
      boxSizing: 'border-box',
    }}>
      {/* Üst bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#FCA5A5', '#FCD34D', '#86EFAC'].map(c => (
            <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{
          flex: 1, maxWidth: 280, margin: '0 auto', background: 'white',
          borderRadius: 8, padding: '4px 14px', fontSize: 11, color: '#94A3B8',
          textAlign: 'center', border: '1px solid #E2E8F0',
        }}>
          fatu.app/invoices/new
        </div>
      </div>

      <div className="fatu-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 6fr)',
        gap: 'clamp(12px, 3vw, 26px)',
        alignItems: 'start',
      }}>

        {/* ====== SOL: DOSYALAR → FATURA → TARAMA ====== */}
        <div style={{ position: 'relative' }}>
          <div style={{
            border: invoiceOpen ? '2px solid transparent' : `2px dashed ${BLUE}40`,
            borderRadius: 16,
            background: 'white',
            padding: 16,
            minHeight: 340,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: invoiceOpen ? '0 8px 30px rgba(36,86,219,0.10)' : 'none',
            transition: 'all 0.5s ease',
          }}>

            {/* FAZ 0 — uçan PDF + JPG dosya kartları */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
              opacity: phase === 0 ? 1 : 0,
              pointerEvents: 'none',
              transition: 'opacity 0.4s',
            }}>
              <FileCard type="PDF" color="#DC2626" name="fatura.pdf" flying={filesFlying} delay={0} />
              <FileCard type="JPG" color={BLUE} name="fatura.jpg" flying={filesFlying} delay={180} />
            </div>

            {/* FATURA BELGESİ */}
            <div style={{
              transform: invoiceOpen ? 'scale(1)' : 'scale(0.6)',
              opacity: invoiceOpen ? 1 : 0,
              transition: 'transform 0.7s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.5s',
              position: 'relative',
            }}>
              {/* Dosya tipi rozetleri */}
              <div style={{
                position: 'absolute', top: -8, right: -8, zIndex: 5,
                display: 'flex', gap: 4,
              }}>
                {['PDF', 'JPG'].map(ext => (
                  <span key={ext} style={{
                    fontSize: 7.5, fontWeight: 800, letterSpacing: 0.5,
                    padding: '2px 6px', borderRadius: 5,
                    background: ext === 'PDF' ? '#FEE2E2' : '#DBEAFE',
                    color: ext === 'PDF' ? '#DC2626' : BLUE,
                    border: `1px solid ${ext === 'PDF' ? '#FECACA' : '#BFDBFE'}`,
                  }}>{ext}</span>
                ))}
              </div>

              {/* Başlık satırı: SATICI bloğu + QR bloğu — kutular elemanın KENDİSİNE kilitli */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                {/* SATICI bölgesi */}
                <Detectable label="SATICI" active={isDetected('satici')}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: '#0F172A', letterSpacing: 0.5 }}>e-ARŞİV FATURA</div>
                  <div style={{ width: 92, height: 5, background: '#0F172A', borderRadius: 2, marginTop: 5 }} />
                  <div style={{ width: 70, height: 4, background: '#CBD5E1', borderRadius: 2, marginTop: 4 }} />
                  <div style={{ width: 82, height: 4, background: '#CBD5E1', borderRadius: 2, marginTop: 3 }} />
                </Detectable>

                {/* QR bölgesi */}
                <Detectable label="QR KOD" active={isDetected('qr')} labelRight>
                  <div style={{
                    width: 44, height: 44, borderRadius: 4, padding: 3,
                    border: '1.5px solid #E2E8F0', boxSizing: 'border-box',
                    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1,
                  }}>
                    {[1,0,1,1,0,0,1,0,1,1,1,1,0,1,0,0,1,1,0,1,1,0,1,0,1].map((v, i) => (
                      <span key={i} style={{ background: v ? '#0F172A' : 'transparent', borderRadius: 0.5 }} />
                    ))}
                  </div>
                </Detectable>
              </div>

              {/* VKN bölgesi — satır blokları */}
              <Detectable label="VKN" active={isDetected('vkn')} block>
                <div style={{ height: 6, width: '55%', borderRadius: 3, background: '#E2E8F0', marginBottom: 6 }} />
                <div style={{ height: 6, width: '40%', borderRadius: 3, background: '#F1F5F9' }} />
              </Detectable>

              {/* Ara satırlar */}
              <div style={{ height: 6, width: '88%', borderRadius: 3, background: '#F1F5F9', margin: '10px 0 6px' }} />
              <div style={{ height: 6, width: '64%', borderRadius: 3, background: '#F1F5F9', marginBottom: 12 }} />

              {/* KALEMLER bölgesi — tablo */}
              <Detectable label="KALEMLER" active={isDetected('kalemler')} block>
                <div style={{
                  borderRadius: 8, overflow: 'hidden',
                  border: '1.5px solid #E2E8F0',
                }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{
                      display: 'flex', gap: 6, padding: '5px 8px',
                      background: i === 0 ? '#F8FAFC' : 'white',
                      borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none',
                    }}>
                      <span style={{ flex: 3, height: 5, background: i === 0 ? '#CBD5E1' : '#E2E8F0', borderRadius: 2 }} />
                      <span style={{ flex: 1, height: 5, background: i === 0 ? '#CBD5E1' : '#E2E8F0', borderRadius: 2 }} />
                      <span style={{ flex: 1, height: 5, background: i === 0 ? '#CBD5E1' : '#E2E8F0', borderRadius: 2 }} />
                    </div>
                  ))}
                </div>
              </Detectable>

              {/* TOPLAM bölgesi */}
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <Detectable label="TOPLAM" active={isDetected('toplam')} labelRight>
                  <div style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 9.5, fontWeight: 700,
                    background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0',
                  }}>
                    48.271,20 ₺
                  </div>
                </Detectable>
              </div>
            </div>

            {/* Tarama çizgisi */}
            {scanning && (
              <div style={{
                position: 'absolute', left: 0, right: 0,
                top: `${6 + scanProgress * 86}%`,
                height: 2.5,
                background: GRADIENT,
                boxShadow: `0 0 16px ${TEAL}, 0 0 32px ${BLUE}50`,
                borderRadius: 2,
                zIndex: 6,
              }} />
            )}
          </div>

          {/* Durum etiketi */}
          <div style={{
            marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12.5, fontWeight: 600, minHeight: 22,
            color: scanning ? BLUE : phase >= 4 ? '#0d8a72' : '#64748B',
          }}>
            {phase === 0 && <><Pulse color={BLUE} /> PDF veya fotoğraf yükleniyor…</>}
            {phase === 1 && <><Pulse color={BLUE} /> Dosya alındı, AI başlıyor…</>}
            {scanning && <><Pulse color={BLUE} /> AI bölgeleri tespit ediyor… ({Math.round(scanProgress * 100)}%)</>}
            {phase === 3 && <><Pulse color={TEAL} /> Alanlar dolduruluyor…</>}
            {phase >= 4 && (
              <><CheckDot /> 13 alan okundu · 5 bölge tespit edildi — 5,2 sn</>
            )}
          </div>
        </div>

        {/* ====== SAĞ: FORM + CARİ KARTI ====== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Form */}
          <div style={{
            background: 'white', borderRadius: 16, padding: 'clamp(14px, 2.5vw, 20px)',
            boxShadow: '0 8px 30px rgba(15,23,42,0.06)',
            border: '1px solid #F1F5F9',
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase',
              background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginBottom: 12,
            }}>
              Fatura Bilgileri
            </div>

            {FIELDS.map(f => {
              const filled = t >= f.delay && phase >= 3 && phase < 6
              const justFilled = filled && t < f.delay + 600
              return (
                <div key={f.key} style={{ marginBottom: f.big ? 0 : 8 }}>
                  <div style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: 600, marginBottom: 3 }}>
                    {f.label}
                    {filled && <span style={{ color: TEAL, marginLeft: 5, fontWeight: 700 }}>✓ Otomatik</span>}
                  </div>
                  <div style={{
                    borderRadius: 8,
                    border: filled ? `1.5px solid ${TEAL}60` : '1.5px solid #E2E8F0',
                    background: filled ? `${TEAL}08` : '#F8FAFC',
                    padding: f.big ? '8px 12px' : '6px 12px',
                    fontSize: f.big ? 15 : 11.5,
                    fontWeight: f.big ? 800 : 600,
                    color: filled ? '#0F172A' : '#CBD5E1',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    transform: justFilled ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: justFilled ? `0 0 0 3px ${TEAL}25` : 'none',
                    transition: 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    fontFamily: f.mono ? 'ui-monospace, monospace' : 'inherit',
                  }}>
                    {filled ? f.value : '—'}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ====== CARİ KARTI ====== */}
          <div style={{
            borderRadius: 16,
            background: 'white',
            border: cariJustCreated ? `1.5px solid ${TEAL}` : '1px solid #F1F5F9',
            boxShadow: cariJustCreated
              ? `0 0 0 4px ${TEAL}20, 0 12px 32px rgba(26,188,156,0.18)`
              : '0 8px 30px rgba(15,23,42,0.06)',
            padding: '14px 16px',
            opacity: cariVisible ? 1 : 0,
            transform: cariVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.3, 0.64, 1)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {cariJustCreated && (
              <div style={{
                position: 'absolute', top: 0, left: '-60%', width: '50%', height: '100%',
                background: 'linear-gradient(105deg, transparent, rgba(255,255,255,0.9), transparent)',
                animation: 'fatuShine 1.1s ease-out',
                pointerEvents: 'none',
              }} />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{
                fontSize: 8.5, fontWeight: 800, letterSpacing: 0.8,
                padding: '2px 8px', borderRadius: 20,
                background: GRADIENT, color: 'white',
              }}>
                YENİ
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>
                Cari kartı otomatik oluşturuldu
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: GRADIENT,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 14, fontWeight: 800,
                fontFamily: 'Montserrat, sans-serif',
              }}>
                Y
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11.5, fontWeight: 700, color: '#0F172A',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  YILDIZ KIRTASİYE VE OFİS MALZ.
                </div>
                <div style={{ fontSize: 9.5, color: '#94A3B8', fontFamily: 'ui-monospace, monospace' }}>
                  VKN 1234567890 · Firma
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 8.5, color: '#94A3B8', fontWeight: 600 }}>BAKİYE</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#DC2626' }}>
                  -48.271,20 ₺
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====== EXCEL TOAST ====== */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%',
        transform: showToast ? 'translate(-50%, 0)' : 'translate(-50%, 140%)',
        opacity: showToast ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.34, 1.3, 0.64, 1)',
        background: 'white', borderRadius: 14, padding: '12px 20px',
        boxShadow: '0 12px 40px rgba(15,23,42,0.18)',
        display: 'flex', alignItems: 'center', gap: 12,
        border: '1px solid #F1F5F9',
        whiteSpace: 'nowrap',
        zIndex: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, background: GRADIENT,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 15, fontWeight: 800,
        }}>
          ⬇
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
            faturalar_2026.xlsx indirildi
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>
            Logo · Mikro · Luca uyumlu
          </div>
        </div>
        <span style={{
          marginLeft: 6, width: 20, height: 20, borderRadius: '50%',
          background: '#DCFCE7', color: '#16A34A',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800,
        }}>✓</span>
      </div>

      <style>{`
        @keyframes fatuShine {
          0% { left: -60%; }
          100% { left: 120%; }
        }
        @media (max-width: 640px) {
          .fatu-grid { grid-template-columns: 1fr !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; animation: none !important; }
        }
      `}</style>
    </div>
  )
}

// ====== Tespit edilebilir bölge — kutu elemanın KENDİSİNE kilitli ======
function Detectable({ label, active, children, block = false, labelRight = false }: {
  label: string; active: boolean; children: React.ReactNode; block?: boolean; labelRight?: boolean
}) {
  return (
    <div style={{
      position: 'relative',
      display: block ? 'block' : 'inline-block',
      borderRadius: 8,
      padding: 5,
      margin: -5,
      border: active ? `1.5px solid ${TEAL}` : '1.5px solid transparent',
      background: active ? `${TEAL}0d` : 'transparent',
      transform: active ? 'scale(1)' : 'scale(1.04)',
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    }}>
      <span style={{
        position: 'absolute',
        top: -9,
        ...(labelRight ? { right: 2 } : { left: 2 }),
        fontSize: 7, fontWeight: 800, letterSpacing: 0.8,
        padding: '1.5px 6px', borderRadius: 4,
        background: GRADIENT, color: 'white',
        boxShadow: `0 2px 8px ${TEAL}50`,
        opacity: active ? 1 : 0,
        transform: active ? 'translateY(0)' : 'translateY(4px)',
        transition: 'all 0.35s ease',
        zIndex: 4,
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      {children}
    </div>
  )
}

// ====== Uçan dosya kartı (PDF / JPG) ======
function FileCard({ type, color, name, flying, delay }: {
  type: string; color: string; name: string; flying: boolean; delay: number
}) {
  const [arrived, setArrived] = useState(false)

  useEffect(() => {
    if (flying) {
      const id = setTimeout(() => setArrived(true), delay)
      return () => clearTimeout(id)
    }
    setArrived(false)
  }, [flying, delay])

  return (
    <div style={{
      width: 92, padding: '14px 10px', borderRadius: 12,
      background: 'white',
      border: '1px solid #E2E8F0',
      boxShadow: '0 8px 24px rgba(15,23,42,0.10)',
      textAlign: 'center',
      transform: arrived
        ? 'translateY(0) rotate(0deg) scale(1)'
        : `translateY(-180px) rotate(${type === 'PDF' ? -10 : 10}deg) scale(0.85)`,
      opacity: arrived ? 1 : 0,
      transition: 'all 0.85s cubic-bezier(0.34, 1.4, 0.64, 1)',
    }}>
      <div style={{
        width: 38, height: 46, margin: '0 auto 8px', borderRadius: 6, position: 'relative',
        background: `${color}12`, border: `1.5px solid ${color}35`,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6,
        boxSizing: 'border-box',
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 11, height: 11,
          background: `${color}30`,
          borderRadius: '0 6px 0 8px',
        }} />
        <span style={{ fontSize: 9, fontWeight: 800, color, letterSpacing: 0.5 }}>{type}</span>
      </div>
      <div style={{
        fontSize: 9, fontWeight: 600, color: '#475569',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {name}
      </div>
    </div>
  )
}

function Pulse({ color }: { color: string }) {
  return (
    <span style={{ position: 'relative', width: 10, height: 10, display: 'inline-block', flexShrink: 0 }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color }} />
      <span style={{
        position: 'absolute', inset: -3, borderRadius: '50%', border: `2px solid ${color}`,
        opacity: 0.4, animation: 'fatuPing 1.2s ease-out infinite',
      }} />
      <style>{`
        @keyframes fatuPing {
          0% { transform: scale(0.6); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </span>
  )
}

function CheckDot() {
  return (
    <span style={{
      width: 16, height: 16, borderRadius: '50%',
      background: 'linear-gradient(135deg, #2456DB, #1ABC9C)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: 10, fontWeight: 800, flexShrink: 0,
    }}>✓</span>
  )
}
