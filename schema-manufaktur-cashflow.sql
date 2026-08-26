-- ============================================================
-- SQL Schema: Aplikasi Cash Flow, Manufaktur & Inventory Tracking
-- Target: Supabase (Postgres)
-- Versi: 2.0 — Skema Lengkap & Mockup Seed Data Siap Pakai
-- Catatan: Internal/single-user -> RLS dinonaktifkan untuk kecepatan maksimal.
-- ============================================================

-- ------------------------------------------------------------
-- 0. HELPER: AUTO-UPDATE updated_at
-- ------------------------------------------------------------
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- ------------------------------------------------------------
-- 1. MASTER PRODUK: ARTIKEL & VARIAN (ARTIKEL + WARNA)
-- ------------------------------------------------------------
create table if not exists articles (
  id            serial primary key,
  name          text not null unique,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_articles_updated_at on articles;
create trigger trg_articles_updated_at
  before update on articles
  for each row execute function update_updated_at();

create table if not exists product_variants (
  id                serial primary key,
  article_id        integer not null references articles(id) on delete cascade,
  color             text not null,
  stock_qty         integer not null default 0 check (stock_qty >= 0), -- Stok Siap Jual (Grade A)
  stock_reject_qty  integer not null default 0 check (stock_reject_qty >= 0), -- Stok Barang Reject (Cacat / Afkir)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (article_id, color)
);

drop trigger if exists trg_product_variants_updated_at on product_variants;
create trigger trg_product_variants_updated_at
  before update on product_variants
  for each row execute function update_updated_at();

create index if not exists idx_product_variants_article on product_variants(article_id);


-- ------------------------------------------------------------
-- 2. BAHAN BAKU: RASIO TETAP (kancing, label, resleting, benang)
-- ------------------------------------------------------------
create table if not exists raw_materials (
  id            serial primary key,
  name          text not null unique,
  unit          text not null default 'pcs',
  stock_qty     numeric(12,2) not null default 0 check (stock_qty >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_raw_materials_updated_at on raw_materials;
create trigger trg_raw_materials_updated_at
  before update on raw_materials
  for each row execute function update_updated_at();


-- ------------------------------------------------------------
-- 3. KAIN: STOK ROLL PER WARNA (yield potong variatif)
-- ------------------------------------------------------------
create table if not exists fabric_stock (
  id            serial primary key,
  name          text not null unique,
  unit          text not null default 'meter',
  stock_qty     numeric(12,2) not null default 0 check (stock_qty >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_fabric_stock_updated_at on fabric_stock;
create trigger trg_fabric_stock_updated_at
  before update on fabric_stock
  for each row execute function update_updated_at();


-- ------------------------------------------------------------
-- 4. RESEP PRODUK (BOM) — Kebutuhan Bahan Rasio-Tetap per Artikel
-- ------------------------------------------------------------
create table if not exists product_recipes (
  id               serial primary key,
  article_id       integer not null references articles(id) on delete cascade,
  raw_material_id  integer not null references raw_materials(id) on delete restrict,
  qty_per_unit     numeric(12,4) not null check (qty_per_unit > 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (article_id, raw_material_id)
);

drop trigger if exists trg_product_recipes_updated_at on product_recipes;
create trigger trg_product_recipes_updated_at
  before update on product_recipes
  for each row execute function update_updated_at();

create index if not exists idx_product_recipes_article on product_recipes(article_id);


-- ------------------------------------------------------------
-- 5. PEMETAAN VARIAN WARNA → KAIN ROLL
-- ------------------------------------------------------------
create table if not exists variant_fabric_mapping (
  id              serial primary key,
  variant_id      integer not null references product_variants(id) on delete cascade,
  fabric_stock_id integer not null references fabric_stock(id) on delete restrict,
  is_primary      boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (variant_id, fabric_stock_id)
);

create index if not exists idx_variant_fabric_variant on variant_fabric_mapping(variant_id);


-- ------------------------------------------------------------
-- 6. CHANNEL PENJUALAN
-- ------------------------------------------------------------
create table if not exists sales_channels (
  id            serial primary key,
  name          text not null unique,
  created_at    timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 7. PEMBELIAN BAHAN (Kain Roll atau Bahan Baku)
-- ------------------------------------------------------------
create table if not exists purchases (
  id               serial primary key,
  item_type        text not null check (item_type in ('raw_material', 'fabric')),
  raw_material_id  integer references raw_materials(id) on delete restrict,
  fabric_stock_id  integer references fabric_stock(id) on delete restrict,
  qty              numeric(12,2) not null check (qty > 0),
  unit_price       numeric(14,2) not null check (unit_price >= 0),
  supplier         text,
  purchase_date    date not null default current_date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (
    (item_type = 'raw_material' and raw_material_id is not null and fabric_stock_id is null)
    or
    (item_type = 'fabric' and fabric_stock_id is not null and raw_material_id is null)
  )
);

drop trigger if exists trg_purchases_updated_at on purchases;
create trigger trg_purchases_updated_at
  before update on purchases
  for each row execute function update_updated_at();

create index if not exists idx_purchases_date on purchases(purchase_date);


-- ------------------------------------------------------------
-- 8. PRODUKSI & PEMAKAIAN BAHAN
-- ------------------------------------------------------------
create table if not exists production_batches (
  id               serial primary key,
  variant_id       integer not null references product_variants(id) on delete restrict,
  qty_produced     integer not null default 0 check (qty_produced >= 0), -- Hasil Jadi Bagus (Siap Jual / Grade A)
  qty_reject       integer not null default 0 check (qty_reject >= 0),   -- Hasil Reject (Cacat / Afkir)
  fabric_stock_id  integer not null references fabric_stock(id) on delete restrict,
  fabric_used      numeric(12,2) not null check (fabric_used > 0),
  production_date  date not null default current_date,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (qty_produced + qty_reject > 0)
);

drop trigger if exists trg_production_batches_updated_at on production_batches;
create trigger trg_production_batches_updated_at
  before update on production_batches
  for each row execute function update_updated_at();

create index if not exists idx_production_batches_variant on production_batches(variant_id);
create index if not exists idx_production_batches_date on production_batches(production_date);

create table if not exists production_batch_materials (
  id               serial primary key,
  batch_id         integer not null references production_batches(id) on delete cascade,
  raw_material_id  integer not null references raw_materials(id) on delete restrict,
  qty_used         numeric(12,2) not null check (qty_used >= 0),
  created_at       timestamptz not null default now()
);

create index if not exists idx_batch_materials_batch on production_batch_materials(batch_id);

create table if not exists production_costs (
  id            serial primary key,
  batch_id      integer not null references production_batches(id) on delete cascade,
  cost_type     text not null,
  amount        numeric(14,2) not null check (amount >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_production_costs_updated_at on production_costs;
create trigger trg_production_costs_updated_at
  before update on production_costs
  for each row execute function update_updated_at();

create index if not exists idx_production_costs_batch on production_costs(batch_id);


-- ------------------------------------------------------------
-- 9. PENJUALAN PRODUK
-- ------------------------------------------------------------
create table if not exists sales (
  id            serial primary key,
  variant_id    integer not null references product_variants(id) on delete restrict,
  channel_id    integer not null references sales_channels(id) on delete restrict,
  item_grade    text not null default 'grade_a' check (item_grade in ('grade_a', 'reject')), -- Grade A (Barang Bagus) vs Reject (Cuci Gudang / B-Grade)
  qty           integer not null check (qty > 0),
  sale_price    numeric(14,2) not null check (sale_price >= 0),
  sale_date     date not null default current_date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_sales_updated_at on sales;
create trigger trg_sales_updated_at
  before update on sales
  for each row execute function update_updated_at();

create index if not exists idx_sales_variant on sales(variant_id);
create index if not exists idx_sales_date on sales(sale_date);
create index if not exists idx_sales_channel on sales(channel_id);
create index if not exists idx_sales_grade on sales(item_grade);


-- ------------------------------------------------------------
-- 10. PENGELUARAN OPERASIONAL
-- ------------------------------------------------------------
create table if not exists expenses (
  id            serial primary key,
  category      text not null,
  amount        numeric(14,2) not null check (amount >= 0),
  expense_date  date not null default current_date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_expenses_updated_at on expenses;
create trigger trg_expenses_updated_at
  before update on expenses
  for each row execute function update_updated_at();

create index if not exists idx_expenses_date on expenses(expense_date);


-- ------------------------------------------------------------
-- 11. VIEW BANTUAN: HPP & LABA RUGI (P&L) DENGAN SEGREGASI REJECT
-- ------------------------------------------------------------
create or replace view v_monthly_production_cost as
with avg_material_price as (
  select raw_material_id,
         sum(qty * unit_price) / nullif(sum(qty), 0) as avg_price
  from purchases
  where item_type = 'raw_material'
  group by raw_material_id
),
avg_fabric_price as (
  select fabric_stock_id,
         sum(qty * unit_price) / nullif(sum(qty), 0) as avg_price
  from purchases
  where item_type = 'fabric'
  group by fabric_stock_id
),
batch_material_cost as (
  select pbm.batch_id,
         sum(pbm.qty_used * coalesce(amp.avg_price, 0)) as material_cost
  from production_batch_materials pbm
  left join avg_material_price amp on amp.raw_material_id = pbm.raw_material_id
  group by pbm.batch_id
),
batch_fabric_cost as (
  select pb.id as batch_id,
         pb.fabric_used * coalesce(afp.avg_price, 0) as fabric_cost
  from production_batches pb
  left join avg_fabric_price afp on afp.fabric_stock_id = pb.fabric_stock_id
),
batch_overhead as (
  select batch_id, sum(amount) as overhead_cost
  from production_costs
  group by batch_id
)
select
  date_trunc('month', pb.production_date)::date as month,
  pb.variant_id,
  sum(pb.qty_produced)                           as total_qty_produced,   -- Barang Jadi Bagus (Grade A)
  sum(pb.qty_reject)                             as total_qty_reject,     -- Barang Reject (Cacat / Afkir)
  sum(pb.qty_produced + pb.qty_reject)           as total_qty_processed,  -- Total Dipotong / Diproses
  round(
    sum(pb.qty_reject)::numeric / nullif(sum(pb.qty_produced + pb.qty_reject), 0) * 100,
    2
  )                                              as reject_rate_pct,      -- Persentase Reject (%)
  coalesce(sum(bmc.material_cost), 0)            as total_material_cost,
  coalesce(sum(bfc.fabric_cost), 0)              as total_fabric_cost,
  coalesce(sum(bo.overhead_cost), 0)             as total_overhead_cost,
  coalesce(sum(bmc.material_cost), 0)
    + coalesce(sum(bfc.fabric_cost), 0)
    + coalesce(sum(bo.overhead_cost), 0)         as total_production_cost,
  -- HPP per pcs barang jadi bagus (biaya produksi total diserap oleh unit siap jual):
  round(
    ( coalesce(sum(bmc.material_cost), 0)
      + coalesce(sum(bfc.fabric_cost), 0)
      + coalesce(sum(bo.overhead_cost), 0)
    ) / nullif(sum(pb.qty_produced), 0),
    2
  )                                              as avg_hpp_per_unit,
  -- Biaya rata-rata per unit yang diproses (termasuk reject):
  round(
    ( coalesce(sum(bmc.material_cost), 0)
      + coalesce(sum(bfc.fabric_cost), 0)
      + coalesce(sum(bo.overhead_cost), 0)
    ) / nullif(sum(pb.qty_produced + pb.qty_reject), 0),
    2
  )                                              as avg_cost_per_processed_unit
from production_batches pb
left join batch_material_cost bmc on bmc.batch_id = pb.id
left join batch_fabric_cost bfc   on bfc.batch_id = pb.id
left join batch_overhead bo       on bo.batch_id  = pb.id
group by 1, 2;


create or replace view v_monthly_pl as
with regular_revenue as (
  select date_trunc('month', sale_date)::date as month,
         sum(qty * sale_price) as regular_revenue,
         sum(qty) as regular_qty_sold
  from sales
  where item_grade = 'grade_a'
  group by 1
),
reject_revenue as (
  select date_trunc('month', sale_date)::date as month,
         sum(qty * sale_price) as reject_revenue,
         sum(qty) as reject_qty_sold
  from sales
  where item_grade = 'reject'
  group by 1
),
cogs as (
  select date_trunc('month', s.sale_date)::date as month,
         sum(s.qty * coalesce(mc.avg_hpp_per_unit, 0)) as total_cogs
  from sales s
  left join v_monthly_production_cost mc
    on mc.variant_id = s.variant_id
   and mc.month = date_trunc('month', s.sale_date)::date
  where s.item_grade = 'grade_a'
  group by 1
),
opex as (
  select date_trunc('month', expense_date)::date as month,
         sum(amount) as total_expenses
  from expenses
  group by 1
)
select
  coalesce(rr.month, rj.month, c.month, e.month) as month,
  coalesce(rr.regular_revenue, 0)                as regular_revenue,
  coalesce(rr.regular_qty_sold, 0)               as regular_qty_sold,
  coalesce(rj.reject_revenue, 0)                 as reject_revenue,
  coalesce(rj.reject_qty_sold, 0)                as reject_qty_sold,
  (coalesce(rr.regular_revenue, 0) 
    + coalesce(rj.reject_revenue, 0))            as total_revenue,
  coalesce(c.total_cogs, 0)                      as cogs,
  (coalesce(rr.regular_revenue, 0) - coalesce(c.total_cogs, 0)) as regular_gross_profit,
  ((coalesce(rr.regular_revenue, 0) - coalesce(c.total_cogs, 0)) 
    + coalesce(rj.reject_revenue, 0))            as gross_profit,
  coalesce(e.total_expenses, 0)                  as expenses,
  (((coalesce(rr.regular_revenue, 0) - coalesce(c.total_cogs, 0)) 
    + coalesce(rj.reject_revenue, 0)) 
    - coalesce(e.total_expenses, 0))             as net_profit
from regular_revenue rr
full outer join reject_revenue rj on rj.month = rr.month
full outer join cogs c on c.month = coalesce(rr.month, rj.month)
full outer join opex e on e.month = coalesce(rr.month, rj.month, c.month)
order by 1 desc;


-- ------------------------------------------------------------
-- 11b. VIEW BANTUAN: SALDO KAS & TOTAL UANG SAAT INI (REAL CASH FLOW)
-- ------------------------------------------------------------
create or replace view v_current_cash_balance as
with cash_in as (
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
  ci.total_cash_in,
  ci.regular_cash_in,
  ci.reject_cash_in,
  cop.total_purchases,
  col.total_labor,
  coe.total_expenses,
  (cop.total_purchases + col.total_labor + coe.total_expenses) as total_cash_out,
  (ci.total_cash_in - (cop.total_purchases + col.total_labor + coe.total_expenses)) as current_cash_balance
from cash_in ci, cash_out_purchases cop, cash_out_labor col, cash_out_expenses coe;


-- ------------------------------------------------------------
-- 11c. VIEW BANTUAN: RINGKASAN INVENTORI PRODUK (BAGUS VS REJECT)
-- ------------------------------------------------------------
create or replace view v_inventory_summary as
select
  a.id as article_id,
  a.name as article_name,
  pv.id as variant_id,
  pv.color,
  pv.stock_qty as stock_good_qty,
  pv.stock_reject_qty,
  (pv.stock_qty + pv.stock_reject_qty) as total_physical_stock,
  round(
    pv.stock_reject_qty::numeric / nullif(pv.stock_qty + pv.stock_reject_qty, 0) * 100,
    1
  ) as reject_stock_pct,
  pv.updated_at
from product_variants pv
join articles a on a.id = pv.article_id
order by a.id, pv.color;


-- ============================================================
-- 12. DEFAULT CHANNELS (OPSIONAL - BISA DIUBAH / DIHAPUS)
-- ============================================================
insert into sales_channels (name) values
  ('Shopee'),
  ('TikTok Shop'),
  ('Website'),
  ('Offline Store'),
  ('WhatsApp / Chat')
on conflict (name) do nothing;
