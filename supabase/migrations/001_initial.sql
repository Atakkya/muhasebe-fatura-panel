create extension if not exists "uuid-ossp";

create table invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Auto-extracted
  invoice_number text,
  invoice_date date,
  due_date date,
  ettn text,

  seller_name text,
  seller_tax_id text,
  seller_tax_office text,
  seller_address text,

  buyer_name text,
  buyer_tax_id text,
  buyer_tax_office text,
  buyer_address text,

  currency text default 'TRY',
  subtotal numeric(15,2),
  vat_amount numeric(15,2),
  total_amount numeric(15,2),

  source text check (source in ('qr_scan', 'file_upload', 'manual')) default 'manual',
  qr_raw_data text,
  file_url text,

  -- Manual fields
  invoice_type text check (invoice_type in ('purchase', 'sale')),
  accounting_code text,
  cost_center text,
  project_code text,
  payment_status text check (payment_status in ('pending', 'paid', 'overdue')) default 'pending',
  payment_date date,
  vat_deductible boolean default true,
  notes text,
  category text,

  status text check (status in ('draft', 'confirmed')) default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade not null,
  description text,
  quantity numeric(10,4) default 1,
  unit_price numeric(15,2) default 0,
  vat_rate integer default 20,
  vat_amount numeric(15,2) default 0,
  total_price numeric(15,2) default 0,
  sort_order integer default 0
);

alter table invoices enable row level security;
alter table invoice_items enable row level security;

create policy "Users see own invoices" on invoices
  for all using (auth.uid() = user_id);

create policy "Users see own invoice items" on invoice_items
  for all using (
    invoice_id in (select id from invoices where user_id = auth.uid())
  );

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger invoices_updated_at before update on invoices
  for each row execute procedure update_updated_at();
