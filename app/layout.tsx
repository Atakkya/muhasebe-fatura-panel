import type { Metadata } from 'next'
import { Montserrat, Open_Sans } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Fatu — AI Destekli Fatura Yönetimi',
  description: 'QR kod ve PDF\'den otomatik fatura okuma, cari sistemi ve Excel export.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`h-full antialiased ${montserrat.variable} ${openSans.variable}`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
