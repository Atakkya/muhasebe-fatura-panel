import * as XLSX from 'xlsx'
import { Invoice } from '@/lib/types'

interface InvoiceForExport extends Invoice {
  items?: Array<{
    description: string
    quantity: number
    unit_price: number
    vat_rate: number
    vat_amount: number
    total_price: number
  }>
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return ''
  try {
    const date = new Date(d)
    return date.toLocaleDateString('tr-TR')
  } catch {
    return d
  }
}

function fmtNumber(n: number | null | undefined): number {
  return Number(n ?? 0)
}

export function exportInvoicesToExcel(invoices: InvoiceForExport[], filename = 'faturalar.xlsx') {
  const summaryRows = invoices.map((inv, i) => ({
    'Sıra': i + 1,
    'Fatura No': inv.invoice_number ?? '',
    'Fatura Tarihi': fmtDate(inv.invoice_date),
    'Vade Tarihi': fmtDate(inv.due_date),
    'ETTN': inv.ettn ?? '',
    'Satıcı Adı': inv.seller_name ?? '',
    'Satıcı VKN': inv.seller_tax_id ?? '',
    'Satıcı Vergi Dairesi': inv.seller_tax_office ?? '',
    'Satıcı Adres': inv.seller_address ?? '',
    'Alıcı Adı': inv.buyer_name ?? '',
    'Alıcı VKN': inv.buyer_tax_id ?? '',
    'Alıcı Vergi Dairesi': inv.buyer_tax_office ?? '',
    'Para Birimi': inv.currency ?? 'TRY',
    'Ara Toplam': fmtNumber(inv.subtotal),
    'KDV Toplam': fmtNumber(inv.vat_amount),
    'Genel Toplam': fmtNumber(inv.total_amount),
    'Fatura Türü': inv.invoice_type === 'purchase' ? 'Alış' : inv.invoice_type === 'sale' ? 'Satış' : '',
    'Muhasebe Hesap Kodu': inv.accounting_code ?? '',
    'KDV İndirilebilir': inv.vat_deductible ? 'Evet' : 'Hayır',
    'Ödeme Durumu':
      inv.payment_status === 'paid' ? 'Ödendi' :
      inv.payment_status === 'overdue' ? 'Gecikmiş' : 'Bekliyor',
    'Notlar': inv.notes ?? '',
  }))

  const itemRows: Array<Record<string, string | number>> = []
  invoices.forEach((inv) => {
    if (inv.items && inv.items.length > 0) {
      inv.items.forEach((item, idx) => {
        itemRows.push({
          'Fatura No': inv.invoice_number ?? '',
          'Satıcı': inv.seller_name ?? '',
          'Sıra': idx + 1,
          'Açıklama': item.description,
          'Miktar': fmtNumber(item.quantity),
          'Birim Fiyat': fmtNumber(item.unit_price),
          'KDV %': fmtNumber(item.vat_rate),
          'KDV Tutarı': fmtNumber(item.vat_amount),
          'Toplam': fmtNumber(item.total_price),
        })
      })
    }
  })

  const wb = XLSX.utils.book_new()

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows)
  summarySheet['!cols'] = [
    { wch: 5 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 40 },
    { wch: 40 }, { wch: 14 }, { wch: 22 }, { wch: 50 },
    { wch: 40 }, { wch: 14 }, { wch: 22 },
    { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 30 },
  ]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Faturalar')

  if (itemRows.length > 0) {
    const itemsSheet = XLSX.utils.json_to_sheet(itemRows)
    itemsSheet['!cols'] = [
      { wch: 18 }, { wch: 40 }, { wch: 5 }, { wch: 40 },
      { wch: 10 }, { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 14 },
    ]
    XLSX.utils.book_append_sheet(wb, itemsSheet, 'Kalemler')
  }

  XLSX.writeFile(wb, filename)
}
