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
-- 12. SEED DATA (SESUAI LENGKAP DENGAN DATA MOCKUP APLIKASI)
-- ============================================================

-- 12.1 Sales Channels
insert into sales_channels (name) values
  ('Shopee'),
  ('TikTok Shop'),
  ('Website'),
  ('Offline Store'),
  ('WhatsApp / Chat')
on conflict (name) do nothing;


-- 12.2 Bahan Baku Rasio-Tetap
insert into raw_materials (name, unit, stock_qty) values
  ('Kancing Kemeja Putih', 'pcs', 500),
  ('Kancing Kemeja Hitam', 'pcs', 350),
  ('Label Woven Brand', 'pcs', 800),
  ('Resleting YKK 20cm', 'pcs', 200),
  ('Benang Jahit Putih', 'roll', 25),
  ('Karet Pinggang 3cm', 'meter', 100),
  ('Resleting Jaket YKK 60cm', 'pcs', 150),
  ('Benang Jahit Hitam', 'roll', 30),
  ('Tali Hoodie Katun', 'meter', 100)
on conflict (name) do update set
  stock_qty = excluded.stock_qty,
  unit = excluded.unit;


-- 12.3 Stok Kain Roll per Warna
insert into fabric_stock (name, unit, stock_qty) values
  ('Kain Denim Biru', 'meter', 50),
  ('Kain Katun Putih', 'meter', 80),
  ('Kain Katun Hitam', 'meter', 65),
  ('Kain Katun Navy', 'meter', 40),
  ('Kain Chino Khaki', 'meter', 30),
  ('Kain Parasut Hitam', 'meter', 25),
  ('Kain Baby Terry Abu-abu', 'meter', 45),
  ('Kain Chino Hitam', 'meter', 70),
  ('Kain Fleece Hitam', 'meter', 55),
  ('Kain Toyobo Putih', 'meter', 40)
on conflict (name) do update set
  stock_qty = excluded.stock_qty,
  unit = excluded.unit;


-- 12.4 Master 21 Artikel
insert into articles (id, name, description) values
  (1, 'Kemeja Lengan Panjang', 'Kemeja kasual pria katun premium'),
  (2, 'Celana Chino Pendek', 'Bahan katun twill stretch elastis'),
  (3, 'Kaos Polos Oversize', 'Cotton Combed 24s gramasi tebal'),
  (4, 'Jaket Bomber Premium', 'Parasut taslan premium windbreaker'),
  (5, 'Celana Jogger Kasual', 'Bahan baby terry elastis dengan tali'),
  (6, 'Kemeja Lengan Pendek', 'Kemeja santai bahan katun'),
  (7, 'Kemeja Flanel Kotak', 'Flanel katun premium'),
  (8, 'Kemeja Kerah Shanghai', 'Koko / kerah mandarin katun'),
  (9, 'Kaos Polos Reguler', 'Cotton Combed 30s lembut'),
  (10, 'Kaos Pocket Tee', 'Kaos kasual dengan saku dada'),
  (11, 'Kaos Kerah Polo', 'Bahan Lacoste CVC berkerah'),
  (12, 'Celana Chino Panjang', 'Celana formal & kasual twill stretch'),
  (13, 'Celana Cargo Pendek', 'Multi-pocket outdoor twill'),
  (14, 'Celana Cargo Panjang', 'Cargo pants streetwear'),
  (15, 'Celana Bahan Formal', 'Bahan semi-wool kantor'),
  (16, 'Jaket Hoodie Jumper', 'Fleece tebal 280 gsm'),
  (17, 'Jaket Zip Hoodie', 'Fleece dengan resleting depan'),
  (18, 'Jaket Coach Windbreaker', 'Outer streetwear kancing jepret'),
  (19, 'Rompi Vest Pria', 'Outer rajut / kanvas'),
  (20, 'Baju Koko Modern', 'Katun toyobo bordir minimalis'),
  (21, 'Outer Kimono / Noragi', 'Linen katun model jepang')
on conflict (name) do update set
  description = excluded.description;

-- Sinkronisasi auto-increment ID articles
select setval('articles_id_seq', (select coalesce(max(id), 1) from articles));


