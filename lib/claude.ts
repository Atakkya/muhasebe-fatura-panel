import Anthropic from '@anthropic-ai/sdk'
import { ExtractedInvoiceData } from './types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Sen bir fatura analiz asistanısın. Sana verilen fatura görselinden tüm bilgileri JSON formatında çıkarırsın. Eğer bir alan okunamazsa veya yoksa null döndürürsün. Tarih formatı YYYY-MM-DD olmalı. Sadece JSON döndür, başka açıklama ekleme.`

export async function extractInvoiceFromImage(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/png'
): Promise<ExtractedInvoiceData> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Image },
          },
          {
            type: 'text',
            text: `Bu fatura görselinden şu alanları JSON olarak çıkar:
{
  "invoice_number": "string|null",
  "invoice_date": "YYYY-MM-DD|null",
  "due_date": "YYYY-MM-DD|null",
  "ettn": "UUID formatında ETTN|null",
  "seller_name": "string|null",
  "seller_tax_id": "VKN veya TCKN|null",
  "seller_tax_office": "string|null",
  "seller_address": "string|null",
  "buyer_name": "string|null",
  "buyer_tax_id": "string|null",
  "buyer_tax_office": "string|null",
  "buyer_address": "string|null",
  "currency": "TRY|USD|EUR|null",
  "subtotal": number|null,
  "vat_amount": number|null,
  "total_amount": number|null,
  "items": [{"description":"string","quantity":number,"unit_price":number,"vat_rate":number,"total_price":number}]
}`,
          },
        ],
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude geçerli JSON döndürmedi')

  const data = JSON.parse(jsonMatch[0])
  return {
    ...data,
    currency: data.currency ?? 'TRY',
    items: data.items ?? [],
  }
}
