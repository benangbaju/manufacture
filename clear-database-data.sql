-- ============================================================
-- SCRIPT RESET / PEMBERSIHAN DATA MOCKUP SUPABASE
-- Jalankan query ini di SQL Editor Supabase untuk mengosongkan
-- seluruh data dummy/mockup agar database bersih dan siap untuk
-- data real Anda.
-- ============================================================

-- 1. Hapus transaksi & relasi operasional
truncate table sales cascade;
truncate table production_batch_materials cascade;
truncate table production_costs cascade;
truncate table production_batches cascade;
truncate table purchases cascade;
truncate table expenses cascade;

-- 2. Hapus relasi resep & pemetaan
truncate table variant_fabric_mapping cascade;
truncate table product_recipes cascade;

-- 3. Hapus master produk & varian
truncate table product_variants cascade;
truncate table articles restart identity cascade;

-- 4. Hapus master bahan baku & stok kain
truncate table fabric_stock restart identity cascade;
truncate table raw_materials restart identity cascade;

-- 5. Reset Channel Penjualan (Sisakan channel standar jika diinginkan)
truncate table sales_channels restart identity cascade;
insert into sales_channels (name) values
  ('Shopee'),
  ('TikTok Shop'),
  ('Website'),
  ('Offline Store'),
  ('WhatsApp / Chat');

-- ============================================================
-- Selesai! Database sekarang 100% bersih dan siap diisi data real.
-- ============================================================