-- 12.5 Varian Warna (SKU) & Stok Baju Jadi (Bagus & Reject)
insert into product_variants (article_id, color, stock_qty, stock_reject_qty) values
  -- 1. Kemeja Lengan Panjang
  (1, 'Putih', 120, 4),
  (1, 'Hitam', 95, 2),
  (1, 'Navy', 75, 1),
  -- 2. Celana Chino Pendek
  (2, 'Khaki', 80, 3),
  (2, 'Hitam', 110, 5),
  (2, 'Mocca', 60, 2),
  -- 3. Kaos Polos Oversize
  (3, 'Putih', 200, 6),
  (3, 'Hitam', 180, 4),
  (3, 'Abu-abu', 140, 3),
  (3, 'Sage Green', 90, 1),
  -- 4. Jaket Bomber Premium
  (4, 'Hitam', 45, 2),
  (4, 'Navy', 35, 1),
  (4, 'Olive', 30, 1),
  -- 5. Celana Jogger Kasual
  (5, 'Hitam', 70, 3),
  (5, 'Abu-abu', 85, 2),
  -- 6. Kemeja Lengan Pendek
  (6, 'Putih', 50, 2),
  (6, 'Navy', 40, 1),
  (6, 'Olive', 35, 1),
  -- 7. Kemeja Flanel Kotak
  (7, 'Merah Hitam', 45, 2),
  (7, 'Biru Navy', 40, 1),
  -- 8. Kemeja Kerah Shanghai
  (8, 'Putih', 60, 2),
  (8, 'Abu-abu', 50, 1),
  (8, 'Hitam', 55, 2),
  -- 9. Kaos Polos Reguler
  (9, 'Hitam', 150, 5),
  (9, 'Putih', 130, 4),
  (9, 'Navy', 110, 3),
  -- 10. Kaos Pocket Tee
  (10, 'Hitam', 80, 2),
  (10, 'Putih', 75, 2),
  (10, 'Khaki', 60, 1),
  -- 11. Kaos Kerah Polo
  (11, 'Navy', 65, 2),
  (11, 'Hitam', 70, 3),
  (11, 'Maroon', 50, 1),
  -- 12. Celana Chino Panjang
  (12, 'Hitam', 90, 3),
  (12, 'Khaki', 85, 2),
  (12, 'Navy', 60, 2),
  (12, 'Abu-abu', 55, 1),
  -- 13. Celana Cargo Pendek
  (13, 'Olive', 50, 2),
  (13, 'Khaki', 45, 1),
  (13, 'Hitam', 60, 2),
  -- 14. Celana Cargo Panjang
  (14, 'Hitam', 55, 2),
  (14, 'Olive', 40, 1),
  -- 15. Celana Bahan Formal
  (15, 'Hitam', 70, 2),
  (15, 'Abu-abu Tua', 60, 2),
  -- 16. Jaket Hoodie Jumper
  (16, 'Hitam', 65, 2),
  (16, 'Abu-abu', 50, 1),
  (16, 'Navy', 45, 1),
  -- 17. Jaket Zip Hoodie
  (17, 'Hitam', 40, 2),
  (17, 'Navy', 35, 1),
  -- 18. Jaket Coach Windbreaker
  (18, 'Hitam', 50, 2),
  (18, 'Maroon', 35, 1),
  -- 19. Rompi Vest Pria
  (19, 'Hitam', 30, 1),
  (19, 'Khaki', 25, 1),
  -- 20. Baju Koko Modern
  (20, 'Putih', 70, 2),
  (20, 'Navy', 50, 1),
  (20, 'Olive', 45, 1),
  -- 21. Outer Kimono / Noragi
  (21, 'Hitam', 35, 1),
  (21, 'Navy', 30, 1)
on conflict (article_id, color) do update set
  stock_qty = excluded.stock_qty,
  stock_reject_qty = excluded.stock_reject_qty;


