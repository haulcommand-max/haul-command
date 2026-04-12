-- Haul Command Corridor OS
-- Migration: 20260404_001_corridor_os.sql
-- Next after: 20260214231502_corridor_intelligence.sql
-- Policy: upgrade-only, IF NOT EXISTS everywhere, no drops
-- Scope: enums → tables → indexes → triggers → views → scoring fn

begin;

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ── Helpers ──────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.hc_slugify(input_text text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input_text,'')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.hc_make_corridor_code(p_country text, p_origin text, p_dest text)
returns text language sql immutable as $$
  select upper(coalesce(p_country,'XX'))
    || '_' || upper(left(regexp_replace(coalesce(p_origin,'O'),'[^A-Za-z0-9]+','','g'),12))
    || '_' || upper(left(regexp_replace(coalesce(p_dest,'D'),'[^A-Za-z0-9]+','','g'),12));
$$;

-- ── Enums ──────────────────────────────────────────────────────────────────

do $$ begin
  if not exists (select 1 from pg_type where typname='hc_corridor_status') then
    create type public.hc_corridor_status as enum ('draft','active','hidden','archived');
  end if;
  if not exists (select 1 from pg_type where typname='hc_corridor_type') then
    create type public.hc_corridor_type as enum (
      'country_spine','port_connector','border_connector','metro_connector',
      'industrial_connector','permit_sensitive','escort_sensitive',
      'credential_sensitive','live_generated');
  end if;
  if not exists (select 1 from pg_type where typname='hc_corridor_tier') then
    create type public.hc_corridor_tier as enum ('flagship','national','regional','metro','long_tail');
  end if;
  if not exists (select 1 from pg_type where typname='hc_mode_type') then
    create type public.hc_mode_type as enum ('road','intermodal','port_road','road_rail','road_barge');
  end if;
  if not exists (select 1 from pg_type where typname='hc_node_type') then
    create type public.hc_node_type as enum (
      'origin','destination','port','border','yard','staging','city','metro',
      'project_site','plant','terminal','rest_area','escort_meet_point');
  end if;
  if not exists (select 1 from pg_type where typname='hc_requirement_type') then
    create type public.hc_requirement_type as enum (
      'permit','escort','police','pilot_car','route_survey','curfew',
      'holiday_restriction','bridge_review','port_clearance','credential',
      'insurance','vehicle_equipment');
  end if;
  if not exists (select 1 from pg_type where typname='hc_jurisdiction_level') then
    create type public.hc_jurisdiction_level as enum ('country','state','province','city','port','facility');
  end if;
  if not exists (select 1 from pg_type where typname='hc_credential_family') then
    create type public.hc_credential_family as enum (
      'port_access','secure_facility','hazmat','customs','escort','pilot_operator',
      'crane','rigging','route_survey','police_coordination','safety',
      'energy_site','mining_site','refinery_site','airport_access','rail_access');
  end if;
  if not exists (select 1 from pg_type where typname='hc_pricing_obs_type') then
    create type public.hc_pricing_obs_type as enum (
      'escort_rate','operator_rate','route_survey_rate','permit_cost',
      'urgent_fill_premium','twic_premium','secure_access_premium',
      'police_coordination_fee','staging_yard_cost','parking_cost','equipment_cost');
  end if;
  if not exists (select 1 from pg_type where typname='hc_price_unit') then
    create type public.hc_price_unit as enum ('trip','day','hour','mile','km','permit','booking');
  end if;
  if not exists (select 1 from pg_type where typname='hc_price_source') then
    create type public.hc_price_source as enum (
      'quote','booking','invoice','self_report','admin_entry','marketplace_observation');
  end if;
  if not exists (select 1 from pg_type where typname='hc_demand_signal_type') then
    create type public.hc_demand_signal_type as enum (
      'search','load_post','broker_request','escort_request','quote_request',
      'permit_request','worker_availability','failed_match','alert_subscribe',
      'route_save','profile_claim');
  end if;
  if not exists (select 1 from pg_type where typname='hc_supply_type') then
    create type public.hc_supply_type as enum (
      'operators','escorts','twic_workers','port_workers','police_contacts',
      'yards','installers','permit_runners','route_surveyors');
  end if;
  if not exists (select 1 from pg_type where typname='hc_corridor_page_type') then
    create type public.hc_corridor_page_type as enum (
      'overview','rates','requirements','escorts','operators','loads',
      'port_access','credentialed_workers','staging','parking','faq','map','compare');
  end if;
  if not exists (select 1 from pg_type where typname='hc_publish_status') then
    create type public.hc_publish_status as enum ('draft','ready','published','noindex','archived');
  end if;
  if not exists (select 1 from pg_type where typname='hc_urgency_level') then
    create type public.hc_urgency_level as enum ('low','normal','high','urgent','immediate');
  end if;
  if not exists (select 1 from pg_type where typname='hc_requester_role') then
    create type public.hc_requester_role as enum (
      'broker','operator','escort','shipper','facility','yard',
      'permit_service','advertiser','admin');
  end if;
