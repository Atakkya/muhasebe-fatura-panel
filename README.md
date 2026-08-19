# Fatu — AI-Powered Invoice Management Panel

A full-stack SaaS application that automates Turkish e-invoice processing using Claude AI. Scan a QR code or upload a PDF and the app extracts all invoice data automatically — no manual entry required.

## Features

- **AI Extraction** — Claude Sonnet reads invoices (PDF/image) and fills in all fields automatically: invoice number, ETTN, parties, line items, VAT, totals
- **QR Code Scanner** — Camera-based QR scanning for Turkish e-invoices
- **Bulk Upload** — Process multiple invoices at once with per-file status tracking
- **Party (CRM) Management** — Auto-creates customer/supplier records with running balance calculation
- **Excel Export** — Two-sheet export: invoice summary + line item details
- **Dashboard** — Overview of total purchases, sales, and pending payments

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Anthropic Claude Sonnet |
| PDF/QR | pdfjs-dist, @zxing/browser, jsqr |
| Export | xlsx |

## Getting Started

```bash
npm install
cp .env.example .env.local   # add Supabase and Anthropic keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # login, register
│   ├── (dashboard)/     # invoices, parties, dashboard
│   └── api/             # extract, invoices, parties, export
└── components/          # InvoiceForm, QrScanner, BulkUploadModal, ...
```

## Screenshots

> Coming soon

## License

MIT
