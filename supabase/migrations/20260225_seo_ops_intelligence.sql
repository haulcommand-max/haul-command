-- ============================================================================
-- SEO + Ops Intelligence Schema
-- geo_entities, ports, corridors, market_signals_daily, page_quality_scores,
-- linkmap_edges, nap_canonical, citation_targets, citation_issues, gsc_query_metrics
-- ============================================================================

-- Extensions
create extension if not exists pgcrypto;

-- ── Enums ──────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'geo_entity_type') then
    create type geo_entity_type as enum (
      'country','region','state','province','county','city','metro','zip','neighborhood','corridor','port','terminal'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'signal_source') then
    create type signal_source as enum (
      'directory_search','profile_view','lead_submit','call_click','sms_click','email_click',
      'load_post','match_generated','match_accepted','job_completed',
      'review_received','review_reply','citation_scan','gsc'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'citation_issue_type') then
    create type citation_issue_type as enum (
      'nap_mismatch','duplicate_listing','missing_listing','wrong_category','wrong_url','wrong_hours','wrong_pin'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'issue_status') then
    create type issue_status as enum ('open','in_progress','resolved','ignored');
  end if;
end$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 1) GEO ENTITIES
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.geo_entities (
  id uuid primary key default gen_random_uuid(),
  type geo_entity_type not null,
  name text not null,
  country_code char(2),
  region_code text,
  fips_code text,
  geonames_id bigint,
  slug text not null,

  -- Hierarchy
  parent_id uuid references public.geo_entities(id) on delete set null,
  ancestry_path text,           -- "/country/us/state/fl/county/dixie/"

  -- Location
  lat double precision,
  lon double precision,

  -- Metadata
  population bigint,
  is_active boolean not null default true,
  source text,
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint geo_entities_slug_unique unique (type, slug),
  constraint geo_entities_parent_not_self check (parent_id is null or parent_id <> id)
);

create index if not exists geo_entities_parent_idx on public.geo_entities(parent_id);
create index if not exists geo_entities_type_idx on public.geo_entities(type);
create index if not exists geo_entities_country_region_idx on public.geo_entities(country_code, region_code);
create index if not exists geo_entities_slug_idx on public.geo_entities(slug);


-- ═══════════════════════════════════════════════════════════════════════════
-- 2) PORTS
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.ports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,

  kind text,                    -- seaport, inland_port, river, airport_cargo, rail_intermodal
  authority text,
  website_url text,

  geo_entity_id uuid references public.geo_entities(id) on delete set null,
  country_code char(2),
  region_code text,

  lat double precision,
  lon double precision,

  importance_score numeric(6,2) not null default 0,
  is_active boolean not null default true,

  source text,
  source_ref text,
  source_updated_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ports_geo_entity_idx on public.ports(geo_entity_id);
create index if not exists ports_country_region_idx on public.ports(country_code, region_code);


-- ═══════════════════════════════════════════════════════════════════════════
-- 3) CORRIDORS (structured, not SEO-only)
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.corridors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,

  country_code char(2),
  region_code text,

  -- Bounding box + centroid
  bbox_min_lat double precision,
  bbox_min_lon double precision,
  bbox_max_lat double precision,
  bbox_max_lon double precision,
  centroid_lat double precision,
  centroid_lon double precision,

  primary_route_labels text[],  -- ["I-75", "US-19"]
  lane_tags text[],            -- ["heavy-haul", "wind", "ag"]
  notes text,

  is_active boolean not null default true,
  source text,
  source_ref text,
  source_updated_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists corridors_country_region_idx on public.corridors(country_code, region_code);
create index if not exists corridors_route_labels_gin on public.corridors using gin(primary_route_labels);
create index if not exists corridors_lane_tags_gin on public.corridors using gin(lane_tags);


-- ═══════════════════════════════════════════════════════════════════════════
-- 4) MARKET SIGNALS (DAILY)
-- One row per day × entity × signal_source
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.market_signals_daily (
  day date not null,
  entity_type geo_entity_type not null,
  entity_id uuid not null,
  source signal_source not null,

  -- Raw counters
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  conversions bigint not null default 0,
  unique_users bigint not null default 0,

  -- Marketplace metrics
  loads_posted bigint not null default 0,
  escorts_available bigint not null default 0,
  matches_generated bigint not null default 0,
  matches_accepted bigint not null default 0,
  jobs_completed bigint not null default 0,

  -- Quality signals
  avg_response_minutes numeric(10,2),
  avg_rate_offered numeric(12,2),
  avg_rate_accepted numeric(12,2),
  review_count bigint not null default 0,
  avg_review_rating numeric(4,2),

  -- Derived scoring
  liquidity_score numeric(6,2),
  scarcity_index numeric(8,3),
  volatility_index numeric(8,3),

  created_at timestamptz not null default now(),

  primary key (day, entity_type, entity_id, source)
);

