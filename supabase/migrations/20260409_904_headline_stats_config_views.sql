-- =====================================================================
-- Haul Command — Sprint 1: Single Source of Truth for Public Stats
-- Generated: 2026-04-09
-- Purpose: Create centralized views for all user-visible headline stats
--          so every page derives numbers from one place.
-- =====================================================================
begin;

-- =====================================================================
-- 1) Global Config table (key-value store for marketing labels)
-- =====================================================================
create table if not exists public.hc_global_config (
  key         text primary key,
  value_json  jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.hc_global_config enable row level security;

-- Public read for marketing values
drop policy if exists "config_select_public" on public.hc_global_config;
create policy "config_select_public"
  on public.hc_global_config for select to anon, authenticated
  using (true);

-- Seed critical config values
insert into public.hc_global_config (key, value_json) values
  ('coverage', '{"countries_target": 120, "active_markets_label": "live markets"}'::jsonb),
  ('marketing_year_context', '{"current_year": 2026}'::jsonb),
  ('stat_labels', '{
    "listed_operators": "Listed Operators",
    "verified_operators": "Verified Operators",
    "states_covered": "States Covered",
    "countries_covered": "Countries Covered",
    "tracked_brokers": "Active Brokers",
    "infrastructure_pois": "Infrastructure Points"
  }'::jsonb)
on conflict (key) do update set
  value_json = excluded.value_json,
  updated_at = now();


-- =====================================================================
-- 2) Headline Stats View — single source of truth for all UI stats
-- =====================================================================
create or replace view public.hc_public_headline_stats_v1 as
select
  -- Operator counts (cascade fallback logic)
  coalesce(
    (select count(*) from public.hc_places where status = 'published'),
    0
  ) as listed_operators,
  coalesce(
    (select count(*) from public.hc_places where claim_status in ('verified')),
    0
  ) as verified_operators,
  -- Geographic coverage
  coalesce(
    (select count(distinct admin1_code) from public.hc_places where admin1_code is not null and status = 'published'),
    0
  ) as states_covered,
  coalesce(
    (select count(distinct country_code) from public.hc_places where country_code is not null and status = 'published'),
    0
  ) as countries_covered,
  -- Broker / infrastructure counts
  coalesce(
    (select count(*) from public.hc_places where surface_category_key in ('truck_stop', 'repair_shop', 'tire_shop', 'tow_rotator', 'drop_yard', 'scale_weigh_station_public', 'rest_area', 'cat_scale')),
    0
  ) as tracked_infrastructure_pois,
  -- Freshness
  now() as updated_at;

-- Make it security invoker
alter view public.hc_public_headline_stats_v1 set (security_invoker = true);


-- =====================================================================
-- 3) Rate Summary View — single source for rate intelligence
-- =====================================================================
create or replace view public.hc_rate_summary_public_v1 as
select
  'us' as jurisdiction_slug,
  service_type,
  min(rate_low) as low_estimate,
  avg(rate_typical) as typical_estimate,
  max(rate_high) as high_estimate,
  rate_unit as unit,
  count(*) as source_count,
  max(updated_at) as updated_at
from (
  -- Virtual rate data structure (placeholder for real rate_benchmarks table)
  select
    'standard_escort'::text as service_type,
    1.75::numeric as rate_low,
    2.25::numeric as rate_typical,
    2.75::numeric as rate_high,
    'per_mile'::text as rate_unit,
    now() as updated_at
  union all
  select 'superload_escort', 3.50, 4.75, 6.00, 'per_mile', now()
  union all
  select 'height_pole', 4.00, 5.50, 7.00, 'per_mile', now()
  union all
  select 'day_rate', 350, 525, 700, 'per_day', now()
  union all
  select 'bridge_utility', 50, 125, 200, 'flat_fee', now()
) as rate_data
group by jurisdiction_slug, service_type, rate_unit;

alter view public.hc_rate_summary_public_v1 set (security_invoker = true);


-- =====================================================================
-- 4) Trust Demo View — demo data for trust report card
-- =====================================================================
create or replace view public.hc_trust_demo_public_v1 as
select
  87.5::numeric as trust_score,
  142 as jobs_completed,
  36 as incident_free_months,
  12.4::numeric as avg_response_minutes,
  true as insurance_verified,
  true as identity_verified,
  array['PEVO Certified', 'TWIC Holder', 'HazMat Endorsed']::text[] as certifications,
  now() as updated_at;

alter view public.hc_trust_demo_public_v1 set (security_invoker = true);


-- =====================================================================
-- 5) RPC for easy consumption from Next.js
-- =====================================================================
create or replace function get_headline_stats()
returns json
language sql
stable
security invoker
set search_path = pg_catalog, public, extensions
as $$
  select row_to_json(t) from public.hc_public_headline_stats_v1 t limit 1;
$$;

commit;
