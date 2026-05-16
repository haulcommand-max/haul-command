-- AV unified read views, private-by-default.
--
-- This intentionally does NOT grant anon/authenticated access. These views are
-- server-side read paths for service-role/API code until a separate public
-- exposure review approves RLS/API access.

begin;

-- ---------------------------------------------------------------------------
-- Operator layer parity. These columns are additive and safe if Claude's live
-- parity migration already added them.
-- ---------------------------------------------------------------------------

alter table if exists public.directory_entities
  add column if not exists country_code text,
  add column if not exists admin1_code text,
  add column if not exists city text,
  add column if not exists website_url text,
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists about text,
  add column if not exists specialties text[] default '{}',
  add column if not exists av_ready boolean default false,
  add column if not exists drone_survey_capable boolean default false,
  add column if not exists digital_permit_specialist boolean default false,
  add column if not exists ev_route_capable boolean default false,
  add column if not exists future_capability_tags text[] default '{}',
  add column if not exists av_capability_inferred_at timestamptz,
  add column if not exists av_capability_confidence_label text,
  add column if not exists av_capability_source text;

alter table if exists public.hc_operators
  add column if not exists country_code text,
  add column if not exists admin1_code text,
  add column if not exists city text,
  add column if not exists website_url text,
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists about text,
  add column if not exists specialties text[] default '{}',
  add column if not exists av_ready boolean default false,
  add column if not exists drone_survey_capable boolean default false,
  add column if not exists digital_permit_specialist boolean default false,
  add column if not exists ev_route_capable boolean default false,
  add column if not exists future_capability_tags text[] default '{}',
  add column if not exists av_capability_inferred_at timestamptz,
  add column if not exists av_capability_confidence_label text,
  add column if not exists av_capability_source text;

alter table if exists public.hc_global_operators
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists about text,
  add column if not exists specialties text[] default '{}',
  add column if not exists av_ready boolean default false,
  add column if not exists drone_survey_capable boolean default false,
  add column if not exists digital_permit_specialist boolean default false,
  add column if not exists ev_route_capable boolean default false,
  add column if not exists future_capability_tags text[] default '{}',
  add column if not exists av_capability_inferred_at timestamptz,
  add column if not exists av_capability_confidence_label text,
  add column if not exists av_capability_source text;

create index if not exists idx_directory_entities_av_capability
  on public.directory_entities (av_ready, drone_survey_capable, ev_route_capable);
create index if not exists idx_hc_operators_av_capability
  on public.hc_operators (av_ready, drone_survey_capable, ev_route_capable);
create index if not exists idx_hc_global_operators_av_capability
  on public.hc_global_operators (av_ready, drone_survey_capable, ev_route_capable);

create or replace view public.v_av_operator_universe
with (security_invoker = true) as
with unioned as (
  select
    1 as layer_priority,
    'directory_entities'::text as source_table,
    id::text as source_id,
    id::text as operator_id,
    slug,
    name,
    entity_type,
    country_code,
    admin1_code,
    city,
    website_url,
    lat,
    lng,
    about,
    specialties,
    av_ready,
    drone_survey_capable,
    digital_permit_specialist,
    ev_route_capable,
    future_capability_tags,
    av_capability_inferred_at,
    av_capability_confidence_label,
    av_capability_source,
    updated_at
  from public.directory_entities
  union all
  select
    2 as layer_priority,
    'hc_operators'::text as source_table,
    id::text as source_id,
    id::text as operator_id,
    slug,
    name,
    entity_type,
    country_code,
    admin1_code,
    city,
    website_url,
    lat,
    lng,
    about,
    specialties,
    av_ready,
    drone_survey_capable,
    digital_permit_specialist,
    ev_route_capable,
    future_capability_tags,
    av_capability_inferred_at,
    av_capability_confidence_label,
    av_capability_source,
    updated_at
  from public.hc_operators
  union all
  select
    3 as layer_priority,
    'hc_global_operators'::text as source_table,
    id::text as source_id,
    id::text as operator_id,
    slug,
    name,
    entity_type,
    country_code,
    admin1_code,
    city,
    website_url,
    lat,
    lng,
    about,
    specialties,
    av_ready,
    drone_survey_capable,
    digital_permit_specialist,
    ev_route_capable,
    future_capability_tags,
    av_capability_inferred_at,
    av_capability_confidence_label,
    av_capability_source,
    updated_at
  from public.hc_global_operators
),
ranked as (
  select
    unioned.*,
    row_number() over (
      partition by coalesce(nullif(slug, ''), source_table || ':' || source_id)
      order by layer_priority desc, updated_at desc nulls last
    ) as rn
  from unioned
)
select
  source_table,
  source_id,
  operator_id,
  slug,
  name,
  entity_type,
  country_code,
  admin1_code,
  city,
  website_url,
  lat,
  lng,
  about,
  specialties,
  av_ready,
  drone_survey_capable,
  digital_permit_specialist,
  ev_route_capable,
  future_capability_tags,
  av_capability_inferred_at,
  av_capability_confidence_label,
  av_capability_source,
  updated_at