create index if not exists msd_entity_day_idx on public.market_signals_daily(entity_type, entity_id, day desc);
create index if not exists msd_day_idx on public.market_signals_daily(day desc);
create index if not exists msd_source_day_idx on public.market_signals_daily(source, day desc);


-- ═══════════════════════════════════════════════════════════════════════════
-- 5) PAGE QUALITY SCORES
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.page_quality_scores (
  id uuid primary key default gen_random_uuid(),
  page_path text not null,
  entity_type geo_entity_type,
  entity_id uuid,

  evaluated_at timestamptz not null default now(),

  -- Gate inputs
  word_count int not null default 0,
  unique_local_facts_count int not null default 0,
  internal_links_count int not null default 0,
  structured_data_valid boolean not null default false,
  has_original_media boolean not null default false,

  -- GSC hints
  gsc_impressions_28d bigint,
  gsc_clicks_28d bigint,
  gsc_ctr_28d numeric(6,4),
  avg_time_on_page_seconds numeric(10,2),
  bounce_rate numeric(6,4),

  -- Scores (0-100)
  thin_risk_score numeric(6,2) not null default 0,
  helpfulness_score numeric(6,2) not null default 0,
  authority_score numeric(6,2) not null default 0,
  overall_score numeric(6,2) not null default 0,

  -- Decisions
  recommended_indexing text not null default 'index',
  recommended_actions jsonb not null default '[]'::jsonb,

  constraint pqs_unique_snapshot unique (page_path, evaluated_at)
);

create index if not exists pqs_page_idx on public.page_quality_scores(page_path);
create index if not exists pqs_entity_idx on public.page_quality_scores(entity_type, entity_id);
create index if not exists pqs_overall_idx on public.page_quality_scores(overall_score desc);
create index if not exists pqs_actions_gin on public.page_quality_scores using gin(recommended_actions);


-- ═══════════════════════════════════════════════════════════════════════════
-- 6) LINKMAP EDGES (internal linking graph)
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.linkmap_edges (
  id uuid primary key default gen_random_uuid(),

  from_path text not null,
  to_path text not null,

  reason text,                  -- "nearby_city", "same_corridor", "port_nearby"
  weight numeric(10,4) not null default 1.0,

  anchor_text text,
  module_key text,              -- "nearby", "related", "top_corridors"

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint linkmap_no_self check (from_path <> to_path),
  constraint linkmap_unique unique (from_path, to_path, module_key)
);

create index if not exists linkmap_from_idx on public.linkmap_edges(from_path);
create index if not exists linkmap_to_idx on public.linkmap_edges(to_path);
create index if not exists linkmap_reason_idx on public.linkmap_edges(reason);
create index if not exists linkmap_weight_idx on public.linkmap_edges(weight desc);


-- ═══════════════════════════════════════════════════════════════════════════
-- 7) NAP CANONICAL (the truth record for citation consistency)
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.nap_canonical (
  id uuid primary key default gen_random_uuid(),

  brand_name text not null,
  location_label text not null,

  -- Canonical NAP
  phone text not null,
  email text,
  website_url text not null,

  address_line1 text,
  address_line2 text,
  city text,
  region_code text,
  postal_code text,
  country_code char(2) not null,

  -- Service area
  is_service_area boolean not null default true,
  service_area_notes text,

  hours jsonb not null default '{}'::jsonb,
  categories text[],

  geo_entity_id uuid references public.geo_entities(id) on delete set null,

  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint nap_unique unique (brand_name, location_label)
);

create index if not exists nap_geo_entity_idx on public.nap_canonical(geo_entity_id);
create index if not exists nap_country_region_idx on public.nap_canonical(country_code, region_code);


-- ═══════════════════════════════════════════════════════════════════════════
-- 8) CITATION TARGETS (where we want presence)
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.citation_targets (
  id uuid primary key default gen_random_uuid(),

  nap_id uuid not null references public.nap_canonical(id) on delete cascade,

  platform_name text not null,
  platform_type text,           -- gbp, directory, social, map, industry
  listing_url text,
  listing_id text,

  expected_category text,
  expected_url text,
  check_frequency_days int not null default 7,

  last_checked_at timestamptz,
  last_status text,             -- ok, issues_found, missing, error
  last_snapshot jsonb not null default '{}'::jsonb,

  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint citation_target_unique unique (nap_id, platform_name)
);

create index if not exists ct_nap_idx on public.citation_targets(nap_id);
create index if not exists ct_platform_idx on public.citation_targets(platform_name);
create index if not exists ct_status_idx on public.citation_targets(last_status);


