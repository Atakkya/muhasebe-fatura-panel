import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FaturaPanel — Muhasebe & Fatura Takip",
  description: "QR kod ve PDF'den otomatik fatura okuma ve muhasebe paneli",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full bg-[#0a0a0a] text-white">{children}</body>
    </html>
  );
}
