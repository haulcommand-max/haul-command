-- 20260219_hcos_v2_schema.sql
-- Haul Command Operating System (HCOS) v2.0
-- "Intelligence Layer" Schema Upgrade

-- ENABLE EXTENSIONS (If not already enabled)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =========================================================
-- 0. ENUMS & TYPES
-- =========================================================

do $$ begin
  create type verification_tier as enum ('V0','V1','V2','V3','V4');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reporter_tier as enum ('anonymous_untrusted','logged_in','verified_provider','elite_operator');
exception when duplicate_object then null; end $$;

do $$ begin
  create type update_status as enum ('active','flagged','removed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type update_category as enum (
    'tight_bridge','restricted_route','curfew_hotspot','construction','low_clearance',
    'weigh_station_wait','port_entry_delay','fuel_good','bathroom_clean','food_good',
    'parking_safe','cell_signal_good'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type subject_type as enum ('provider','broker');
exception when duplicate_object then null; end $$;


-- =========================================================
-- 1. CORE DIMENSIONS (Providers & Brokers)
-- =========================================================

-- Providers (Minimal public profile)
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  verification verification_tier not null default 'V0',
  base_country text not null default 'us',
  base_admin1 text not null,           -- 'tx','on'
  base_city text not null,             -- slug
  phone_e164 text,                     -- Private/Restricted access recommended
  email text,                          -- Private/Restricted access recommended
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Brokers (Minimal public profile)
create table if not exists public.brokers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  verification verification_tier not null default 'V0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- 2. INTELLIGENCE DIMENSIONS (Lanes & Corridors)
-- =========================================================

-- Lanes: Deterministic Origin-Destination pairs
-- Logic: One row per unique "Metro A -> Metro B :: Service" combo
create table if not exists public.lanes (
  id uuid primary key default gen_random_uuid(),
  
  -- Deterministic Identity
  lane_key text not null unique,       -- HASH(origin_slug + dest_slug + service)
  service_required text not null,

  origin_country text not null,
  origin_admin1 text not null,
  origin_metro_or_city text not null,  -- Normalized slug

  dest_country text not null,
  dest_admin1 text not null,
  dest_metro_or_city text not null,    -- Normalized slug

  -- Rolling Intelligence (Computed nightly)
  active_loads_7d int not null default 0,
  active_loads_30d int not null default 0,
  unique_brokers_30d int not null default 0,
  fill_speed_index_30d numeric not null default 0.0,
  lane_density_score_30d numeric not null default 0.0, -- 0..1
  
  updated_at timestamptz not null default now()
);

-- Indexes for Fast Lookups
create index if not exists idx_lanes_origin on public.lanes(origin_country, origin_admin1, origin_metro_or_city);
create index if not exists idx_lanes_dest on public.lanes(dest_country, dest_admin1, dest_metro_or_city);
create index if not exists idx_lanes_density on public.lanes(lane_density_score_30d desc);


-- Corridors: Route Context
create table if not exists public.corridors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,           -- "i-10-tx", "i-95-fl"
  name text not null,
  country text not null,
  
  -- Intelligence
  confidence_score numeric not null default 0.0, -- 0..100
  risk_score numeric not null default 0.0,       -- 0..100
  
  metrics jsonb not null default '{}'::jsonb,    -- { loads_30d: 100, etc }
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_corridors_slug on public.corridors(slug);


-- =========================================================
-- 3. FACT TABLES (Loads & Contacts)
-- =========================================================

-- Loads: Public Summary (Safe for SEO)
-- *NO CONTACT INFO HERE*
create table if not exists public.loads (
  id uuid primary key default gen_random_uuid(),
  public_id text unique,                 -- Friendly ID e.g. "LD-1234"
  
  -- Dimensions Links
  broker_id uuid references public.brokers(id) on delete set null,
  lane_id uuid references public.lanes(id) on delete set null,
  corridor_id uuid references public.corridors(id) on delete set null,

  -- Fact Data
  service_required text not null,
  origin_country text not null,
  origin_admin1 text not null,
  origin_city text not null,
  dest_country text not null,
  dest_admin1 text not null,
  dest_city text not null,
  
  posted_at timestamptz not null default now(),
  load_date date,
  rate_amount numeric,
  rate_currency text default 'USD',
  status text not null default 'active', -- 'active','filled','expired'
  
  data_completeness_score numeric not null default 0.0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_loads_posted_at on public.loads(posted_at desc);
create index if not exists idx_loads_status on public.loads(status);
create index if not exists idx_loads_lane_id on public.loads(lane_id);


-- Load Contacts: Private (Gated RLS)
-- *SENSITIVE DATA HERE*
create table if not exists public.load_contacts (
  load_id uuid primary key references public.loads(id) on delete cascade,
  contact_name text,
  contact_phone_e164 text,
  contact_email text,
  contact_url text,
  contact_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- 4. INTELLIGENCE METRICS
-- =========================================================

-- Broker Metrics (computed nightly)
create table if not exists public.broker_metrics (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.brokers(id) on delete cascade,
  
  tier text default 'unknown', -- 'bronze', 'silver', 'gold', 'platinum'
  reliability_score numeric not null default 0.0, -- 0..100
  fill_speed_score numeric not null default 0.0,  -- 0..100
  
  last_calculated_at timestamptz not null default now(),
  
  unique(broker_id) -- One active metrics row per broker
);

create index if not exists idx_broker_metrics_scores on public.broker_metrics(reliability_score desc);


-- Report Cards (Provider Performance)
create table if not exists public.report_cards (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  
  score_overall numeric not null default 0.0,
  grade text, -- 'A','B','C'
  
  breakdown jsonb not null default '{}'::jsonb, -- { on_time: 95, safety: 100 }
  
  updated_at timestamptz not null default now(),
  
  unique(provider_id)
);


-- Waze Updates (Corridor Intel)
create table if not exists public.waze_updates (
  id uuid primary key default gen_random_uuid(),
  corridor_id uuid references public.corridors(id) on delete cascade,
  
  category update_category not null,
  status update_status not null default 'active',
  
  title text not null,
  note text,
  geohash text,
  
  reporter_tier reporter_tier not null default 'logged_in',
  confidence numeric not null default 0.5,
  
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  
  flags jsonb not null default '{}'::jsonb
);

create index if not exists idx_waze_updates_corridor_active on public.waze_updates(corridor_id, status) where status='active';
create index if not exists idx_waze_updates_expires on public.waze_updates(expires_at);


-- =========================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =========================================================

alter table public.loads enable row level security;
alter table public.load_contacts enable row level security;

-- Loads: Public Read (Anon OK)
create policy "loads_public_read_summary"
on public.loads for select
to anon, authenticated
using (true);

-- Load Contacts: Authenticated Read Only (Registration Gate)
create policy "load_contacts_auth_read"
on public.load_contacts for select
to authenticated
using (true);

-- Deny Anon on Contacts
create policy "load_contacts_no_anon"
on public.load_contacts for select
to anon
using (false);

-- Write Policies (Mods/Admins needed for production inserts usually)
-- For now, basic policies for authenticated verified users could be added.


-- =========================================================
-- 6. PUBLIC VIEWS (THE API CONTRACT)
-- =========================================================

-- Directory Active Loads View (Enriched)
-- TODO(HCOS v2): promote to materialized view when rows > 250k
create or replace view public.directory_active_loads_view as
select
  l.id,
  l.slug, -- If slug exists on l, or generated from public_id
  l.public_id,
  l.posted_at,
  l.origin_city, l.origin_admin1 as origin_state,
  l.dest_city, l.dest_admin1 as dest_state,
  l.service_required,
  l.status,
  
  -- Broker Intel
  b.name as broker_name,
  bm.tier as broker_tier,
  bm.reliability_score as broker_reliability,
  
  -- Lane Intel
  ln.lane_density_score_30d as lane_density,
  ln.fill_speed_index_30d as lane_fill_speed
  
from public.loads l
left join public.brokers b on l.broker_id = b.id
left join public.broker_metrics bm on b.id = bm.broker_id
left join public.lanes ln on l.lane_id = ln.id
where l.status = 'active';