-- 12.6 Resep Bahan Baku Rasio-Tetap (BOM per Artikel)
insert into product_recipes (article_id, raw_material_id, qty_per_unit) values
  -- Kemeja Lengan Panjang: Kancing Putih 6 pcs, Label 1 pcs, Benang Putih 0.1 roll
  (1, (select id from raw_materials where name = 'Kancing Kemeja Putih'), 6.0),
  (1, (select id from raw_materials where name = 'Label Woven Brand'), 1.0),
  -- Celana Chino Pendek: Kancing Hitam 1 pcs, Resleting 20cm 1 pcs, Label 1 pcs, Karet 0.8 meter
  (2, (select id from raw_materials where name = 'Kancing Kemeja Hitam'), 1.0),
  (2, (select id from raw_materials where name = 'Resleting YKK 20cm'), 1.0),
  (2, (select id from raw_materials where name = 'Label Woven Brand'), 1.0),
  (2, (select id from raw_materials where name = 'Karet Pinggang 3cm'), 0.8),
  -- Kaos Polos Oversize: Label 1 pcs
  (3, (select id from raw_materials where name = 'Label Woven Brand'), 1.0),
  -- Jaket Bomber: Resleting 20cm 1 pcs, Resleting Jaket 60cm 1 pcs, Label 1 pcs, Kancing Hitam 2 pcs
  (4, (select id from raw_materials where name = 'Resleting YKK 20cm'), 1.0),
  (4, (select id from raw_materials where name = 'Resleting Jaket YKK 60cm'), 1.0),
  (4, (select id from raw_materials where name = 'Label Woven Brand'), 1.0),
  (4, (select id from raw_materials where name = 'Kancing Kemeja Hitam'), 2.0),
  -- Celana Jogger: Karet 1 meter, Tali Hoodie 1 meter, Label 1 pcs
  (5, (select id from raw_materials where name = 'Karet Pinggang 3cm'), 1.0),
  (5, (select id from raw_materials where name = 'Tali Hoodie Katun'), 1.0),
  (5, (select id from raw_materials where name = 'Label Woven Brand'), 1.0),
  -- Kemeja Lengan Pendek: Kancing Putih 6 pcs, Label 1 pcs
  (6, (select id from raw_materials where name = 'Kancing Kemeja Putih'), 6.0),
  (6, (select id from raw_materials where name = 'Label Woven Brand'), 1.0),
  -- Jaket Hoodie Jumper: Tali Hoodie 1.2 meter, Label 1 pcs
  (16, (select id from raw_materials where name = 'Tali Hoodie Katun'), 1.2),
  (16, (select id from raw_materials where name = 'Label Woven Brand'), 1.0)
on conflict (article_id, raw_material_id) do update set
  qty_per_unit = excluded.qty_per_unit;


-- 12.7 Pemetaan Varian Warna ke Kain Roll
insert into variant_fabric_mapping (variant_id, fabric_stock_id, is_primary)
select pv.id, fs.id, true
from (values
  ('Kemeja Lengan Panjang', 'Putih', 'Kain Katun Putih'),
  ('Kemeja Lengan Panjang', 'Hitam', 'Kain Katun Hitam'),
  ('Kemeja Lengan Panjang', 'Navy', 'Kain Katun Navy'),
  ('Celana Chino Pendek', 'Khaki', 'Kain Chino Khaki'),
  ('Celana Chino Pendek', 'Hitam', 'Kain Chino Hitam'),
  ('Kaos Polos Oversize', 'Abu-abu', 'Kain Baby Terry Abu-abu'),
  ('Kaos Polos Oversize', 'Putih', 'Kain Katun Putih'),
  ('Kaos Polos Oversize', 'Hitam', 'Kain Katun Hitam'),
  ('Jaket Bomber Premium', 'Hitam', 'Kain Parasut Hitam'),
  ('Jaket Bomber Premium', 'Navy', 'Kain Katun Navy'),
  ('Celana Jogger Kasual', 'Abu-abu', 'Kain Baby Terry Abu-abu'),
  ('Celana Jogger Kasual', 'Hitam', 'Kain Katun Hitam'),
  ('Baju Koko Modern', 'Putih', 'Kain Toyobo Putih'),
  ('Jaket Hoodie Jumper', 'Hitam', 'Kain Fleece Hitam')
) as t(article_name, color, fabric_name)
join articles a on a.name = t.article_name
join product_variants pv on pv.article_id = a.id and pv.color = t.color
join fabric_stock fs on fs.name = t.fabric_name
on conflict (variant_id, fabric_stock_id) do nothing;