from ranked
where rn = 1;

create or replace function public.read_av_operator_universe()
returns table (
  source_table text,
  source_id text,
  operator_id text,
  slug text,
  name text,
  entity_type text,
  country_code text,
  admin1_code text,
  city text,
  website_url text,
  lat double precision,
  lng double precision,
  about text,
  specialties text[],
  av_ready boolean,
  drone_survey_capable boolean,
  digital_permit_specialist boolean,
  ev_route_capable boolean,
  future_capability_tags text[],
  av_capability_inferred_at timestamptz,
  av_capability_confidence_label text,
  av_capability_source text,
  updated_at timestamptz
)
language plpgsql
stable
set search_path = public
as $$
begin
  if to_regclass('public.mv_av_operator_universe') is not null then
    return query execute
      'select source_table, source_id, operator_id, slug, name, entity_type, country_code, admin1_code, city, website_url, lat, lng, about, specialties, av_ready, drone_survey_capable, digital_permit_specialist, ev_route_capable, future_capability_tags, av_capability_inferred_at, av_capability_confidence_label, av_capability_source, updated_at from public.mv_av_operator_universe';
  end if;

  return query
    select
      v.source_table,
      v.source_id,
      v.operator_id,
      v.slug,
      v.name,
      v.entity_type,
      v.country_code,
      v.admin1_code,
      v.city,
      v.website_url,
      v.lat,
      v.lng,
      v.about,
      v.specialties,
      v.av_ready,
      v.drone_survey_capable,
      v.digital_permit_specialist,
      v.ev_route_capable,
      v.future_capability_tags,
      v.av_capability_inferred_at,
      v.av_capability_confidence_label,
      v.av_capability_source,
      v.updated_at
    from public.v_av_operator_universe v;
end;
$$;

-- ---------------------------------------------------------------------------
-- Corridor layer parity and unified AV readiness view.
-- ---------------------------------------------------------------------------

alter table if exists public.hc_corridors
  add column if not exists slug text,
  add column if not exists highway_number text,
  add column if not exists av_readiness_score numeric,
  add column if not exists av_regulatory_score numeric,
  add column if not exists av_infrastructure_score numeric,
  add column if not exists av_operator_supply_score numeric,
  add column if not exists av_permit_digitization_score numeric,
  add column if not exists av_emergency_support_score numeric,
  add column if not exists drone_route_survey_score numeric,
  add column if not exists ev_charging_score numeric,
  add column if not exists v2x_signal_score numeric,
  add column if not exists weather_resilience_score numeric,
  add column if not exists autonomous_recovery_score numeric,
  add column if not exists av_insurance_score numeric,
  add column if not exists av_data_confidence_score numeric,
  add column if not exists av_test_corridor boolean default false,
  add column if not exists av_commercial_corridor boolean default false,
  add column if not exists av_operators_active integer default 0,
  add column if not exists av_known_deployment_notes text,
  add column if not exists av_last_verified_at timestamptz,
  add column if not exists av_confidence_label text,
  add column if not exists av_source_urls text[] default '{}';

alter table if exists public.hc_corridor_spec
  add column if not exists slug text,
  add column if not exists name text,
  add column if not exists country_code text,
  add column if not exists highway_number text,
  add column if not exists av_readiness_score numeric,
  add column if not exists av_regulatory_score numeric,
  add column if not exists av_infrastructure_score numeric,
  add column if not exists av_operator_supply_score numeric,
  add column if not exists av_permit_digitization_score numeric,
  add column if not exists av_emergency_support_score numeric,
  add column if not exists drone_route_survey_score numeric,
  add column if not exists ev_charging_score numeric,
  add column if not exists v2x_signal_score numeric,
  add column if not exists weather_resilience_score numeric,
  add column if not exists autonomous_recovery_score numeric,
  add column if not exists av_insurance_score numeric,
  add column if not exists av_data_confidence_score numeric,
  add column if not exists av_test_corridor boolean default false,
  add column if not exists av_commercial_corridor boolean default false,
  add column if not exists av_operators_active integer default 0,
  add column if not exists av_known_deployment_notes text,
  add column if not exists av_last_verified_at timestamptz,
  add column if not exists av_confidence_label text,
  add column if not exists av_source_urls text[] default '{}',
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_hc_corridors_av_readiness
  on public.hc_corridors (av_readiness_score, av_confidence_label);
create index if not exists idx_hc_corridor_spec_av_readiness
  on public.hc_corridor_spec (av_readiness_score, av_confidence_label);

