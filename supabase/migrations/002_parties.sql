-- Cari (taraflar) tablosu
CREATE TABLE IF NOT EXISTS parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  party_type text NOT NULL CHECK (party_type IN ('corporate', 'individual')),
  tax_id text NOT NULL,
  name text NOT NULL,
  tax_office text,
  address text,
  phone text,
  email text,
  iban text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, tax_id)
);

CREATE INDEX IF NOT EXISTS parties_user_id_idx ON parties(user_id);
CREATE INDEX IF NOT EXISTS parties_tax_id_idx ON parties(tax_id);

-- RLS
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parties_select_own" ON parties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "parties_insert_own" ON parties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "parties_update_own" ON parties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "parties_delete_own" ON parties
  FOR DELETE USING (auth.uid() = user_id);

-- Faturaya bağlantı kolonları
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS seller_party_id uuid REFERENCES parties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS buyer_party_id uuid REFERENCES parties(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS invoices_seller_party_idx ON invoices(seller_party_id);
CREATE INDEX IF NOT EXISTS invoices_buyer_party_idx ON invoices(buyer_party_id);
