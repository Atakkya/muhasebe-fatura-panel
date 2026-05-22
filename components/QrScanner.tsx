'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser'
import { DecodeHintType, BarcodeFormat } from '@zxing/library'

interface Props {
  onScan: (data: string) => void
  onClose: () => void
}

export default function QrScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const onScanRef = useRef(onScan)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE])
    hints.set(DecodeHintType.TRY_HARDER, true)
    const reader = new BrowserMultiFormatReader(hints)

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream
        return reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result, _err, controls) => {
            if (result) {
              controls?.stop()
              setScanning(false)
              onScanRef.current(result.getText())
            }
          }
        )
      })
      .then(controls => {
        controlsRef.current = controls
      })
      .catch(() => {
        setError('Kamera erişimi reddedildi veya mevcut değil.')
      })

    return () => {
      controlsRef.current?.stop()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#141414] border border-[#333] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#222]">
          <span className="font-medium text-white">QR Kod Tara</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm p-4 text-center">
              {error}
            </div>
          ) : (
            <>
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-72 h-72">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-teal-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-teal-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-teal-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-teal-400 rounded-br-lg" />
                  {scanning && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-teal-400 animate-bounce" />
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 text-center text-sm text-gray-500">
          Faturadaki QR kodu kamera çerçevesine getirin
        </div>
      </div>
    </div>
  )
}
