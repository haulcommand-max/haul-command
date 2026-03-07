-- ============================================================
-- CORRECTED H3 columns — verified table names
-- Tables: driver_profiles, loads (not operators/load_requests)
-- corridor_incidents does not exist — omitted
-- ============================================================
begin;

-- driver_profiles
alter table if exists public.driver_profiles
  add column if not exists h3_r8 text;
alter table if exists public.driver_profiles
  add column if not exists h3_r9 text;

create index if not exists idx_driver_profiles_h3_r8 on public.driver_profiles (h3_r8);
create index if not exists idx_driver_profiles_h3_r9 on public.driver_profiles (h3_r9);

-- loads (origin + dest H3)
alter table if exists public.loads
  add column if not exists origin_h3_r8 text;
alter table if exists public.loads
  add column if not exists origin_h3_r9 text;
alter table if exists public.loads
  add column if not exists dest_h3_r8 text;
alter table if exists public.loads
  add column if not exists dest_h3_r9 text;

create index if not exists idx_loads_origin_h3_r8 on public.loads (origin_h3_r8);
create index if not exists idx_loads_dest_h3_r8 on public.loads (dest_h3_r8);

commit;
