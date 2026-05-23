export type PartyType = 'corporate' | 'individual'

export interface Party {
  id: string
  user_id: string
  party_type: PartyType
  tax_id: string
  name: string
  tax_office: string | null
  address: string | null
  phone: string | null
  email: string | null
  iban: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PartyWithBalance extends Party {
  invoice_count: number
  total_purchase: number
  total_sale: number
  balance: number
}

export interface InvoiceItem {
  id?: string
  invoice_id?: string
  description: string
  quantity: number
  unit_price: number
  vat_rate: number
  vat_amount: number
  total_price: number
  sort_order?: number
}

export interface Invoice {
  id?: string
  user_id?: string

  // Auto-extracted
  invoice_number: string | null
  invoice_date: string | null
  due_date: string | null
  ettn: string | null

  seller_name: string | null
  seller_tax_id: string | null
  seller_tax_office: string | null
  seller_address: string | null

  buyer_name: string | null
  buyer_tax_id: string | null
  buyer_tax_office: string | null
  buyer_address: string | null

  currency: string
  subtotal: number | null
  vat_amount: number | null
  total_amount: number | null

  source: 'qr_scan' | 'file_upload' | 'manual'
  qr_raw_data: string | null
  file_url: string | null

  // Manual fields
  invoice_type: 'purchase' | 'sale' | null
  accounting_code: string | null
  cost_center: string | null
  project_code: string | null
  payment_status: 'pending' | 'paid' | 'overdue'
  payment_date: string | null
  vat_deductible: boolean
  notes: string | null
  category: string | null

  seller_party_id: string | null
  buyer_party_id: string | null

  status: 'draft' | 'confirmed'
  created_at?: string
  updated_at?: string
  items?: InvoiceItem[]
}

export interface ExtractedInvoiceData {
  invoice_number: string | null
  invoice_date: string | null
  due_date: string | null
  ettn: string | null
  seller_name: string | null
  seller_tax_id: string | null
  seller_tax_office: string | null
  seller_address: string | null
  buyer_name: string | null
  buyer_tax_id: string | null
  buyer_tax_office: string | null
  buyer_address: string | null
  currency: string | null
  subtotal: number | null
  vat_amount: number | null
  total_amount: number | null
  items: Array<{
    description: string
    quantity: number
    unit_price: number
    vat_rate: number
    total_price: number
  }>
}

export const AUTO_EXTRACTED_FIELDS: (keyof Invoice)[] = [
  'invoice_number', 'invoice_date', 'due_date', 'ettn',
  'seller_name', 'seller_tax_id', 'seller_tax_office', 'seller_address',
  'buyer_name', 'buyer_tax_id', 'buyer_tax_office', 'buyer_address',
  'currency', 'subtotal', 'vat_amount', 'total_amount',
]

export const MANUAL_REQUIRED_FIELDS: (keyof Invoice)[] = [
  'invoice_type', 'accounting_code', 'vat_deductible',
]
