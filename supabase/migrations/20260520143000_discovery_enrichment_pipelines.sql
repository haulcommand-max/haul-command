-- Discovery enrichment pipeline scaffolding.
-- Purpose: coordinate Tavily, Firecrawl, Clay, OSM, government registry,
-- association registry, and geocode work without duplicating canonical
-- directory/entity tables.

create table if not exists public.hc_discovery_source_templates (
  source_key text primary key,
  provider text not null check (
    provider in (
      'osm',
      'tavily',
      'firecrawl',
      'clay',
      'government_registry',
      'association_registry',
      'geocode'
    )
  ),
  source_type text not null check (
    source_type in ('gov', 'association', 'directory', 'maps', 'social', 'manual', 'partner', 'registry')
  ),
  source_name text not null,
  source_url text,
  country_codes text[] not null default '{}',
  target_entity_subtype text not null,
  role_terms text[] not null default '{}',
  query_template text,
  tag_patterns jsonb not null default '{}'::jsonb,
  priority integer not null default 100,
  active boolean not null default true,
  seasoning_required boolean not null default true,
  min_confidence_to_promote numeric(4,3) not null default 0.700,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hc_discovery_source_templates_active
  on public.hc_discovery_source_templates (active, provider, priority);

create index if not exists idx_hc_discovery_source_templates_subtype
  on public.hc_discovery_source_templates (target_entity_subtype)
  where active = true;

alter table public.hc_discovery_source_templates enable row level security;

drop policy if exists "authenticated read active discovery templates" on public.hc_discovery_source_templates;
create policy "authenticated read active discovery templates"
on public.hc_discovery_source_templates
for select
to authenticated
using (active = true);

create table if not exists public.hc_discovery_work_queue (
  id uuid primary key default gen_random_uuid(),
  source_key text references public.hc_discovery_source_templates(source_key) on delete set null,
  provider text not null check (
    provider in (
      'osm',
      'tavily',
      'firecrawl',
      'clay',
      'government_registry',
      'association_registry',
      'geocode'
    )
  ),
  job_type text not null check (
    job_type in (
      'osm_overpass_template',
      'tavily_search',
      'reverse_company_search',
      'firecrawl_scrape',
      'clay_enrichment',
      'authority_registry_scan',
      'association_member_scan',
      'geocode_backfill',
      'quality_dedup_review'
    )
  ),
  status text not null default 'pending' check (
    status in ('pending', 'running', 'succeeded', 'failed', 'skipped', 'quarantined')
  ),
  priority integer not null default 100,
  country_code text,
  region_code text,
  target_entity_subtype text,
  source_name text,
  source_url text,
  query text,
  payload jsonb not null default '{}'::jsonb,
  result_summary jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hc_discovery_work_queue_ready
  on public.hc_discovery_work_queue (status, run_after, priority, created_at);

create index if not exists idx_hc_discovery_work_queue_provider
  on public.hc_discovery_work_queue (provider, job_type, status);

create index if not exists idx_hc_discovery_work_queue_source
  on public.hc_discovery_work_queue (source_key, country_code, target_entity_subtype);

create unique index if not exists uniq_hc_discovery_pending_template_country
  on public.hc_discovery_work_queue (source_key, country_code, job_type)
  where status in ('pending', 'running');

alter table public.hc_discovery_work_queue enable row level security;

create or replace view public.v_hc_discovery_pipeline_health
with (security_invoker = true) as
select
  provider,
  job_type,
  status,
  count(*)::bigint as item_count,
  min(created_at) as oldest_created_at,
  max(updated_at) as newest_updated_at,
  count(*) filter (where status = 'pending' and run_after <= now())::bigint as ready_count,
  count(*) filter (where status = 'failed')::bigint as failed_count,
  case
    when count(*) filter (where status = 'failed') > 0 then 'needs_review'
    when count(*) filter (where status = 'pending' and run_after <= now()) > 0 then 'ready'
    else 'clear_or_waiting'
  end as operational_state
from public.hc_discovery_work_queue
group by provider, job_type, status;

create or replace function public.hc_enqueue_discovery_from_templates(
  p_limit integer default 100
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_inserted integer := 0;
begin
  with template_rows as (
    select
      t.source_key,
      t.provider,
      case
        when t.provider = 'osm' then 'osm_overpass_template'
        when t.provider = 'tavily' and t.source_key like '%reverse_company%' then 'reverse_company_search'
        when t.provider = 'tavily' then 'tavily_search'
        when t.provider = 'government_registry' then 'authority_registry_scan'
        when t.provider = 'association_registry' then 'association_member_scan'
        when t.provider = 'geocode' then 'geocode_backfill'
        else 'firecrawl_scrape'
      end as job_type,
      t.priority,
      country_code,
      t.target_entity_subtype,
      t.source_name,
      t.source_url,
      replace(coalesce(t.query_template, ''), '{country_code}', country_code) as query,
      jsonb_build_object(
        'role_terms', t.role_terms,
        'tag_patterns', t.tag_patterns,
        'seasoning_required', t.seasoning_required,
        'min_confidence_to_promote', t.min_confidence_to_promote,
        'notes', t.notes
      ) as payload
    from public.hc_discovery_source_templates t
    cross join lateral unnest(
      case when array_length(t.country_codes, 1) is null then array['US'] else t.country_codes end
    ) as country_code
    where t.active
    order by t.priority asc, t.source_key asc
    limit p_limit
  ),
  inserted as (
    insert into public.hc_discovery_work_queue (
      source_key,
      provider,
      job_type,
      priority,
      country_code,
      target_entity_subtype,
      source_name,
      source_url,
      query,
      payload
    )
    select
      source_key,
      provider,
      job_type,
      priority,
      country_code,
      target_entity_subtype,
      source_name,
      source_url,
      query,
      payload
    from template_rows
    on conflict do nothing
    returning 1
  )
  select count(*) into v_inserted from inserted;

  return jsonb_build_object('ok', true, 'inserted', v_inserted);
end;
$$;

create or replace function public.hc_enqueue_clay_from_tavily_raw()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.source_name ilike '%tavily%' then
    insert into public.hc_discovery_work_queue (
      provider,
      job_type,
      priority,
      country_code,
      target_entity_subtype,
      source_name,
      source_url,
      payload
    )
    values (
      'clay',
      'clay_enrichment',
      40,
      new.country_code,
      coalesce(new.payload->>'target_entity_subtype', 'heavy_haul_support_provider'),
      'clay_auto_from_tavily',
      new.source_url,
      jsonb_build_object(
        'raw_entity_id', new.id,
        'source_name', new.source_name,
        'external_id', new.external_id,
        'payload', new.payload
      )
    );
  end if;

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.hc_entities_raw') is not null then
    drop trigger if exists trg_hc_entities_raw_clay_from_tavily on public.hc_entities_raw;
    create trigger trg_hc_entities_raw_clay_from_tavily
      after insert on public.hc_entities_raw
      for each row
      execute function public.hc_enqueue_clay_from_tavily_raw();
  end if;
end $$;

insert into public.hc_discovery_source_templates (
  source_key,
  provider,
  source_type,
  source_name,
  source_url,
  country_codes,
  target_entity_subtype,
  role_terms,
  query_template,
  tag_patterns,
  priority,
  notes
)
values
  (
    'osm_weigh_station',
    'osm',
    'maps',
    'OpenStreetMap weigh stations',
    'https://overpass-api.de/api/interpreter',
    array['US','CA','AU','GB'],
    'weigh_station',
    array['weigh station','scale house','truck scale'],
    null,
    '{"highway":["weigh_station"],"amenity":["weighbridge"]}'::jsonb,
    10,
    'Public infrastructure. Claim model must be steward/reference, not private owner verification.'
  ),
  (
    'osm_truck_parking',
    'osm',
    'maps',
    'OpenStreetMap truck parking',
    'https://overpass-api.de/api/interpreter',
    array['US','CA','AU','GB'],
    'truck_parking',
    array['truck parking','oversize staging','rest area'],
    null,
    '{"amenity":["parking"],"parking":["truck","surface"],"hgv":["yes"]}'::jsonb,
    12,
    'Useful for staging, rest, and route-support pages. Do not imply oversize approval without source proof.'
  ),
  (
    'osm_port_terminal',
    'osm',
    'maps',
    'OpenStreetMap port terminals',
    'https://overpass-api.de/api/interpreter',
    array['US','CA','AU','GB','BR','MX','DE','NL'],
    'port_terminal',
    array['port terminal','breakbulk','project cargo'],
    null,
    '{"landuse":["port"],"industrial":["port"],"harbour":["yes"]}'::jsonb,
    14,
    'Ports support route/corridor authority pages and sponsor inventory.'
  ),
  (
    'osm_rail_intermodal',
    'osm',
    'maps',
    'OpenStreetMap freight rail intermodal',
    'https://overpass-api.de/api/interpreter',
    array['US','CA','AU','GB','DE','NL'],
    'rail_intermodal',
    array['intermodal terminal','freight rail','project cargo rail'],
    null,
    '{"railway":["station","yard"],"usage":["freight"],"landuse":["railway"]}'::jsonb,
    16,
    'Intermodal support is a corridor and data-product signal.'
  ),
  (
    'osm_industrial_yard',
    'osm',
    'maps',
    'OpenStreetMap industrial yards',
    'https://overpass-api.de/api/interpreter',
    array['US','CA','AU','GB','BR','MX'],
    'industrial_yard',
    array['industrial yard','laydown yard','heavy equipment yard'],
    null,
    '{"landuse":["industrial"],"industrial":["logistics","warehouse","heavy_industry"]}'::jsonb,
    18,
    'Use as opportunity data, not as verified service-provider proof.'
  ),
  (
    'osm_crane_service',
    'osm',
    'maps',
    'OpenStreetMap crane and lifting services',
    'https://overpass-api.de/api/interpreter',
    array['US','CA','AU','GB'],
    'crane_service',
    array['crane service','rigging','heavy lift'],
    null,
    '{"shop":["crane"],"industrial":["crane"],"craft":["crane_operator"]}'::jsonb,
    20,
    'Specialist support role; require contact/source confidence before promotion.'
  ),
  (
    'osm_truck_repair_heavy',
    'osm',
    'maps',
    'OpenStreetMap heavy truck repair',
    'https://overpass-api.de/api/interpreter',
    array['US','CA','AU','GB'],
    'mobile_mechanic',
    array['heavy truck repair','mobile diesel mechanic','roadside repair'],
    null,
    '{"shop":["truck_repair","car_repair"],"service:vehicle:hgv":["yes"],"hgv":["yes"]}'::jsonb,
    22,
    'Support provider category; claim path required before verified badge.'
  ),
  (
    'osm_tire_service_truck',
    'osm',
    'maps',
    'OpenStreetMap truck tire service',
    'https://overpass-api.de/api/interpreter',
    array['US','CA','AU','GB'],
    'tire_service',
    array['truck tire service','roadside tire','commercial tire'],
    null,
    '{"shop":["tyres"],"service:vehicle:hgv":["yes"],"hgv":["yes"]}'::jsonb,
    24,
    'Emergency support category; do not claim 24/7 unless source proves it.'
  ),
  (
    'osm_truck_wash',
    'osm',
    'maps',
    'OpenStreetMap truck wash',
    'https://overpass-api.de/api/interpreter',
    array['US','CA','AU','GB'],
    'truck_wash',
    array['truck wash','fleet wash','oversize wash bay'],
    null,
    '{"amenity":["car_wash"],"service:vehicle:hgv":["yes"],"hgv":["yes"]}'::jsonb,
    26,
    'Useful ancillary service; keep noindex until market depth exists.'
  ),
  (
    'osm_border_crossing_freight',
    'osm',
    'maps',
    'OpenStreetMap freight border crossings',
    'https://overpass-api.de/api/interpreter',
    array['US','CA','MX','GB','DE','NL'],
    'border_crossing',
    array['border crossing','customs broker','cross-border heavy haul'],
    null,
    '{"barrier":["border_control"],"amenity":["customs"],"hgv":["yes"]}'::jsonb,
    28,
    'Public authority/infrastructure asset. Steward/reference claim only.'
  ),
  (
    'osm_staging_yard',
    'osm',
    'maps',
    'OpenStreetMap staging yards',
    'https://overpass-api.de/api/interpreter',
    array['US','CA','AU','GB'],
    'staging_yard',
    array['staging yard','laydown yard','oversize parking'],
    null,
    '{"amenity":["parking"],"landuse":["industrial","commercial"],"access":["customers","permissive"]}'::jsonb,
    30,
    'Treat as candidate data only until contact/source confirmation.'
  ),
  (
    'osm_training_center_transport',
    'osm',
    'maps',
    'OpenStreetMap transport training centers',
    'https://overpass-api.de/api/interpreter',
    array['US','CA','AU','GB'],
    'training_provider',
    array['pilot car training','heavy haul training','transport training'],
    null,
    '{"amenity":["school","college"],"training":["transport","driver"],"education":["transport"]}'::jsonb,
    32,
    'Training provider candidates require authority/source review before public recommendation.'
  ),
  (
    'tavily_rare_specialist_roles',
    'tavily',
    'directory',
    'Tavily rare heavy-haul specialist role search',
    null,
    array['US','CA','AU','GB'],
    'heavy_haul_support_provider',
    array['bucket truck escort','bridge jumper','route surveyor','steer car','traffic control','police escort coordination'],
    '("{country_code}" "oversize load" OR "heavy haul") ("bucket truck" OR "route survey" OR "steer car" OR "traffic control" OR "pilot escort") company contact',
    '{}'::jsonb,
    34,
    'Tavily discovery must season through raw queue, dedupe, contact confidence, and claim path before promotion.'
  ),
  (
    'tavily_reverse_company_search',
    'tavily',
    'directory',
    'Tavily reverse company search',
    null,
    array['US','CA','AU','GB'],
    'heavy_haul_support_provider',
    array['pilot car','escort vehicle','oversize permit','route survey'],
    '"{company_name}" ("pilot car" OR "escort vehicle" OR "oversize permit" OR "route survey")',
    '{}'::jsonb,
    36,
    'Use for evidence expansion after a candidate already exists. Requires payload.company_name.'
  ),
  (
    'gov_fmcsa_registry',
    'government_registry',
    'gov',
    'FMCSA Census and SAFER',
    'https://ai.fmcsa.dot.gov/SMS/files/FMCSA_CENSUS1_2025.zip',
    array['US'],
    'carrier_or_broker',
    array['motor carrier','broker','freight forwarder'],
    null,
    '{}'::jsonb,
    38,
    'Existing /api/cron/fmcsa-ingest handles the public census dataset; this template tracks the authority pipeline.'
  ),
  (
    'gov_nhvr_registry',
    'government_registry',
    'gov',
    'National Heavy Vehicle Regulator',
    'https://www.nhvr.gov.au/',
    array['AU'],
    'authority_or_permit_office',
    array['heavy vehicle permit','pilot vehicle','oversize overmass'],
    null,
    '{}'::jsonb,
    40,
    'Authority source. Use for rules and contacts, not private-provider proof.'
  ),
  (
    'gov_dvsa_abnormal_loads',
    'government_registry',
    'gov',
    'DVSA abnormal loads and vehicle operator authority',
    'https://www.gov.uk/government/organisations/driver-and-vehicle-standards-agency',
    array['GB'],
    'authority_or_permit_office',
    array['abnormal loads','special types','vehicle operator'],
    null,
    '{}'::jsonb,
    42,
    'Authority source for UK abnormal load context.'
  ),
  (
    'assoc_npcea_members',
    'association_registry',
    'association',
    'National Pilot Car Escort Association',
    'https://www.npcea.org/',
    array['US'],
    'pilot_car_operator',
    array['pilot car','escort vehicle','certified escort'],
    null,
    '{}'::jsonb,
    44,
    'Association member data requires source permission and claim seasoning before directory promotion.'
  ),
  (
    'assoc_scra_members',
    'association_registry',
    'association',
    'Specialized Carriers and Rigging Association',
    'https://www.scranet.org/',
    array['US','CA'],
    'heavy_haul_support_provider',
    array['specialized carrier','rigging','heavy haul','crane'],
    null,
    '{}'::jsonb,
    46,
    'Association source. Respect robots/terms and use citation/proof only.'
  ),
  (
    'geocode_missing_directory_geo',
    'geocode',
    'directory',
    'Nominatim and Photon geocode backfill',
    null,
    array['US','CA','AU','GB'],
    'heavy_haul_support_provider',
    array['geocode','address cleanup','lat lng backfill'],
    null,
    '{}'::jsonb,
    48,
    'Use Nominatim first with respectful user agent, then Photon fallback. Do not overwrite verified coordinates without review.'
  )
on conflict (source_key) do update
set provider = excluded.provider,
    source_type = excluded.source_type,
    source_name = excluded.source_name,
    source_url = excluded.source_url,
    country_codes = excluded.country_codes,
    target_entity_subtype = excluded.target_entity_subtype,
    role_terms = excluded.role_terms,
    query_template = excluded.query_template,
    tag_patterns = excluded.tag_patterns,
    priority = excluded.priority,
    active = excluded.active,
    seasoning_required = excluded.seasoning_required,
    min_confidence_to_promote = excluded.min_confidence_to_promote,
    notes = excluded.notes,
    updated_at = now();
