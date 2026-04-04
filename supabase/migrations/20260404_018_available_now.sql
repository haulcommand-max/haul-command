-- Haul Command — Available Now Table
-- Migration: 20260404_018_available_now.sql
-- Purpose: Real-time operator availability broadcast.
-- Operators set a status window; brokers see live feed.
begin;

drop table if exists public.hc_available_now cascade;
create table if not exists public.hc_available_now (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,

  -- Profile link
  slug              text not null,
  business_name     text,
  display_name      text,

  -- Geo
  country_code      char(2) not null,
  region_code       text,
  city              text,
  lat               numeric(9,6),
  lng               numeric(9,6),

  -- Trust
  trust_score       int check(trust_score between 0 and 100),
  is_verified       boolean default false,

  -- Availability window
  available_since   timestamptz not null default now(),
  available_until   timestamptz,             -- null = indefinite
  reposition_only   boolean default false,

  -- Capacity
  vehicle_type      text check(vehicle_type in('pilot_car','escort_truck','chase_vehicle','shadow_vehicle','other')),
  max_load_width_m  numeric(5,2),
  max_load_height_m numeric(5,2),
  corridor_slugs    text[],                  -- corridors operator works

  -- Rates (public teaser only — full rate on profile)
  rate_per_km       numeric(8,2),
  currency          char(3) default 'USD',

  -- Freshness
  last_ping_at      timestamptz default now(),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),

  unique(user_id)
);

create index if not exists idx_available_now_country
  on public.hc_available_now(country_code, available_until);

create index if not exists idx_available_now_trust
  on public.hc_available_now(trust_score desc, country_code);

create index if not exists idx_available_now_geo
  on public.hc_available_now using gist ( (st_setsrid(st_makepoint(lng::float8, lat::float8), 4326)::geography) )
  where lat is not null and lng is not null;

alter table public.hc_available_now enable row level security;

-- Public read: active operators (within window)
create policy "Public read available operators" on public.hc_available_now
  for select using (
    available_until is null or available_until > now()
  );

-- Users manage own availability
create policy "Users manage own availability" on public.hc_available_now
  for all using (auth.uid() = user_id);

create policy "Service role full access available_now" on public.hc_available_now
  for all using (auth.role() = 'service_role');

commit;
