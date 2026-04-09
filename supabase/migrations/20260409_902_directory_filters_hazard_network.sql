-- =====================================================================
-- Haul Command — Directory Certification Filter Columns
-- Generated: 2026-04-09
-- Purpose: Add filterable boolean columns to hc_places and listings
--          for the Hard Filter UI (TWIC, HazMat, High Pole, Superload, AV, GPS).
--          Also creates hc_hazard_reports for SOS Blackout Network.
-- Mode: ADDITIVE ONLY — uses IF NOT EXISTS throughout.
-- =====================================================================
begin;

-- =====================================================================
-- 1) Add certification filter columns to hc_places
-- =====================================================================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='hc_places' and column_name='twic_certified') then
    alter table public.hc_places add column twic_certified boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='hc_places' and column_name='hazmat_endorsed') then
    alter table public.hc_places add column hazmat_endorsed boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='hc_places' and column_name='high_pole_certified') then
    alter table public.hc_places add column high_pole_certified boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='hc_places' and column_name='superload_rated') then
    alter table public.hc_places add column superload_rated boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='hc_places' and column_name='av_escort_certified') then
    alter table public.hc_places add column av_escort_certified boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='hc_places' and column_name='gps_tracked') then
    alter table public.hc_places add column gps_tracked boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='hc_places' and column_name='hc_verified') then
    alter table public.hc_places add column hc_verified boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='hc_places' and column_name='equipment_tags') then
    alter table public.hc_places add column equipment_tags text[] not null default '{}';
  end if;
end $$;

-- Partial indexes for fast filter queries
create index if not exists idx_places_twic on public.hc_places (id) where twic_certified = true;
create index if not exists idx_places_hazmat on public.hc_places (id) where hazmat_endorsed = true;
create index if not exists idx_places_highpole on public.hc_places (id) where high_pole_certified = true;
create index if not exists idx_places_superload on public.hc_places (id) where superload_rated = true;
create index if not exists idx_places_av on public.hc_places (id) where av_escort_certified = true;
create index if not exists idx_places_verified on public.hc_places (id) where hc_verified = true;
-- GIN index for equipment tag array containment
create index if not exists idx_places_equipment_tags on public.hc_places using gin (equipment_tags);


-- =====================================================================
-- 2) Add same columns to listings (canonical directory table)
-- =====================================================================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='listings' and column_name='twic_certified') then
    alter table public.listings add column twic_certified boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='listings' and column_name='hazmat_endorsed') then
    alter table public.listings add column hazmat_endorsed boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='listings' and column_name='high_pole_certified') then
    alter table public.listings add column high_pole_certified boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='listings' and column_name='superload_rated') then
    alter table public.listings add column superload_rated boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='listings' and column_name='av_escort_certified') then
    alter table public.listings add column av_escort_certified boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='listings' and column_name='gps_tracked') then
    alter table public.listings add column gps_tracked boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='listings' and column_name='hc_verified') then
    alter table public.listings add column hc_verified boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='listings' and column_name='equipment_tags') then
    alter table public.listings add column equipment_tags text[] not null default '{}';
  end if;
end $$;


-- =====================================================================
-- 3) SOS Blackout Network — Hazard Reports
--    Real-time crowdsourced route intelligence (Waze for Oversize Loads)
-- =====================================================================
create table if not exists public.hc_hazard_reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid,                 -- nullable for anonymous reports
  hazard_type   text not null check (hazard_type in (
    'low_wire', 'low_bridge', 'construction', 'washout', 'accident',
    'road_closure', 'narrow_turn', 'weight_restriction', 'utility_work',
    'police_checkpoint', 'signal_outage', 'debris', 'other'
  )),
  severity      text not null default 'moderate' check (severity in ('low', 'moderate', 'high', 'critical')),
  lat           double precision not null,
  lng           double precision not null,
  description   text,
  photo_url     text,
  route_name    text,               -- e.g. "I-10 WB near Mile Marker 142"
  state_code    text,
  country_code  text not null default 'US',
  is_active     boolean not null default true,
  upvotes       int not null default 1,
  downvotes     int not null default 0,
  expires_at    timestamptz,        -- auto-expire hazards (default 24h)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Enable RLS
alter table public.hc_hazard_reports enable row level security;

-- Anyone can read active hazards
drop policy if exists "hazards_select_public" on public.hc_hazard_reports;
create policy "hazards_select_public"
  on public.hc_hazard_reports for select to anon, authenticated
  using (is_active = true);

-- Authenticated users can report hazards
drop policy if exists "hazards_insert_auth" on public.hc_hazard_reports;
create policy "hazards_insert_auth"
  on public.hc_hazard_reports for insert to authenticated
  with check (
    auth.uid() = reporter_id
    and hazard_type is not null
    and lat between -90 and 90
    and lng between -180 and 180
  );

-- Reporters can update their own reports
drop policy if exists "hazards_update_own" on public.hc_hazard_reports;
create policy "hazards_update_own"
  on public.hc_hazard_reports for update to authenticated
  using (auth.uid() = reporter_id);

-- Spatial index for radius queries
create index if not exists idx_hazard_reports_geo
  on public.hc_hazard_reports (lat, lng)
  where is_active = true;

-- Enable Realtime for live hazard feed
alter publication supabase_realtime add table public.hc_hazard_reports;


-- =====================================================================
-- 4) RPC: Search nearby hazards (100-mile radius)
-- =====================================================================
create or replace function hc_search_nearby_hazards(
  p_lat double precision,
  p_lng double precision,
  p_radius_miles double precision default 100
)
returns setof public.hc_hazard_reports
language sql
stable
security invoker
set search_path = pg_catalog, public, extensions
as $$
  select *
  from public.hc_hazard_reports
  where is_active = true
    and (expires_at is null or expires_at > now())
    -- Haversine approximation: 1 degree ≈ 69 miles
    and abs(lat - p_lat) < (p_radius_miles / 69.0)
    and abs(lng - p_lng) < (p_radius_miles / (69.0 * cos(radians(p_lat))))
  order by
    case severity
      when 'critical' then 1
      when 'high' then 2
      when 'moderate' then 3
      when 'low' then 4
    end,
    created_at desc
  limit 50;
$$;


commit;
