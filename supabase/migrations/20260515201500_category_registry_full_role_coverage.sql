-- Category registry full role coverage.
-- Purpose: every canonical role must route into at least one first-class
-- category-directory surface so role, category, entity, service, claim, and SEO
-- systems do not drift apart.

with missing_roles as (
  select
    r.role_key,
    coalesce(r.role_family, r.entity_family, 'unknown') as role_family,
    case
      when coalesce(r.role_family, r.entity_family, '') in ('authority', 'authority_reference') then 'authority_reference_directory'
      when coalesce(r.role_family, r.entity_family, '') in ('broker', 'dispatcher', 'demand_side') then 'broker_dispatch_market'
      when coalesce(r.role_family, r.entity_family, '') in ('carrier', 'specialized_carrier', 'demand_side') then 'heavy_haul_specialist_work'
      when coalesce(r.role_family, r.entity_family, '') in ('compliance', 'permit', 'permit_agent', 'route') then 'permit_route_coordination'
      when coalesce(r.role_family, r.entity_family, '') in ('coordinator') then 'permit_route_coordination'
      when coalesce(r.role_family, r.entity_family, '') in ('crew', 'escort', 'escort_and_convoy', 'escort_operations', 'field_support') then 'field_support_equipment_crews'
      when coalesce(r.role_family, r.entity_family, '') in ('equipment', 'supplier', 'supplier_equipment') then 'supplier_equipment_support'
      when coalesce(r.role_family, r.entity_family, '') in ('equipment_services', 'repair_maintenance') then 'truck_trailer_repair'
      when coalesce(r.role_family, r.entity_family, '') in ('financial_services') then 'truck_insurance'
      when coalesce(r.role_family, r.entity_family, '') in ('infrastructure', 'infrastructure_parking', 'infrastructure_sites') then 'infrastructure_sites'
      when coalesce(r.role_family, r.entity_family, '') in ('training', 'training_credentials') then 'training_credential_providers'
      when coalesce(r.role_family, r.entity_family, '') in ('border_port_site', 'border_port_project_cargo') then 'border_port_project_cargo'
      when coalesce(r.role_family, r.entity_family, '') in ('environmental_emergency') then 'spill_response'
      when coalesce(r.role_family, r.entity_family, '') in ('support_market', 'professional_services') then 'support_market_services'
      else 'role_family_review_queue'
    end as target_category_key
  from public.canonical_roles r
  where not exists (
    select 1
    from public.hc_directory_category_registry c
    where r.role_key = any(c.primary_roles)
       or r.role_key = any(c.secondary_roles)
  )
),
role_rollup as (
  select target_category_key, array_agg(role_key order by role_key) as role_keys
  from missing_roles
  group by target_category_key
)
update public.hc_directory_category_registry c
set secondary_roles = (
      select array_agg(distinct role_key order by role_key)
      from unnest(coalesce(c.secondary_roles, '{}'::text[]) || rr.role_keys) as role_key
    ),
    trust_requirements = (
      select array_agg(distinct requirement order by requirement)
      from unnest(
        coalesce(c.trust_requirements, '{}'::text[])
        || array['role_category_mapping_reviewed', 'claim_path_required']
      ) as requirement
    ),
    updated_at = now()
from role_rollup rr
where c.category_key = rr.target_category_key;

insert into public.hc_policy (key, description, value_type, default_value, updated_at)
values (
  'directory.category_registry.role_coverage_required',
  'Every canonical role must map to at least one active category-directory registry row through primary_roles or secondary_roles. Remaining unmapped roles are a release blocker.',
  'bool',
  'true'::jsonb,
  now()
)
on conflict (key) do update
set description = excluded.description,
    value_type = excluded.value_type,
    default_value = excluded.default_value,
    updated_at = now();

create or replace view public.v_hc_category_role_coverage
with (security_invoker = true) as
select
  count(*)::integer as roles_total,
  count(*) filter (
    where exists (
      select 1
      from public.hc_directory_category_registry c
      where c.active
        and (canonical_roles.role_key = any(c.primary_roles) or canonical_roles.role_key = any(c.secondary_roles))
    )
  )::integer as roles_mapped_to_category_registry,
  count(*) filter (
    where not exists (
      select 1
      from public.hc_directory_category_registry c
      where c.active
        and (canonical_roles.role_key = any(c.primary_roles) or canonical_roles.role_key = any(c.secondary_roles))
    )
  )::integer as roles_missing_category_registry,
  now() as checked_at
from public.canonical_roles;

grant select on public.v_hc_category_role_coverage to anon, authenticated;