-- 12.8 Mock Pembelian Bahan (Purchases History)
insert into purchases (item_type, raw_material_id, fabric_stock_id, qty, unit_price, supplier, purchase_date) values
  ('fabric', null, (select id from fabric_stock where name = 'Kain Katun Putih'), 50, 90000, 'Supplier Tekstil Bandung', '2026-08-26'),
  ('raw_material', (select id from raw_materials where name = 'Kancing Kemeja Putih'), null, 1000, 350, 'Toko Kancing Berkah', '2026-08-24'),
  ('fabric', null, (select id from fabric_stock where name = 'Kain Denim Biru'), 40, 120000, 'Pabrik Denim Solo', '2026-08-20'),
  ('raw_material', (select id from raw_materials where name = 'Label Woven Brand'), null, 500, 500, 'Percetakan Label Labelindo', '2026-08-15'),
  ('raw_material', (select id from raw_materials where name = 'Resleting YKK 20cm'), null, 150, 4500, 'Distributor YKK Jkt', '2026-08-05')
on conflict do nothing;


-- 12.9 Mock Produksi & Pemakaian Kain (Production Batches dengan Tracking Reject)
do $$
declare
  v_var_id_1 int;
  v_var_id_2 int;
  v_var_id_3 int;
  v_var_id_4 int;
  v_batch_1 int;
  v_batch_2 int;
  v_batch_3 int;
  v_batch_4 int;
begin
  select pv.id into v_var_id_1 from product_variants pv join articles a on a.id = pv.article_id where a.name = 'Kemeja Lengan Panjang' and pv.color = 'Putih';
  select pv.id into v_var_id_2 from product_variants pv join articles a on a.id = pv.article_id where a.name = 'Celana Chino Pendek' and pv.color = 'Khaki';
  select pv.id into v_var_id_3 from product_variants pv join articles a on a.id = pv.article_id where a.name = 'Kaos Polos Oversize' and pv.color = 'Hitam';
  select pv.id into v_var_id_4 from product_variants pv join articles a on a.id = pv.article_id where a.name = 'Jaket Bomber Premium' and pv.color = 'Navy';

  if v_var_id_1 is not null then
    -- Potong 60 pcs: 58 pcs jadi bagus (Grade A), 2 pcs reject jahit/kain
    insert into production_batches (variant_id, qty_produced, qty_reject, fabric_stock_id, fabric_used, production_date, notes)
    values (v_var_id_1, 58, 2, (select id from fabric_stock where name = 'Kain Katun Putih'), 2.0, '2026-08-24', 'Batch potong 60 pcs (58 Grade A, 2 Reject)')
    returning id into v_batch_1;

    insert into production_costs (batch_id, cost_type, amount) values (v_batch_1, 'tenaga_kerja', 300000);
    insert into production_batch_materials (batch_id, raw_material_id, qty_used)
    values (v_batch_1, (select id from raw_materials where name = 'Kancing Kemeja Putih'), 360),
           (v_batch_1, (select id from raw_materials where name = 'Label Woven Brand'), 60);
  end if;

  if v_var_id_2 is not null then
    -- Potong 45 pcs: 43 pcs jadi bagus (Grade A), 2 pcs reject
    insert into production_batches (variant_id, qty_produced, qty_reject, fabric_stock_id, fabric_used, production_date, notes)
    values (v_var_id_2, 43, 2, (select id from fabric_stock where name = 'Kain Chino Khaki'), 1.5, '2026-08-22', 'Batch chino pendek khaki (43 Grade A, 2 Reject)')
    returning id into v_batch_2;

    insert into production_costs (batch_id, cost_type, amount) values (v_batch_2, 'tenaga_kerja', 225000);
    insert into production_batch_materials (batch_id, raw_material_id, qty_used)
    values (v_batch_2, (select id from raw_materials where name = 'Kancing Kemeja Hitam'), 45),
           (v_batch_2, (select id from raw_materials where name = 'Resleting YKK 20cm'), 45),
           (v_batch_2, (select id from raw_materials where name = 'Label Woven Brand'), 45);
  end if;

  if v_var_id_3 is not null then
    -- Potong 80 pcs: 77 pcs jadi bagus (Grade A), 3 pcs reject
    insert into production_batches (variant_id, qty_produced, qty_reject, fabric_stock_id, fabric_used, production_date, notes)
    values (v_var_id_3, 77, 3, (select id from fabric_stock where name = 'Kain Katun Hitam'), 2.5, '2026-08-18', 'Batch kaos oversize hitam (77 Grade A, 3 Reject)')
    returning id into v_batch_3;

    insert into production_costs (batch_id, cost_type, amount) values (v_batch_3, 'tenaga_kerja', 320000);
    insert into production_batch_materials (batch_id, raw_material_id, qty_used)
    values (v_batch_3, (select id from raw_materials where name = 'Label Woven Brand'), 80);
  end if;

  if v_var_id_4 is not null then
    -- Potong 35 pcs: 34 pcs jadi bagus (Grade A), 1 pcs reject
    insert into production_batches (variant_id, qty_produced, qty_reject, fabric_stock_id, fabric_used, production_date, notes)
    values (v_var_id_4, 34, 1, (select id from fabric_stock where name = 'Kain Katun Navy'), 1.8, '2026-08-14', 'Batch jaket bomber navy (34 Grade A, 1 Reject)')
    returning id into v_batch_4;

    insert into production_costs (batch_id, cost_type, amount) values (v_batch_4, 'tenaga_kerja', 280000);
  end if;