create or replace view public.v_av_corridor_readiness_unified
with (security_invoker = true) as
with unioned as (
  select
    1 as layer_priority,
    'hc_corridors'::text as source_table,
    id::text as source_id,
    coalesce(slug, corridor_key, lower(regexp_replace(coalesce(name, corridor_name, id::text), '[^a-zA-Z0-9]+', '-', 'g'))) as slug,
    coalesce(name, corridor_name) as name,
    country_code,
    coalesce(highway_number, highway) as highway_number,
    av_readiness_score,
    av_regulatory_score,
    av_infrastructure_score,
    av_operator_supply_score,
    av_permit_digitization_score,
    av_emergency_support_score,
    drone_route_survey_score,
    ev_charging_score,
    v2x_signal_score,
    weather_resilience_score,
    autonomous_recovery_score,
    av_insurance_score,
    av_data_confidence_score,
    av_test_corridor,
    av_commercial_corridor,
    av_operators_active,
    av_known_deployment_notes,
    av_last_verified_at,
    av_confidence_label,
    av_source_urls,
    updated_at
  from public.hc_corridors
  union all
  select
    2 as layer_priority,
    'hc_corridor_spec'::text as source_table,
    id::text as source_id,
    coalesce(slug, lower(regexp_replace(coalesce(name, id::text), '[^a-zA-Z0-9]+', '-', 'g'))) as slug,
    name,
    country_code,
    highway_number,
    av_readiness_score,
    av_regulatory_score,
    av_infrastructure_score,
    av_operator_supply_score,
    av_permit_digitization_score,
    av_emergency_support_score,
    drone_route_survey_score,
    ev_charging_score,
    v2x_signal_score,
    weather_resilience_score,
    autonomous_recovery_score,
    av_insurance_score,
    av_data_confidence_score,
    av_test_corridor,
    av_commercial_corridor,
    av_operators_active,
    av_known_deployment_notes,
    av_last_verified_at,
    av_confidence_label,
    av_source_urls,
    updated_at
  from public.hc_corridor_spec
),
ranked as (
  select
    unioned.*,
    row_number() over (
      partition by coalesce(nullif(slug, ''), source_table || ':' || source_id)
      order by (av_readiness_score is not null) desc, layer_priority desc, updated_at desc nulls last
    ) as rn
  from unioned
)
select
  source_table,
  source_id,
  slug,
  name,
  country_code,
  highway_number,
  av_readiness_score,
  av_regulatory_score,
  av_infrastructure_score,
  av_operator_supply_score,
  av_permit_digitization_score,
  av_emergency_support_score,
  drone_route_survey_score,
  ev_charging_score,
  v2x_signal_score,
  weather_resilience_score,
  autonomous_recovery_score,
  av_insurance_score,
  av_data_confidence_score,
  av_test_corridor,
  av_commercial_corridor,
  av_operators_active,
  av_known_deployment_notes,
  av_last_verified_at,
  av_confidence_label,
  av_source_urls,
  updated_at
from ranked
where rn = 1;

comment on view public.v_av_operator_universe is
  'Private service-role AV operator fallback view. Server-side reads should call read_av_operator_universe() so mv_av_operator_universe is preferred when present.';
comment on view public.v_av_corridor_readiness_unified is
  'Private service-role AV corridor read path. Do not grant anon/authenticated without a separate public exposure/RLS review.';
comment on function public.read_av_operator_universe() is
  'Private service-role AV operator read path. Prefers mv_av_operator_universe when present and falls back to v_av_operator_universe.';

revoke all on public.v_av_operator_universe from anon, authenticated;
revoke all on public.v_av_corridor_readiness_unified from anon, authenticated;
revoke all on function public.read_av_operator_universe() from public, anon, authenticated;
grant select on public.v_av_operator_universe to service_role;
grant select on public.v_av_corridor_readiness_unified to service_role;
grant execute on function public.read_av_operator_universe() to service_role;

do $$
begin
  if to_regclass('public.hc_policy') is not null then
    insert into public.hc_policy (key, description, default_value, updated_at)
    values
      (
        'canonical.operators.unified_av_read_view',
        'Server-side AV/operator reads must use read_av_operator_universe(), which prefers mv_av_operator_universe and falls back to v_av_operator_universe. It is private-by-default and not granted to anon/authenticated.',
        'read_av_operator_universe',
        now()
      ),
      (
        'canonical.corridors.unified_av_read_view',
        'Server-side AV/corridor reads must use v_av_corridor_readiness_unified. It is private-by-default and not granted to anon/authenticated.',
        'v_av_corridor_readiness_unified',
        now()
      )
    on conflict (key) do update
    set description = excluded.description,
        default_value = excluded.default_value,
        updated_at = now();
  end if;
end $$;

commit;
