-- 20260301_country_density_and_authority.sql
-- Country Density Score (CDS), Chamber of Commerce authority, backlink scoring,
-- anti-thin content guards, and AI authority amplifier metadata

begin;

-- =========================
-- Country Density Scores
-- =========================

create table if not exists public.country_density_scores (
  country_code text primary key,
  density_score int not null default 0,              -- 0-100
  density_band text not null default 'stealth',      -- stealth|emerging|credible|dominant
  -- Raw signal inputs (normalized 0-1)
  operator_supply_norm numeric(5,4) default 0,
  place_coverage_norm numeric(5,4) default 0,
  geographic_spread_norm numeric(5,4) default 0,
  freshness_activity_norm numeric(5,4) default 0,
  claim_velocity_norm numeric(5,4) default 0,
  authority_signals_norm numeric(5,4) default 0,
  -- Raw counts
  verified_operators int default 0,
  total_places int default 0,
  unique_cities int default 0,
  updates_30d int default 0,
  claims_30d int default 0,
  chamber_links int default 0,
  edu_links int default 0,
  gov_mentions int default 0,
  -- Controls
  indexable boolean not null default false,           -- false if stealth
  adgrid_enabled boolean not null default false,
  paid_acquisition_allowed boolean not null default false,
  computed_at timestamptz not null default now()
);

-- =========================
-- Country Seeding Targets
-- =========================

create table if not exists public.country_seed_targets (
  country_code text primary key,
  target_operators int not null default 25,
  target_places int not null default 250,
  target_cities int not null default 10,
  target_ports int not null default 5,
  target_chambers int not null default 10,
  current_operators int default 0,
  current_places int default 0,
  current_cities int default 0,
  current_ports int default 0,
  current_chambers int default 0,
  seed_progress numeric(5,4) default 0,              -- 0-1
  updated_at timestamptz not null default now()
);

-- =========================
-- Chamber of Commerce Directory
-- =========================

create table if not exists public.chambers_of_commerce (
  id uuid primary key default gen_random_uuid(),
  chamber_name text not null,
  country_code text not null,
  region_code text,
  city text,
  website_url text,
  membership_required boolean default false,
  backlink_opportunity boolean default false,
  backlink_status text default 'not_started',         -- not_started|outreach|pending|verified|rejected
  backlink_url text,                                   -- the actual backlink URL if verified
  partnership_status text default 'identified',        -- identified|qualified|outreach|partner|inactive
  contact_email text,
  contact_name text,
  notes text,
  domain_authority int,                                -- estimated DA
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chamber_country_idx on public.chambers_of_commerce (country_code);
create index if not exists chamber_backlink_idx on public.chambers_of_commerce (backlink_status);
create index if not exists chamber_partner_idx on public.chambers_of_commerce (partnership_status);

-- =========================
-- Backlink Registry (all authority signals)
-- =========================

create table if not exists public.backlink_registry (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  source_domain text not null,
  target_page text not null,                           -- our page that received the link
  country_code text,
  link_type text not null,                             -- chamber|edu|gov|industry_media|news|blog|directory
  quality_tier int not null default 3,                 -- 1=highest (edu/gov), 2=mid (chamber/trade), 3=low (blog/dir)
  quality_weight numeric(4,2) not null default 0.40,   -- 1.0|0.7|0.4
  domain_authority int,
  verified boolean default false,
  first_seen_at timestamptz not null default now(),
  last_checked_at timestamptz,
  status text not null default 'active'                 -- active|broken|removed
);

create index if not exists backlink_domain_idx on public.backlink_registry (source_domain);
create index if not exists backlink_type_idx on public.backlink_registry (link_type);
create index if not exists backlink_tier_idx on public.backlink_registry (quality_tier);
create index if not exists backlink_country_idx on public.backlink_registry (country_code);

-- =========================
-- AI Authority Content Registry
-- =========================

create table if not exists public.authority_content (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,                          -- market_report|corridor_study|safety_whitepaper|city_expansion|escort_index|compliance_guide
  content_tier int not null default 2,                 -- 1=high_authority, 2=local_authority, 3=supporting
  title text not null,
  slug text not null unique,
  country_code text,
  region_code text,
  corridor_id text,
  published boolean default false,
  published_at timestamptz,
  data_points_count int default 0,                     -- must have real data
  entity_mentions text[],
  schema_markup_type text,                             -- Article|Report|Dataset
  distribution_channels text[],
  backlinks_generated int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists auth_content_type_idx on public.authority_content (content_type);
create index if not exists auth_content_country_idx on public.authority_content (country_code);
create index if not exists auth_content_published_idx on public.authority_content (published);

-- =========================
-- Anti-Thin Content Guard
-- =========================

create table if not exists public.page_index_controls (
  page_path text primary key,                          -- /us/tx/harris-county or /au/operators
  page_type text not null,                             -- country_hub|region_page|city_page|operator_profile
  country_code text not null,
  region_code text,
  is_indexable boolean not null default false,
  thin_content_flag boolean not null default false,
  operator_count int default 0,
  place_count int default 0,
  freshness_score numeric(5,4) default 0,
  last_evaluated_at timestamptz not null default now()
);

create index if not exists page_idx_country on public.page_index_controls (country_code);
create index if not exists page_idx_indexable on public.page_index_controls (is_indexable);
create index if not exists page_idx_thin on public.page_index_controls (thin_content_flag);

-- =========================
-- RLS
-- =========================

alter table public.country_density_scores enable row level security;
alter table public.country_seed_targets enable row level security;
alter table public.chambers_of_commerce enable row level security;
alter table public.backlink_registry enable row level security;
alter table public.authority_content enable row level security;
alter table public.page_index_controls enable row level security;

commit;