end $$;


-- 12.10 Mock Penjualan (Sales Transactions — Grade A vs Reject)
insert into sales (variant_id, channel_id, item_grade, qty, sale_price, sale_date)
select pv.id, sc.id, t.grade, t.qty, t.price, t.sale_date::date
from (values
  ('Kemeja Lengan Panjang', 'Putih', 'Shopee', 'grade_a', 210, 110000, '2026-08-25'),
  ('Celana Chino Pendek', 'Khaki', 'TikTok Shop', 'grade_a', 145, 110000, '2026-08-24'),
  ('Kaos Polos Oversize', 'Putih', 'WhatsApp / Chat', 'grade_a', 45, 110000, '2026-08-22'),
  ('Jaket Bomber Premium', 'Hitam', 'Offline Store', 'grade_a', 30, 110000, '2026-08-20'),
  ('Celana Jogger Kasual', 'Abu-abu', 'Website', 'grade_a', 10, 120000, '2026-08-18'),
  -- Penjualan Barang Reject (Cuci Gudang / Bazar / Obral Afkir)
  ('Kemeja Lengan Panjang', 'Putih', 'Offline Store', 'reject', 5, 45000, '2026-08-25'),
  ('Kaos Polos Oversize', 'Putih', 'Offline Store', 'reject', 4, 35000, '2026-08-23')
) as t(article_name, color, channel_name, grade, qty, price, sale_date)
join articles a on a.name = t.article_name
join product_variants pv on pv.article_id = a.id and pv.color = t.color
join sales_channels sc on sc.name = t.channel_name
on conflict do nothing;


-- 12.11 Mock Pengeluaran Operasional (Expenses)
insert into expenses (category, amount, expense_date, notes) values
  ('Ads (Iklan)', 500000, '2026-08-26', 'Shopee Ads Agustus W3'),
  ('Gaji Karyawan', 3000000, '2026-08-24', 'Gaji penjahit - Agustus'),
  ('Ads (Iklan)', 2000000, '2026-08-20', 'Shopee Ads & TikTok Ads campaign'),
  ('Ongkir Kain', 150000, '2026-08-20', 'Ongkir kain dari Bandung'),
  ('Gaji Karyawan', 500000, '2026-08-15', 'Gaji staf gudang'),
  ('Listrik & Air', 450000, '2026-08-10', 'Tagihan PLN Workshop'),
  ('Listrik & Operasional', 250000, '2026-08-05', 'Operasional workshop')
on conflict do nothing;
