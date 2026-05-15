-- Haul Command category-directory, claimability, and canonical-host policy.
-- Captures the live Supabase decisions made during the May 15 directory sprint:
-- every entity is claimable, public/authority assets use steward/reference claims,
-- category directories are first-class surfaces, and public URLs resolve to www.

create table if not exists public.hc_directory_category_registry (
  category_key text primary key,
  public_label text not null,
  route_slug text not null unique,
  ecosystem_family text not null,
  category_intent text not null,
  primary_roles text[] not null default '{}',
  secondary_roles text[] not null default '{}',
  entity_subtypes text[] not null default '{}',
  data_sources text[] not null default '{}',
  source_ladder text[] not null default '{}',
  claim_route text not null default '/claim',
  lead_route text not null default '/route-request',
  sponsor_route text not null default '/advertise',
  index_policy text not null default 'noindex_until_threshold',
  minimum_records_to_index integer not null default 10,
  minimum_country_records_to_index integer not null default 3,
  schema_org_type text not null default 'LocalBusiness',
  answer_card_intents text[] not null default '{}',
  monetization_paths text[] not null default '{}',
  trust_requirements text[] not null default '{}',
  country_rollout_priority text[] not null default array['US','CA','AU','GB','DE','NL','BR','MX'],
  source_notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hc_directory_category_registry enable row level security;

drop policy if exists "public read active directory categories" on public.hc_directory_category_registry;
create policy "public read active directory categories"
on public.hc_directory_category_registry
for select
to anon, authenticated
using (active = true);

grant select on public.hc_directory_category_registry to anon, authenticated;

create index if not exists idx_hc_directory_category_registry_active
on public.hc_directory_category_registry (active, route_slug);

create index if not exists idx_hc_directory_category_registry_family
on public.hc_directory_category_registry (ecosystem_family)
where active = true;

update public.hc_directory_entity_types
set is_claimable = true,
    updated_at = now()
where coalesce(is_claimable, false) is false;

update public.directory_entities
set is_claimable = true,
    updated_at = now()
where coalesce(is_claimable, false) is false
  and coalesce(listing_status, status, 'active') <> all (array['merged','removed','deleted','hidden']);

update public.hc_directory_category_registry
set trust_requirements = (
      select array_agg(distinct requirement order by requirement)
      from unnest(
        coalesce(trust_requirements, '{}'::text[])
        || array[
          'human_steward_claim_required',
          'capability_or_authority_proof_before_verified_badge',
          'public_source'
        ]
      ) as requirement
    ),
    updated_at = now();

insert into public.hc_policy (key, description, value_type, default_value, updated_at)
values
  (
    'directory.entity.claim_required_for_every_entity',
    'Every Haul Command directory entity requires a claim, steward, authority, or authorized representative path. Public assets are not exempt.',
    'bool',
    'true'::jsonb,
    now()
  ),
  (
    'directory.entity.claim_actor_model',
    'Accepted entity claim actors include owner, operator, manager, agency staff, contractor, facility steward, authority representative, or other authorized human.',
    'text',
    '"owner_operator_authority_steward_or_authorized_representative"'::jsonb,
    now()
  ),
  (
    'directory.entity.public_infrastructure_claim_type',
    'Rest areas, tunnels, weigh stations, ports, border crossings, parking, and other public infrastructure use steward/reference claims with manual review.',
    'text',
    '"steward_or_reference_claim_with_manual_review"'::jsonb,
    now()
  ),
  (
    'directory.category_registry.required',
    'Category directories are first-class Haul Command SEO/AEO surfaces and must map roles, entity types, data sources, index policy, claim route, lead route, and sponsor route.',
    'boolean',
    'true'::jsonb,
    now()
  ),
  (
    'seo.canonical_domain',
    'Canonical public SEO host. Generated vercel.app deployment hosts must be noindexed and must not appear in sitemap/canonical/public links.',
    'text',
    '"https://www.haulcommand.com"'::jsonb,
    now()
  )
on conflict (key) do update
set description = excluded.description,
    value_type = excluded.value_type,
    default_value = excluded.default_value,
    updated_at = now();

create or replace view public.v_hc_directory_active
with (security_invoker = true) as
select
  de.id,
  de.hc_id,
  de.entity_type,
  de.entity_subtype,
  dt.display_name_singular as entity_subtype_label,
  dt.entity_family,
  de.name,
  de.display_name,
  de.normalized_name,
  de.slug,
  de.phone,
  de.normalized_phone,
  de.email,
  de.website,
  de.lat,
  de.lng,
  de.city,
  de.admin1_code,
  de.country_code,
  de.postal_code,
  de.profile_url,
  de.confidence_score,
  de.trust_score,
  de.claim_status,
  de.visibility_status,
  de.is_claimable,
  de.listing_status,
  de.last_seen_at,
  de.created_at,
  de.phone is not null as has_phone,
  de.website is not null as has_website,
  de.email is not null as has_email,
  de.lat is not null as has_geo,
  'https://www.haulcommand.com'::text
    || coalesce(de.profile_url, (('/directory/'::text || de.entity_subtype) || '/'::text) || de.id::text) as public_url
from public.directory_entities de
left join public.hc_directory_entity_types dt on dt.entity_subtype = de.entity_subtype
where de.merge_status is distinct from 'merged'::text
  and de.visibility_status = any (array['publishable_unclaimed'::text, 'verified_active'::text])
  and coalesce(de.listing_status, 'active'::text) <> all (array['merged'::text, 'removed'::text, 'deleted'::text, 'hidden'::text]);

create or replace view public.v_hc_directory_category_coverage
with (security_invoker = true) as
with category_subtypes as (
  select r.category_key, unnest(r.entity_subtypes) as entity_subtype
  from public.hc_directory_category_registry r
  where r.active
),
directory_rollup as (
  select
    cs.category_key,
    count(*) as directory_records,
    count(*) filter (where de.country_code = 'US'::bpchar) as directory_records_us,
    count(*) filter (
      where coalesce(de.claim_status, '') = any (array['claimed','verified'])
         or coalesce(de.verification_status, '') = any (array['verified','claimed'])
    ) as claimed_or_verified_records,
    count(*) filter (where de.phone is not null or de.website is not null or de.email is not null) as records_with_contact_signal,
    count(distinct de.country_code) filter (where de.country_code is not null) as countries_with_records
  from category_subtypes cs
  join public.directory_entities de on de.entity_subtype = cs.entity_subtype
  where coalesce(de.visibility_status, de.status, 'visible') <> all (array['private','deleted','rejected'])
  group by cs.category_key
),
queue_rollup as (
  select
    cs.category_key,
    count(*) filter (where q.promotion_status = 'pending') as staged_pending_records,
    count(*) filter (where q.promotion_status = 'promoted') as staged_promoted_records
  from category_subtypes cs
  join public.hc_open_data_ingestion_queue q on q.target_entity_subtype = cs.entity_subtype
  group by cs.category_key
)
select
  r.category_key,
  r.public_label,
  r.route_slug,
  r.ecosystem_family,
  r.category_intent,
  r.primary_roles,
  r.secondary_roles,
  r.entity_subtypes,
  r.data_sources,
  r.claim_route,
  r.lead_route,
  r.sponsor_route,
  r.index_policy,
  r.minimum_records_to_index,
  r.minimum_country_records_to_index,
  r.schema_org_type,
  coalesce(d.directory_records, 0) as directory_records,
  coalesce(d.directory_records_us, 0) as directory_records_us,
  coalesce(d.claimed_or_verified_records, 0) as claimed_or_verified_records,
  coalesce(d.records_with_contact_signal, 0) as records_with_contact_signal,
  coalesce(d.countries_with_records, 0) as countries_with_records,
  coalesce(q.staged_pending_records, 0) as staged_pending_records,
  coalesce(q.staged_promoted_records, 0) as staged_promoted_records,
  case
    when coalesce(d.directory_records, 0) >= r.minimum_records_to_index then 'indexable_global'
    when coalesce(d.directory_records, 0) > 0 then 'useful_noindex_until_market_depth'
    else 'request_ready_noindex'
  end as computed_index_state,
  now() as computed_at
from public.hc_directory_category_registry r
left join directory_rollup d on d.category_key = r.category_key
left join queue_rollup q on q.category_key = r.category_key
where r.active;

create or replace view public.v_hc_directory_claim_requirements
with (security_invoker = true) as
select
  id,
  hc_id,
  name,
  display_name,
  entity_type,
  entity_subtype,
  entity_family,
  country_code,
  admin1_code,
  city,
  claim_status,
  true as claim_required,
  true as human_steward_required,
  case
    when entity_family = 'authority' or entity_subtype ilike '%authority%' or entity_subtype ilike '%permit_office%'
      then 'official_authority_or_authorized_staff'
    when entity_family = 'infrastructure'
      or entity_subtype = any (array['rest_area','weigh_station','truck_parking','port','rail_intermodal','border_crossing'])
      then 'facility_operator_agency_contractor_or_maintenance_steward'
    when entity_family = 'broker' or entity_subtype ilike '%broker%'
      then 'licensed_business_owner_or_authorized_broker_rep'
    when entity_family = 'operator'
      then 'operator_owner_dispatcher_or_authorized_manager'
    when entity_family = 'support'
      then 'service_owner_manager_or_authorized_provider_rep'
    else 'owner_operator_manager_or_authorized_representative'
  end as accepted_claim_actor,
  case
    when entity_family = 'authority' or entity_subtype ilike '%authority%' or entity_subtype ilike '%permit_office%'
      then array['official email/domain','agency page or public contact match','manual admin approval','no fake private ownership claim']
    when entity_family = 'infrastructure'
      or entity_subtype = any (array['rest_area','weigh_station','truck_parking','port','rail_intermodal','border_crossing'])
      then array['operator/agency/contractor proof','facility website or public source match','phone/domain verification','manual review when public asset']
    else array['business email/domain','phone verification','website match','document or admin review for verified badge']
  end as required_claim_proof,
  case
    when entity_family = 'authority' or entity_subtype ilike '%authority%' or entity_subtype ilike '%permit_office%'
      then 'reference_claim'
    when entity_family = 'infrastructure'
      or entity_subtype = any (array['rest_area','weigh_station','truck_parking','port','rail_intermodal','border_crossing'])
      then 'steward_claim'
    else 'business_claim'
  end as claim_type,
  '/claim?entity='::text || id::text as claim_route,
  now() as computed_at
from public.v_hc_directory_active;

create or replace view public.v_hc_role_category_coverage
with (security_invoker = true) as
with direct_category_roles as (
  select role_key.role_key, c.category_key, c.public_label, c.route_slug, 'direct_registry_role'::text as coverage_source
  from public.hc_directory_category_registry c
  cross join lateral unnest(c.primary_roles || c.secondary_roles) role_key(role_key)
  where c.active
),
entity_category_roles as (
  select m.role_key, c.category_key, c.public_label, c.route_slug, 'entity_subtype_map'::text as coverage_source
  from public.hc_role_entity_type_map m
  join public.hc_directory_category_registry c on m.entity_subtype = any (c.entity_subtypes)
  where c.active
),
all_category_roles as (
  select * from direct_category_roles
  union all
  select * from entity_category_roles
),
role_category_rollup as (
  select
    role_key,
    array_agg(distinct category_key order by category_key) as category_keys,
    array_agg(distinct public_label order by public_label) as category_labels,
    array_agg(distinct route_slug order by route_slug) as category_route_slugs,
    array_agg(distinct coverage_source order by coverage_source) as coverage_sources
  from all_category_roles
  group by role_key
)
select
  r.role_key,
  r.display_name,
  r.role_family,
  r.entity_family,
  r.directory_slug,
  r.role_hub_path,
  r.marketplace_side,
  r.monetization_paths,
  r.activation_priority,
  r.can_be_legally_advertised,
  coalesce(cardinality(rc.category_keys), 0) as category_count,
  coalesce(rc.category_keys, '{}'::text[]) as category_keys,
  coalesce(rc.category_labels, '{}'::text[]) as category_labels,
  coalesce(rc.category_route_slugs, '{}'::text[]) as category_route_slugs,
  coalesce(rc.coverage_sources, '{}'::text[]) as coverage_sources,
  rc.role_key is not null as has_category_surface,
  case
    when rc.role_key is not null then 'covered'
    when r.is_government_only then 'authority_steward_reference_category_needed'
    when r.role_family = any (array['authority','authority_reference']) then 'authority_directory_category_needed'
    when r.role_family = 'border_port_site' then 'border_port_project_cargo_category_needed'
    when r.role_family = any (array['broker','demand_side']) then 'broker_dispatch_market_category_needed'
    when r.role_family = any (array['coordinator','permit_route_regulatory']) then 'permit_route_coordination_category_needed'
    when r.role_family = any (array['equipment_services','field_support','installer']) then 'field_support_equipment_category_needed'
    when r.role_family = 'infrastructure' then 'infrastructure_site_category_needed'
    when r.role_family = 'service' then 'professional_service_category_needed'
    when r.role_family = 'specialist' then 'specialist_work_category_needed'
    when r.role_family = 'training' then 'training_credential_category_needed'
    else 'role_family_review_needed'
  end as recommended_expansion_family,
  case
    when rc.role_key is not null then 'keep_existing_category_surface'
    when r.is_government_only then 'Create authority or public-infrastructure category with steward/reference claim path, source confidence, safety/usefulness facts, and no fake private ownership or government endorsement claims.'
    when r.role_family = any (array['authority','authority_reference']) then 'Create authority/reference directory with official source confidence, steward/reference claim routing, and no government endorsement claims.'
    when r.role_family = 'border_port_site' then 'Create border, customs, port, and project-cargo coordination categories.'
    when r.role_family = any (array['broker','demand_side']) then 'Create broker, dispatcher, shipper, and demand-side work-routing categories.'
    when r.role_family = any (array['coordinator','permit_route_regulatory']) then 'Create permit, route survey, compliance, and jurisdiction coordination categories.'
    when r.role_family = any (array['equipment_services','field_support','installer']) then 'Create field support, equipment service, installer, and clearance crew categories.'
    when r.role_family = 'infrastructure' then 'Create infrastructure, yard, port, rail, border, rest-area, weigh-station, and route-support site categories with steward claims and field-condition facts.'
    when r.role_family = 'service' then 'Create professional service, finance, software, testing, documentation, and insurance categories.'
    when r.role_family = 'specialist' then 'Create specialist heavy-haul modality categories by cargo, equipment, and environment.'
    when r.role_family = 'training' then 'Create training, credential, association, and certification categories.'
    else 'Review role manually and decide whether it needs a claimable category, reference page, or app workflow category.'
  end as recommended_next_action
from public.v_hc_role_command_center r
left join role_category_rollup rc on rc.role_key = r.role_key
where r.role_key is not null;

create or replace view public.v_hc_category_expansion_backlog
with (security_invoker = true) as
select
  recommended_expansion_family,
  role_family,
  entity_family,
  count(*)::integer as uncovered_role_count,
  (array_agg(role_key order by activation_priority, role_key))[1:20] as sample_role_keys,
  (array_agg(display_name order by activation_priority, display_name))[1:20] as sample_display_names,
  min(activation_priority) as highest_activation_priority,
  bool_or(can_be_legally_advertised) as has_advertisable_roles
from public.v_hc_role_category_coverage
where not has_category_surface
group by recommended_expansion_family, role_family, entity_family;

grant select on public.v_hc_directory_active to anon, authenticated;
grant select on public.v_hc_directory_category_coverage to anon, authenticated;
grant select on public.v_hc_directory_claim_requirements to anon, authenticated;
grant select on public.v_hc_role_category_coverage to anon, authenticated;
grant select on public.v_hc_category_expansion_backlog to anon, authenticated;
