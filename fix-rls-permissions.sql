-- ============================================================
-- FIX ROW-LEVEL SECURITY (RLS) PERMISSIONS
-- Run this in Supabase SQL Editor to resolve all RLS policy errors
-- ============================================================

-- 1. Disable Row Level Security on all application tables
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

-- 2. Grant full CRUD access to anon, authenticated, and service_role
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

-- 3. Set default privileges for any future tables/sequences created
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;
