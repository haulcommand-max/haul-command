-- 0022_pricing_engine.sql
begin;

create table if not exists public.pricing_regions (
  region_key text primary key,
  label text not null
);

create table if not exists public.service_types (
  service_key text primary key,
  label text not null,
  description text,
  category text not null default 'service' check (category in ('service', 'addon')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.pricing_benchmarks (
  id uuid primary key default gen_random_uuid(),
  service_key text not null references public.service_types(service_key) on delete cascade,
  region_key text not null, -- generic text to allow 'all' or foreign key if strict
  unit text not null, -- per_mile, day_rate, flat, per_hour, etc
  tier_key text, -- 0_100, etc
  min_rate numeric(10,2),
  max_rate numeric(10,2),
  currency text not null default 'USD',
  notes text,
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.pricing_regions enable row level security;
alter table public.service_types enable row level security;
alter table public.pricing_benchmarks enable row level security;

-- Public/Anon Read
create policy "pricing_public_read_regions" on public.pricing_regions for select to anon, authenticated using (true);
create policy "pricing_public_read_services" on public.service_types for select to anon, authenticated using (true);
create policy "pricing_public_read_benchmarks" on public.pricing_benchmarks for select to anon, authenticated using (true);

-- Admin Write (via Service Role usually, but allowing admin role just in case)
-- actually, we stick to service_role for writes generally, but for Admin UI we might want direct access if using client?
-- The user instructions say "Service-role only writes for events/rollups". 
-- For settings/pricing, we can allow admin role or stick to "admin-set-setting" pattern?
-- Let's stick to the "admin-set-setting" pattern for consistency, OR allow admin users to write to these tables directly.
-- Given "Admin UI: CRUD for service_types", direct RLS for admin role is easier.

create policy "pricing_admin_write_regions" on public.pricing_regions for all to authenticated using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));

create policy "pricing_admin_write_services" on public.service_types for all to authenticated using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));

create policy "pricing_admin_write_benchmarks" on public.pricing_benchmarks for all to authenticated using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));

commit;