end $$;

-- ── Core tables ────────────────────────────────────────────────────────────

create table if not exists public.hc_corridors (
  id uuid primary key default gen_random_uuid(),
  corridor_code text not null unique,
  slug text not null unique,
  name text not null,
  short_name text,
  status public.hc_corridor_status not null default 'active',
  corridor_type public.hc_corridor_type not null,
  tier public.hc_corridor_tier not null,
  country_code text not null,
  primary_language_code text not null default 'en',
  secondary_language_codes text[],
  currency_code text not null default 'USD',
  origin_country_code text not null,
  origin_region_code text,
  origin_city_name text,
  origin_place_ref text,
  destination_country_code text not null,
  destination_region_code text,
  destination_city_name text,
  destination_place_ref text,
  is_cross_border boolean not null default false,
  distance_km numeric(12,2),
  distance_miles numeric(12,2),
  typical_mode public.hc_mode_type not null default 'road',
  route_geometry_ref text,
  canonical_route_ref text,
  -- scores
  seo_priority_score numeric(6,2) not null default 0,
  market_priority_score numeric(6,2) not null default 0,
  monetization_priority_score numeric(6,2) not null default 0,
  corridor_score numeric(6,2) not null default 0,
  freshness_score numeric(6,2) not null default 0,
  confidence_score numeric(6,2) not null default 0,
  intent_density_score numeric(6,2) not null default 0,
  repeat_demand_score numeric(6,2) not null default 0,
  permit_complexity_score numeric(6,2) not null default 0,
  escort_complexity_score numeric(6,2) not null default 0,
  credential_complexity_score numeric(6,2) not null default 0,
  infrastructure_complexity_score numeric(6,2) not null default 0,
  scarcity_score numeric(6,2) not null default 0,
  urgency_score numeric(6,2) not null default 0,
  competition_gap_score numeric(6,2) not null default 0,
  ad_inventory_score numeric(6,2) not null default 0,
  data_product_score numeric(6,2) not null default 0,
  search_volume_estimate integer not null default 0,
  commercial_value_estimate numeric(12,2) not null default 0,
  active boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_corridor_nodes (
  id uuid primary key default gen_random_uuid(),
  corridor_id uuid not null references public.hc_corridors(id) on delete cascade,
  node_type public.hc_node_type not null,
  place_ref text not null,
  place_name text,
  sequence_index integer not null default 0,
  required boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  constraint hc_corridor_nodes_uq unique (corridor_id, node_type, place_ref, sequence_index)
);

create table if not exists public.hc_corridor_requirements (
  id uuid primary key default gen_random_uuid(),
  corridor_id uuid not null references public.hc_corridors(id) on delete cascade,
  requirement_type public.hc_requirement_type not null,
  jurisdiction_level public.hc_jurisdiction_level not null,
  jurisdiction_code text not null,
  title text not null,
  summary text not null,
  details text,
  source_url text,
  source_authority_name text,
  effective_date date,
  expires_at timestamptz,
  confidence_score numeric(6,2) not null default 0,
  freshness_score numeric(6,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hc_corridor_requirements_uq
    unique (corridor_id, requirement_type, jurisdiction_level, jurisdiction_code, title)
);

create table if not exists public.hc_credential_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text,
  country_code text,
  credential_family public.hc_credential_family not null,
  issuing_authority text,
  verification_method text,
  renewal_period_days integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_corridor_credentials (
  id uuid primary key default gen_random_uuid(),
  corridor_id uuid not null references public.hc_corridors(id) on delete cascade,
  credential_type_id uuid not null references public.hc_credential_types(id) on delete restrict,
  required boolean not null default false,
  preferred boolean not null default false,
  urgency_multiplier numeric(8,2) not null default 1.00,
  premium_multiplier numeric(8,2) not null default 1.00,
  jurisdiction_scope text,
  notes text,
  created_at timestamptz not null default now(),
  constraint hc_corridor_credentials_uq unique (corridor_id, credential_type_id)
);

create table if not exists public.hc_corridor_pricing_obs (
  id uuid primary key default gen_random_uuid(),
  corridor_id uuid not null references public.hc_corridors(id) on delete cascade,
  observation_type public.hc_pricing_obs_type not null,
  currency_code text not null,
  amount_min numeric(12,2),
  amount_median numeric(12,2),
  amount_max numeric(12,2),
  price_unit public.hc_price_unit not null,
  source_type public.hc_price_source not null,
  confidence_score numeric(6,2) not null default 0,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.hc_corridor_demand_signals (
  id uuid primary key default gen_random_uuid(),
  corridor_id uuid not null references public.hc_corridors(id) on delete cascade,
  signal_type public.hc_demand_signal_type not null,
  signal_count integer not null default 0,
  window_days integer not null default 30,
  country_code text,
  region_code text,
  captured_at timestamptz not null default now()
);

create table if not exists public.hc_corridor_supply_signals (
  id uuid primary key default gen_random_uuid(),
  corridor_id uuid not null references public.hc_corridors(id) on delete cascade,
  supply_type public.hc_supply_type not null,
  available_count integer not null default 0,
  verified_count integer not null default 0,
  response_time_estimate_minutes integer,
  captured_at timestamptz not null default now()
);

create table if not exists public.hc_corridor_pages (
  id uuid primary key default gen_random_uuid(),
  corridor_id uuid not null references public.hc_corridors(id) on delete cascade,
  page_type public.hc_corridor_page_type not null,
  slug text not null unique,
  canonical_url text not null,
  title_tag text,
  meta_description text,
  h1 text,
  schema_type text,
  indexable boolean not null default true,
  internal_link_score numeric(6,2) not null default 0,
  publish_status public.hc_publish_status not null default 'draft',
  last_generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hc_corridor_pages_uq unique (corridor_id, page_type)
);

create table if not exists public.hc_route_requests (
  id uuid primary key default gen_random_uuid(),
  origin_text text not null,
  destination_text text not null,
  origin_place_ref text,
  destination_place_ref text,
  country_code text,
  requested_service_type text,
  requested_credential_type_id uuid references public.hc_credential_types(id) on delete set null,
  urgency_level public.hc_urgency_level not null default 'normal',
  requester_role public.hc_requester_role not null,
  normalized_route_fingerprint text not null,
  converted_to_corridor_id uuid references public.hc_corridors(id) on delete set null,
  contact_ref text,
  created_at timestamptz not null default now()
);

create table if not exists public.hc_corridor_internal_links (
  id uuid primary key default gen_random_uuid(),
  source_surface_type text not null,
  source_surface_ref text not null,
  target_surface_type text not null,
  target_surface_ref text not null,
  anchor_text text not null,
  anchor_pattern text,
  link_reason text not null,
  weight_score numeric(6,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Indexes ────────────────────────────────────────────────────────────────

create index if not exists hc_corridors_country_idx on public.hc_corridors(country_code);
create index if not exists hc_corridors_type_idx on public.hc_corridors(corridor_type);
create index if not exists hc_corridors_tier_idx on public.hc_corridors(tier);
create index if not exists hc_corridors_active_idx on public.hc_corridors(active);
create index if not exists hc_corridors_status_idx on public.hc_corridors(status);
create index if not exists hc_corridors_origin_dest_idx on public.hc_corridors(origin_country_code, destination_country_code);
create index if not exists hc_corridors_score_idx on public.hc_corridors(corridor_score desc);
create index if not exists hc_corridors_seo_score_idx on public.hc_corridors(seo_priority_score desc);
create index if not exists hc_corridors_money_score_idx on public.hc_corridors(monetization_priority_score desc);
create index if not exists hc_corridors_slug_trgm_idx on public.hc_corridors using gin(slug gin_trgm_ops);
create index if not exists hc_corridors_name_trgm_idx on public.hc_corridors using gin(name gin_trgm_ops);

create index if not exists hc_corridor_nodes_corridor_idx on public.hc_corridor_nodes(corridor_id);
create index if not exists hc_corridor_nodes_seq_idx on public.hc_corridor_nodes(corridor_id, sequence_index);

create index if not exists hc_corridor_reqs_corridor_idx on public.hc_corridor_requirements(corridor_id);
create index if not exists hc_corridor_reqs_type_idx on public.hc_corridor_requirements(requirement_type);
create index if not exists hc_corridor_reqs_juris_idx on public.hc_corridor_requirements(jurisdiction_level, jurisdiction_code);
create index if not exists hc_corridor_reqs_fresh_idx on public.hc_corridor_requirements(freshness_score);

create index if not exists hc_credential_types_country_idx on public.hc_credential_types(country_code);
create index if not exists hc_credential_types_family_idx on public.hc_credential_types(credential_family);

create index if not exists hc_corridor_creds_corridor_idx on public.hc_corridor_credentials(corridor_id);
create index if not exists hc_corridor_creds_required_idx on public.hc_corridor_credentials(required);

create index if not exists hc_corridor_pricing_corridor_idx on public.hc_corridor_pricing_obs(corridor_id);
create index if not exists hc_corridor_pricing_type_idx on public.hc_corridor_pricing_obs(observation_type);
create index if not exists hc_corridor_pricing_obs_at_idx on public.hc_corridor_pricing_obs(observed_at);

create index if not exists hc_corridor_demand_corridor_idx on public.hc_corridor_demand_signals(corridor_id);
create index if not exists hc_corridor_demand_type_idx on public.hc_corridor_demand_signals(signal_type);
create index if not exists hc_corridor_demand_cap_idx on public.hc_corridor_demand_signals(captured_at);

create index if not exists hc_corridor_supply_corridor_idx on public.hc_corridor_supply_signals(corridor_id);
create index if not exists hc_corridor_supply_type_idx on public.hc_corridor_supply_signals(supply_type);
create index if not exists hc_corridor_supply_cap_idx on public.hc_corridor_supply_signals(captured_at);

create index if not exists hc_corridor_pages_corridor_idx on public.hc_corridor_pages(corridor_id);
create index if not exists hc_corridor_pages_type_idx on public.hc_corridor_pages(page_type);
create index if not exists hc_corridor_pages_pub_idx on public.hc_corridor_pages(publish_status);
create index if not exists hc_corridor_pages_idx_idx on public.hc_corridor_pages(indexable);

create index if not exists hc_route_req_fp_idx on public.hc_route_requests(normalized_route_fingerprint);
create index if not exists hc_route_req_role_idx on public.hc_route_requests(requester_role);
create index if not exists hc_route_req_urgency_idx on public.hc_route_requests(urgency_level);
create index if not exists hc_route_req_created_idx on public.hc_route_requests(created_at desc);

create index if not exists hc_corridor_links_source_idx on public.hc_corridor_internal_links(source_surface_type, source_surface_ref);
create index if not exists hc_corridor_links_target_idx on public.hc_corridor_internal_links(target_surface_type, target_surface_ref);
create index if not exists hc_corridor_links_weight_idx on public.hc_corridor_internal_links(weight_score desc);

-- ── Triggers ──────────────────────────────────────────────────────────────

drop trigger if exists trg_hc_corridors_updated_at on public.hc_corridors;
create trigger trg_hc_corridors_updated_at
  before update on public.hc_corridors
  for each row execute function public.set_updated_at();

drop trigger if exists trg_hc_corridor_reqs_updated_at on public.hc_corridor_requirements;
create trigger trg_hc_corridor_reqs_updated_at
  before update on public.hc_corridor_requirements
  for each row execute function public.set_updated_at();

drop trigger if exists trg_hc_credential_types_updated_at on public.hc_credential_types;
create trigger trg_hc_credential_types_updated_at
  before update on public.hc_credential_types
  for each row execute function public.set_updated_at();

drop trigger if exists trg_hc_corridor_pages_updated_at on public.hc_corridor_pages;
create trigger trg_hc_corridor_pages_updated_at
  before update on public.hc_corridor_pages
  for each row execute function public.set_updated_at();

-- ── Scoring function ─────────────────────────────────────────────────────
-- Formula (weighted):
--   demand_density      20%
--   commercial_value    15%
--   seo_opportunity     12%
--   repeat_demand       10%
--   scarcity            10%
--   permit_complexity    8%
--   escort_complexity    8%
--   credential_complex   5%
--   infra_complex        4%
--   strategic_value      3%
--   ad_inventory         3%
--   data_product         2%

create or replace function public.hc_compute_corridor_scores(p_corridor_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_demand_density    numeric := 0;
  v_commercial        numeric := 0;
  v_seo_opp           numeric := 0;
  v_repeat_demand     numeric := 0;
  v_scarcity          numeric := 0;
  v_permit_complex    numeric := 0;
  v_escort_complex    numeric := 0;
  v_cred_complex      numeric := 0;
  v_infra_complex     numeric := 0;
  v_strategic         numeric := 0;
  v_ad_inventory      numeric := 0;
  v_data_product      numeric := 0;
  v_corridor_score    numeric := 0;
  v_rec               record;
begin
  -- demand density from signals (30d)
  select
    least(100, coalesce(
      (sum(signal_count) filter (where signal_type='search') * 0.3)
      + (sum(signal_count) filter (where signal_type='load_post') * 0.25)
      + (sum(signal_count) filter (where signal_type='broker_request') * 0.2)
      + (sum(signal_count) filter (where signal_type='escort_request') * 0.15)
      + (sum(signal_count) filter (where signal_type='failed_match') * 0.1)
    , 0))
  into v_demand_density
  from hc_corridor_demand_signals
  where corridor_id = p_corridor_id
    and captured_at >= now() - interval '30 days';

  -- commercial value from pricing observations
  select
    least(100, coalesce(
      (max(amount_median) filter (where observation_type='escort_rate') / 10)
      + (max(amount_median) filter (where observation_type='urgent_fill_premium') / 5)
      + (max(amount_median) filter (where observation_type='twic_premium') / 5)
    , 0))
  into v_commercial
  from hc_corridor_pricing_obs
  where corridor_id = p_corridor_id;

  -- scarcity from supply signals
  select
    least(100, greatest(0,
      100 - coalesce(sum(verified_count) filter (where supply_type in ('escorts','operators')), 0) * 2
        + coalesce(sum(signal_count), 0)
    ))
  into v_scarcity
  from hc_corridor_supply_signals ss
  left join hc_corridor_demand_signals ds
    on ds.corridor_id = ss.corridor_id
    and ds.signal_type = 'failed_match'
    and ds.captured_at >= now() - interval '30 days'
  where ss.corridor_id = p_corridor_id;

  -- permit + escort complexity from requirements count
  select
    least(100, count(*) filter (where requirement_type='permit') * 15),
    least(100, count(*) filter (where requirement_type in ('escort','pilot_car','police')) * 15)
  into v_permit_complex, v_escort_complex
  from hc_corridor_requirements
  where corridor_id = p_corridor_id;

  -- credential complexity
  select least(100, count(*) * 20)
  into v_cred_complex
  from hc_corridor_credentials
  where corridor_id = p_corridor_id and required = true;

  -- SEO opportunity = search volume as proxy
  select least(100, coalesce(search_volume_estimate / 100.0, 0))
  into v_seo_opp
  from hc_corridors where id = p_corridor_id;

  -- repeat demand = route_save + alert_subscribe
  select least(100, coalesce(
    sum(signal_count) filter (where signal_type in ('route_save','alert_subscribe')) * 5, 0
  ))
  into v_repeat_demand
  from hc_corridor_demand_signals
  where corridor_id = p_corridor_id
    and captured_at >= now() - interval '30 days';

  -- strategic / ad / data: use corridor tier as proxy
  select
    case tier
      when 'flagship' then 80
      when 'national' then 60
      when 'regional' then 40
      when 'metro' then 30
      else 20
    end,
    case tier
      when 'flagship' then 75
      when 'national' then 55
      when 'regional' then 35
      else 15
    end,
    case tier
      when 'flagship' then 70
      when 'national' then 50
      when 'regional' then 30
      else 10
    end
  into v_strategic, v_ad_inventory, v_data_product
  from hc_corridors where id = p_corridor_id;

  -- weighted sum
  v_corridor_score :=
    (v_demand_density   * 0.20) +
    (v_commercial       * 0.15) +
    (v_seo_opp          * 0.12) +
    (v_repeat_demand    * 0.10) +
    (v_scarcity         * 0.10) +
    (v_permit_complex   * 0.08) +
    (v_escort_complex   * 0.08) +
    (v_cred_complex     * 0.05) +
    (v_infra_complex    * 0.04) +
    (v_strategic        * 0.03) +
    (v_ad_inventory     * 0.03) +
    (v_data_product     * 0.02);

  update public.hc_corridors set
    corridor_score              = round(least(100, v_corridor_score), 2),
    seo_priority_score          = round(v_seo_opp, 2),
    market_priority_score       = round(v_demand_density, 2),
    monetization_priority_score = round(v_commercial + v_scarcity * 0.3, 2),
    permit_complexity_score     = round(v_permit_complex, 2),
    escort_complexity_score     = round(v_escort_complex, 2),
    credential_complexity_score = round(v_cred_complex, 2),
    scarcity_score              = round(v_scarcity, 2),
    repeat_demand_score         = round(v_repeat_demand, 2),
    ad_inventory_score          = round(v_ad_inventory, 2),
    data_product_score          = round(v_data_product, 2),
    updated_at                  = now()
  where id = p_corridor_id;
end;
$$;

-- Batch scorer
create or replace function public.hc_score_all_corridors()
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select id from hc_corridors where active = true loop
    perform hc_compute_corridor_scores(r.id);
  end loop;
end;
$$;

-- ── Views ────────────────────────────────────────────────────────────────

create or replace view public.hc_corridor_public_v1 as
select
  c.id, c.corridor_code, c.slug, c.name, c.short_name,
  c.status, c.corridor_type, c.tier, c.country_code,
  c.primary_language_code, c.currency_code,
  c.origin_country_code, c.origin_region_code, c.origin_city_name,
  c.destination_country_code, c.destination_region_code, c.destination_city_name,
  c.is_cross_border, c.distance_km, c.distance_miles, c.typical_mode,
  c.corridor_score, c.seo_priority_score, c.market_priority_score,
  c.monetization_priority_score, c.freshness_score, c.confidence_score,
  c.permit_complexity_score, c.escort_complexity_score,
  c.credential_complexity_score, c.scarcity_score, c.urgency_score,
  c.ad_inventory_score, c.commercial_value_estimate, c.search_volume_estimate,
  req.requirement_count, req.permit_count, req.escort_count,
  cr.credential_count, cr.required_credential_count,
  pr.escort_rate_median, pr.operator_rate_median, pr.urgent_fill_premium
from public.hc_corridors c
left join (
  select corridor_id,
    count(*) as requirement_count,
    count(*) filter (where requirement_type='permit') as permit_count,
    count(*) filter (where requirement_type in ('escort','pilot_car')) as escort_count
  from public.hc_corridor_requirements
  group by corridor_id
) req on req.corridor_id = c.id
left join (
  select corridor_id,
    count(*) as credential_count,
    count(*) filter (where required=true) as required_credential_count
  from public.hc_corridor_credentials
  group by corridor_id
) cr on cr.corridor_id = c.id
left join (
  select corridor_id,
    max(amount_median) filter (where observation_type='escort_rate') as escort_rate_median,
    max(amount_median) filter (where observation_type='operator_rate') as operator_rate_median,
    max(amount_median) filter (where observation_type='urgent_fill_premium') as urgent_fill_premium
  from public.hc_corridor_pricing_obs
  group by corridor_id
) pr on pr.corridor_id = c.id
where c.active = true and c.status = 'active';

create or replace view public.hc_corridor_seo_queue_v1 as
select
  c.id as corridor_id, c.slug, c.country_code,
  c.corridor_score, c.seo_priority_score,
  p.page_type, p.publish_status,
  case
    when p.id is null then 'missing'
    when p.publish_status in ('draft','ready') then 'needs-generation'
    when p.last_generated_at is null then 'never-generated'
    when p.last_generated_at < now() - interval '7 days' then 'stale'
    else 'ok'
  end as generation_status
from public.hc_corridors c
left join public.hc_corridor_pages p on p.corridor_id = c.id
where c.active = true;

create or replace view public.hc_corridor_money_queue_v1 as
select
  id as corridor_id, slug, country_code,
  corridor_score, monetization_priority_score,
  ad_inventory_score, commercial_value_estimate, scarcity_score, urgency_score
from public.hc_corridors
where active = true and status = 'active'
order by monetization_priority_score desc, corridor_score desc;

-- ── RLS ──────────────────────────────────────────────────────────────────

alter table public.hc_corridors enable row level security;
alter table public.hc_corridor_nodes enable row level security;
alter table public.hc_corridor_requirements enable row level security;
alter table public.hc_credential_types enable row level security;
alter table public.hc_corridor_credentials enable row level security;
alter table public.hc_corridor_pricing_obs enable row level security;
alter table public.hc_corridor_demand_signals enable row level security;
alter table public.hc_corridor_supply_signals enable row level security;
alter table public.hc_corridor_pages enable row level security;
alter table public.hc_route_requests enable row level security;
alter table public.hc_corridor_internal_links enable row level security;

-- public read on active corridors
drop policy if exists hc_corridors_pub_read on public.hc_corridors;
create policy hc_corridors_pub_read on public.hc_corridors
  for select to anon, authenticated
  using (active = true and status = 'active');

drop policy if exists hc_corridors_svc on public.hc_corridors;
create policy hc_corridors_svc on public.hc_corridors
  for all to service_role using (true) with check (true);

drop policy if exists hc_corridor_nodes_pub_read on public.hc_corridor_nodes;
create policy hc_corridor_nodes_pub_read on public.hc_corridor_nodes
  for select to anon, authenticated
  using (exists (select 1 from hc_corridors c where c.id = corridor_id and c.active and c.status='active'));

drop policy if exists hc_corridor_nodes_svc on public.hc_corridor_nodes;
create policy hc_corridor_nodes_svc on public.hc_corridor_nodes
  for all to service_role using (true) with check (true);

drop policy if exists hc_corridor_reqs_pub_read on public.hc_corridor_requirements;
create policy hc_corridor_reqs_pub_read on public.hc_corridor_requirements
  for select to anon, authenticated
  using (exists (select 1 from hc_corridors c where c.id = corridor_id and c.active and c.status='active'));

drop policy if exists hc_corridor_reqs_svc on public.hc_corridor_requirements;
create policy hc_corridor_reqs_svc on public.hc_corridor_requirements
  for all to service_role using (true) with check (true);

drop policy if exists hc_credential_types_pub_read on public.hc_credential_types;
create policy hc_credential_types_pub_read on public.hc_credential_types
  for select to anon, authenticated using (is_active = true);

drop policy if exists hc_credential_types_svc on public.hc_credential_types;
create policy hc_credential_types_svc on public.hc_credential_types
  for all to service_role using (true) with check (true);

drop policy if exists hc_corridor_creds_pub_read on public.hc_corridor_credentials;
create policy hc_corridor_creds_pub_read on public.hc_corridor_credentials
  for select to anon, authenticated
  using (exists (select 1 from hc_corridors c where c.id = corridor_id and c.active and c.status='active'));

drop policy if exists hc_corridor_creds_svc on public.hc_corridor_credentials;
create policy hc_corridor_creds_svc on public.hc_corridor_credentials
  for all to service_role using (true) with check (true);

drop policy if exists hc_corridor_pricing_pub_read on public.hc_corridor_pricing_obs;
create policy hc_corridor_pricing_pub_read on public.hc_corridor_pricing_obs
  for select to anon, authenticated
  using (exists (select 1 from hc_corridors c where c.id = corridor_id and c.active and c.status='active'));

drop policy if exists hc_corridor_pricing_svc on public.hc_corridor_pricing_obs;
create policy hc_corridor_pricing_svc on public.hc_corridor_pricing_obs
  for all to service_role using (true) with check (true);

-- demand + supply: service only
drop policy if exists hc_corridor_demand_svc on public.hc_corridor_demand_signals;
create policy hc_corridor_demand_svc on public.hc_corridor_demand_signals
  for all to service_role using (true) with check (true);

drop policy if exists hc_corridor_supply_svc on public.hc_corridor_supply_signals;
create policy hc_corridor_supply_svc on public.hc_corridor_supply_signals
  for all to service_role using (true) with check (true);

-- corridor pages: published only for public
drop policy if exists hc_corridor_pages_pub_read on public.hc_corridor_pages;
create policy hc_corridor_pages_pub_read on public.hc_corridor_pages
  for select to anon, authenticated
  using (publish_status = 'published' and indexable = true);

drop policy if exists hc_corridor_pages_svc on public.hc_corridor_pages;
create policy hc_corridor_pages_svc on public.hc_corridor_pages
  for all to service_role using (true) with check (true);

-- route requests: authenticated insert, service all
drop policy if exists hc_route_requests_auth_insert on public.hc_route_requests;
create policy hc_route_requests_auth_insert on public.hc_route_requests
  for insert to authenticated with check (true);

drop policy if exists hc_route_requests_svc on public.hc_route_requests;
create policy hc_route_requests_svc on public.hc_route_requests
  for all to service_role using (true) with check (true);

-- internal links: public read active, svc all
drop policy if exists hc_corridor_links_pub_read on public.hc_corridor_internal_links;
create policy hc_corridor_links_pub_read on public.hc_corridor_internal_links
  for select to anon, authenticated using (active = true);

drop policy if exists hc_corridor_links_svc on public.hc_corridor_internal_links;
create policy hc_corridor_links_svc on public.hc_corridor_internal_links
  for all to service_role using (true) with check (true);

commit;
