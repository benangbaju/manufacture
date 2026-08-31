-- ============================================================
-- SQL Migration: Setup Saldo Awal & Migrasi Data (Opening Balance)
-- Target: Supabase (Postgres)
-- ============================================================

-- 1. Tabel Konfigurasi Aplikasi (App Settings / Saldo Kas Awal)
create table if not exists app_settings (
  id            serial primary key,
  key           text not null unique,
  value         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_app_settings_updated_at on app_settings;
create trigger trg_app_settings_updated_at
  before update on app_settings
  for each row execute function update_updated_at();

-- Default initial settings if not present
insert into app_settings (key, value) values
  ('initial_cash_balance', '0'),
  ('cutoff_date', current_date::text),
  ('cutoff_notes', 'Saldo awal migrasi sistem')
on conflict (key) do nothing;

-- 2. Penambahan Kolom Modal / Saldo Awal pada Master Persediaan
-- 2a. Master Kain: initial_unit_price (harga beli / modal awal per meter)
alter table fabric_stock
  add column if not exists initial_unit_price numeric(14,2) not null default 0 check (initial_unit_price >= 0);

-- 2b. Master Bahan Baku: initial_unit_price (harga beli / modal awal per unit/pcs)
alter table raw_materials
  add column if not exists initial_unit_price numeric(14,2) not null default 0 check (initial_unit_price >= 0);

-- 2c. Master Varian Produk: initial_hpp (estimasi modal HPP per pcs baju jadi awal)
alter table product_variants
  add column if not exists initial_hpp numeric(14,2) not null default 0 check (initial_hpp >= 0);

-- 2d. Resep BOM Produk: support variant_id (resep per varian warna)
alter table product_recipes
  add column if not exists variant_id integer references product_variants(id) on delete cascade;

-- Hapus constraint unik lama (article_id, raw_material_id) agar tiap varian warna bisa menggunakan bahan baku yang sama
alter table if exists product_recipes
  drop constraint if exists product_recipes_article_id_raw_material_id_key;

drop index if exists product_recipes_article_id_raw_material_id_key;

create index if not exists idx_product_recipes_variant on product_recipes(variant_id);

create unique index if not exists idx_product_recipes_variant_raw_material 
  on product_recipes (variant_id, raw_material_id) 
  where variant_id is not null;


-- 3. Pembaruan VIEW: v_current_cash_balance (Menghitung Saldo Kas Awal)
drop view if exists v_current_cash_balance cascade;
create or replace view v_current_cash_balance as
with settings as (
  select coalesce(max(case when key = 'initial_cash_balance' then nullif(value, '')::numeric else 0 end), 0) as initial_cash
  from app_settings
),
cash_in as (
  select coalesce(sum(qty * sale_price), 0) as total_cash_in,
         coalesce(sum(case when item_grade = 'grade_a' then qty * sale_price else 0 end), 0) as regular_cash_in,
         coalesce(sum(case when item_grade = 'reject' then qty * sale_price else 0 end), 0) as reject_cash_in
  from sales
),
cash_out_purchases as (
  select coalesce(sum(qty * unit_price), 0) as total_purchases
  from purchases
),
cash_out_labor as (
  select coalesce(sum(amount), 0) as total_labor
  from production_costs
),
cash_out_expenses as (
  select coalesce(sum(amount), 0) as total_expenses
  from expenses
)
select
  coalesce(st.initial_cash, 0) as initial_cash_balance,
  ci.total_cash_in,
  ci.regular_cash_in,
  ci.reject_cash_in,
  cop.total_purchases,
  col.total_labor,
  coe.total_expenses,
  (cop.total_purchases + col.total_labor + coe.total_expenses) as total_cash_out,
  (coalesce(st.initial_cash, 0) + ci.total_cash_in - (cop.total_purchases + col.total_labor + coe.total_expenses)) as current_cash_balance
from settings st, cash_in ci, cash_out_purchases cop, cash_out_labor col, cash_out_expenses coe;


-- 4. Nonaktifkan Row-Level Security (RLS) & Berikan Akses Penuh ke Tabel
alter table if exists articles disable row level security;
alter table if exists product_variants disable row level security;
alter table if exists raw_materials disable row level security;
alter table if exists fabric_stock disable row level security;
alter table if exists product_recipes disable row level security;
alter table if exists variant_fabric_mapping disable row level security;
alter table if exists sales_channels disable row level security;
alter table if exists purchases disable row level security;
alter table if exists production_batches disable row level security;
alter table if exists production_batch_materials disable row level security;
alter table if exists production_costs disable row level security;
alter table if exists sales disable row level security;
alter table if exists expenses disable row level security;
alter table if exists app_settings disable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

