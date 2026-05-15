-- Public infrastructure condition layer.
-- Purpose: make rest areas, tunnels, weigh stations, parking, ports, and other
-- route-support assets useful beyond name/address by capturing human-reported
-- field facts with moderation and steward claim routing.

create table if not exists public.hc_public_infrastructure_condition_reports (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.directory_entities(id) on delete cascade,
  reporter_user_id uuid references auth.users(id) on delete set null,
  report_status text not null default 'pending' check (report_status in ('pending','approved','rejected','superseded')),
  source_type text not null default 'community_report' check (source_type in ('community_report','steward_report','official_source','admin_review')),
  open_status text check (open_status in ('open','closed','seasonal','unknown')),
  safety_rating integer check (safety_rating between 1 and 5),
  cleanliness_rating integer check (cleanliness_rating between 1 and 5),
  lighting_rating integer check (lighting_rating between 1 and 5),
  security_presence text check (security_presence in ('none_seen','occasional','active_security','law_enforcement_nearby','unknown')),
  wifi_available boolean,
  restrooms_available boolean,
  overnight_allowed boolean,
  oversized_access_notes text,
  hazard_notes text,
  amenity_notes text,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

alter table public.hc_public_infrastructure_condition_reports enable row level security;

drop policy if exists hc_public_infra_reports_approved_read on public.hc_public_infrastructure_condition_reports;
create policy hc_public_infra_reports_approved_read
on public.hc_public_infrastructure_condition_reports
for select
to anon, authenticated
using (report_status = 'approved');

drop policy if exists hc_public_infra_reports_authenticated_insert on public.hc_public_infrastructure_condition_reports;
create policy hc_public_infra_reports_authenticated_insert
on public.hc_public_infrastructure_condition_reports
for insert
to authenticated
with check (reporter_user_id = auth.uid() and report_status = 'pending');

drop policy if exists hc_public_infra_reports_owner_pending_read on public.hc_public_infrastructure_condition_reports;
create policy hc_public_infra_reports_owner_pending_read
on public.hc_public_infrastructure_condition_reports
for select
to authenticated
using (reporter_user_id = auth.uid());

create index if not exists idx_hc_public_infra_reports_entity_status
on public.hc_public_infrastructure_condition_reports (entity_id, report_status, observed_at desc);

create index if not exists idx_hc_public_infra_reports_review_queue
on public.hc_public_infrastructure_condition_reports (report_status, created_at desc)
where report_status = 'pending';

grant select on public.hc_public_infrastructure_condition_reports to anon, authenticated;
grant insert on public.hc_public_infrastructure_condition_reports to authenticated;

create or replace view public.v_hc_public_infrastructure_readiness
with (security_invoker = true) as
with approved_reports as (
  select *
  from public.hc_public_infrastructure_condition_reports
  where report_status = 'approved'
),
rollup as (
  select
    entity_id,
    count(*)::integer as approved_report_count,
    max(observed_at) as last_observed_at,
    round(avg(safety_rating)::numeric, 1) as safety_rating,
    round(avg(cleanliness_rating)::numeric, 1) as cleanliness_rating,
    round(avg(lighting_rating)::numeric, 1) as lighting_rating,
    (array_agg(open_status order by observed_at desc) filter (where open_status is not null))[1] as latest_open_status,
    bool_or(wifi_available is true) as wifi_available,
    bool_or(restrooms_available is true) as restrooms_available,
    bool_or(overnight_allowed is true) as overnight_allowed,
    (array_agg(security_presence order by observed_at desc) filter (where security_presence is not null))[1] as latest_security_presence,
    (array_agg(oversized_access_notes order by observed_at desc) filter (where oversized_access_notes is not null and length(trim(oversized_access_notes)) > 0))[1] as latest_oversized_access_notes,
    (array_agg(hazard_notes order by observed_at desc) filter (where hazard_notes is not null and length(trim(hazard_notes)) > 0))[1] as latest_hazard_notes,
    (array_agg(amenity_notes order by observed_at desc) filter (where amenity_notes is not null and length(trim(amenity_notes)) > 0))[1] as latest_amenity_notes
  from approved_reports
  group by entity_id
)
select
  e.id as entity_id,
  e.hc_id,
  e.entity_subtype,
  e.entity_family,
  e.name,
  e.display_name,
  e.city,
  e.admin1_code,
  e.country_code,
  e.claim_status,
  e.is_claimable,
  coalesce(r.approved_report_count, 0) as approved_report_count,
  r.last_observed_at,
  r.safety_rating,
  r.cleanliness_rating,
  r.lighting_rating,
  coalesce(r.latest_open_status, 'unknown') as open_status,
  coalesce(r.wifi_available, false) as wifi_available,
  coalesce(r.restrooms_available, false) as restrooms_available,
  coalesce(r.overnight_allowed, false) as overnight_allowed,
  coalesce(r.latest_security_presence, 'unknown') as security_presence,
  r.latest_oversized_access_notes,
  r.latest_hazard_notes,
  r.latest_amenity_notes,
  case
    when coalesce(r.approved_report_count, 0) = 0 then 'needs_field_report'
    when coalesce(r.safety_rating, 0) < 3 or coalesce(r.lighting_rating, 0) < 3 then 'use_caution'
    when r.latest_open_status = 'closed' then 'avoid_until_reopened'
    else 'route_support_ready'
  end as readiness_state,
  '/claim?entity='::text || e.id::text || '&intent=steward-condition-update' as steward_claim_route
from public.v_hc_directory_active e
left join rollup r on r.entity_id = e.id
where e.entity_family = 'infrastructure'
   or e.entity_subtype = any (array['rest_area','weigh_station','truck_parking','port','rail_intermodal','border_crossing','tunnel','tunnel_authority']);

grant select on public.v_hc_public_infrastructure_readiness to anon, authenticated;

insert into public.hc_policy (key, description, value_type, default_value, updated_at)
values
  (
    'directory.public_infrastructure.condition_reports_required',
    'Public route-support assets should support open/closed status, safety, cleanliness, lighting, security, Wi-Fi, restroom, overnight, oversized-access, hazard, and amenity facts.',
    'bool',
    'true'::jsonb,
    now()
  ),
  (
    'directory.public_infrastructure.condition_report_moderation',
    'Community field reports start pending; only approved reports are public. Steward and official reports can be prioritized for manual review.',
    'text',
    '"pending_then_approved_public"'::jsonb,
    now()
  ),
  (
    'fmcsa.webkey.required_owner_action',
    'FMCSA QC webkey registration requires the Haul Command owner/account identity. The repo can hold the env contract, but the key must be registered by the owner and stored as a secret.',
    'bool',
    'true'::jsonb,
    now()
  )
on conflict (key) do update
set description = excluded.description,
    value_type = excluded.value_type,
    default_value = excluded.default_value,
    updated_at = now();