-- ═══════════════════════════════════════════════════════════════════════════
-- 9) CITATION ISSUES (action queue for humans)
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.citation_issues (
  id uuid primary key default gen_random_uuid(),

  target_id uuid not null references public.citation_targets(id) on delete cascade,
  nap_id uuid not null references public.nap_canonical(id) on delete cascade,

  issue_type citation_issue_type not null,
  status issue_status not null default 'open',
  severity int not null default 2,

  detected_at timestamptz not null default now(),
  resolved_at timestamptz,

  summary text not null,
  details jsonb not null default '{}'::jsonb,

  assignee text,
  resolution_notes text,

  constraint ci_status_check check (
    (status <> 'resolved' and resolved_at is null) or (status = 'resolved' and resolved_at is not null)
  )
);

create index if not exists ci_target_idx on public.citation_issues(target_id);
create index if not exists ci_nap_idx on public.citation_issues(nap_id);
create index if not exists ci_status_idx on public.citation_issues(status);
create index if not exists ci_detected_idx on public.citation_issues(detected_at desc);


-- ═══════════════════════════════════════════════════════════════════════════
-- 10) GOOGLE SEARCH CONSOLE QUERY METRICS
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.gsc_query_metrics (
  day date not null,
  page_path text not null,
  query text not null,

  impressions bigint not null default 0,
  clicks bigint not null default 0,
  ctr numeric(8,6),
  avg_position numeric(8,3),

  country_code char(2),
  device text,
  search_type text,

  created_at timestamptz not null default now(),

  primary key (day, page_path, query, coalesce(country_code,'--'), coalesce(device,'--'), coalesce(search_type,'--'))
);

create index if not exists gsc_page_day_idx on public.gsc_query_metrics(page_path, day desc);
create index if not exists gsc_query_day_idx on public.gsc_query_metrics(query, day desc);
create index if not exists gsc_position_idx on public.gsc_query_metrics(avg_position asc);
create index if not exists gsc_impressions_idx on public.gsc_query_metrics(impressions desc);


-- ═══════════════════════════════════════════════════════════════════════════
-- Auto-update triggers
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'geo_entities_set_updated_at') then
    create trigger geo_entities_set_updated_at before update on public.geo_entities
    for each row execute function set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'ports_set_updated_at') then
    create trigger ports_set_updated_at before update on public.ports
    for each row execute function set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'corridors_set_updated_at') then
    create trigger corridors_set_updated_at before update on public.corridors
    for each row execute function set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'linkmap_edges_set_updated_at') then
    create trigger linkmap_edges_set_updated_at before update on public.linkmap_edges
    for each row execute function set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'nap_canonical_set_updated_at') then
    create trigger nap_canonical_set_updated_at before update on public.nap_canonical
    for each row execute function set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'citation_targets_set_updated_at') then
    create trigger citation_targets_set_updated_at before update on public.citation_targets
    for each row execute function set_updated_at();
  end if;
end$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.geo_entities enable row level security;
alter table public.ports enable row level security;
alter table public.corridors enable row level security;
alter table public.market_signals_daily enable row level security;
alter table public.page_quality_scores enable row level security;
alter table public.linkmap_edges enable row level security;
alter table public.nap_canonical enable row level security;
alter table public.citation_targets enable row level security;
alter table public.citation_issues enable row level security;
alter table public.gsc_query_metrics enable row level security;

-- Read: public for geo/ports/corridors, service_role for ops tables
create policy ge_read on public.geo_entities for select using (true);
create policy ge_write on public.geo_entities for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy ports_read on public.ports for select using (true);
create policy ports_write on public.ports for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy corridors_read on public.corridors for select using (true);
create policy corridors_write on public.corridors for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy msd_read on public.market_signals_daily for select using (auth.role() in ('authenticated','service_role'));
create policy msd_write on public.market_signals_daily for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy pqs_read on public.page_quality_scores for select using (auth.role() = 'service_role');
create policy pqs_write on public.page_quality_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy lm_read on public.linkmap_edges for select using (true);
create policy lm_write on public.linkmap_edges for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy nap_read on public.nap_canonical for select using (auth.role() = 'service_role');
create policy nap_write on public.nap_canonical for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy ct_read on public.citation_targets for select using (auth.role() = 'service_role');
create policy ct_write on public.citation_targets for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy ci_read on public.citation_issues for select using (auth.role() = 'service_role');
create policy ci_write on public.citation_issues for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy gsc_read on public.gsc_query_metrics for select using (auth.role() = 'service_role');
create policy gsc_write on public.gsc_query_metrics for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
