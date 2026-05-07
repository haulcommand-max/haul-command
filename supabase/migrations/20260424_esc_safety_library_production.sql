-- ESC absorption production layer.
-- Rebuilds the archived broken ESC safety-library seed into current Haul Command schemas.
-- Source basis: docs/intelligence/esc_org_extraction.md, extracted 2026-02-13.
-- Additive and upgrade-only: no archived migration is reused as a source of truth.

begin;

create table if not exists public.pevo_certification_rules (
  id uuid primary key default gen_random_uuid(),
  cert_type text,
  state_code text,
  requirements jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  state_name text,
  min_hours integer,
  is_active boolean default true,
  additional_notes text
);

create table if not exists public.pevo_equipment_requirements (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  item_name text not null,
  description text,
  required boolean default true,
  role_keys text[] default array['pilot_car_operator'],
  monetization_surface text,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pevo_insurance_providers (
  id uuid primary key default gen_random_uuid(),
  provider_name text not null,
  city text,
  state_code text,
  website text,
  offers_cert_discount boolean default false,
  policy_types text[] default '{}',
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_training_country_overlays (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  region_code text,
  authority_type text,
  authority_name text,
  local_terminology jsonb default '{}'::jsonb,
  requirements jsonb default '{}'::jsonb,
  notes jsonb default '{}'::jsonb,
  version int default 1,
  last_verified_at timestamptz default now()
);

create table if not exists public.hc_requirements_public (
  surface_key text primary key,
  country_slug text not null,
  jurisdiction_slug text,
  load_type_slug text,
  jurisdiction_label text not null,
  escort_thresholds_json jsonb,
  permit_links_json jsonb,
  governing_source_links_json jsonb,
  methodology_url text,
  last_reviewed_at timestamptz,
  quality_guardrail_pass boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_country_certifications (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  jurisdiction_code text,
  certification_name text not null,
  certification_code text not null,
  is_mandatory boolean default false,
  issuing_body text,
  issuing_body_url text,
  validity_months integer,
  renewal_process text,
  training_available_online boolean default false,
  estimated_cost_local numeric,
  estimated_cost_currency text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(country_code, jurisdiction_code, certification_code)
);

alter table public.pevo_certification_rules
  add column if not exists accepts_wa_cert boolean,
  add column if not exists wa_accepts_theirs boolean,
  add column if not exists source_url text,
  add column if not exists last_verified_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.pevo_equipment_requirements
  add column if not exists role_keys text[] default array['pilot_car_operator'],
  add column if not exists monetization_surface text,
  add column if not exists source_url text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.pevo_insurance_providers
  add column if not exists updated_at timestamptz not null default now();

create index if not exists pevo_cert_rules_state_idx on public.pevo_certification_rules (state_code);
create index if not exists pevo_cert_rules_cert_idx on public.pevo_certification_rules (cert_type);
create unique index if not exists pevo_equipment_requirements_item_unique
  on public.pevo_equipment_requirements (category, item_name);
create unique index if not exists pevo_insurance_provider_name_unique
  on public.pevo_insurance_providers (provider_name);
create index if not exists hc_training_country_overlay_country_idx
  on public.hc_training_country_overlays (country_code, region_code);
create index if not exists hc_requirements_public_country_idx
  on public.hc_requirements_public (country_slug, jurisdiction_slug);

with pevo_rules as (
  select *
  from (values
    ('pevo_wa','WA','Washington',8,true,true,true,'Washington State PEVO certification; 3-year validity cycle; WAC 468-38-100 aligned.', 'https://www.esc.org/program/pilot-car'),
    ('pevo_wa','AZ','Arizona',16,true,true,true,'Arizona requires pilot car certification; WA PEVO reciprocity is tracked as accepted in the ESC extraction.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','CO','Colorado',8,true,true,true,'Colorado certification/reciprocity market; mountain corridor and high-pole operations should be verified by current permit authority.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','FL','Florida',8,true,true,false,'Florida has state-specific pilot/escort certification requirements and defensive-driving expectations; treat WA acceptance as conditional.', 'https://techtransfer.ce.ufl.edu/training/pilot-escort-flagging/'),
    ('pevo_wa','GA','Georgia',8,true,true,false,'Georgia is tracked as a WA PEVO acceptance market; confirm permit-specific escort card instructions before dispatch.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','ID','Idaho',8,true,false,true,'Pacific Northwest adjacent market; verify reciprocity and route permit conditions before move assignment.', 'https://www.esc.org/safety-library'),
    ('pevo_wa','KS','Kansas',8,true,true,true,'Kansas reciprocity tracked for WA PEVO in ESC extraction; wind and superload corridors should check current permit text.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','MN','Minnesota',8,true,true,true,'Minnesota reciprocity tracked for WA PEVO; WITPAC relevance for wind transport should be surfaced.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','NC','North Carolina',8,true,true,false,'North Carolina tracked as accepting WA PEVO with state-specific conditions; verify current NCDOT requirements.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','OK','Oklahoma',8,true,true,true,'Oklahoma reciprocity tracked for WA PEVO; wind and oilfield corridors should surface WITPAC and high-pole readiness.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','OR','Oregon',8,true,false,true,'Pacific Northwest adjacent market; reciprocity and route-specific certification treatment must be verified before dispatch.', 'https://www.esc.org/safety-library'),
    ('pevo_wa','PA','Pennsylvania',8,true,true,false,'Pennsylvania tracked as accepting WA PEVO with special requirements; defensive-driving proof may be relevant.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','TX','Texas',8,true,true,true,'Texas reciprocity tracked for WA PEVO; high-demand wind, oilfield, and I-10/I-35 corridors should surface WITPAC-qualified operators.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','UT','Utah',8,true,true,true,'Utah reciprocity tracked for WA PEVO; high-pole and mountain corridor modules should be recommended.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','VA','Virginia',8,true,true,false,'Virginia tracked as accepting WA PEVO with state-specific conditions; verify current permit terms.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_ny','NY','New York',8,true,false,false,'New York maintains separate pilot car certification expectations; do not assume WA PEVO reciprocity.', 'https://www.ny.gov/')
  ) as t(cert_type, state_code, state_name, min_hours, requires_certification, accepts_wa_cert, wa_accepts_theirs, notes, source_url)
)
update public.pevo_certification_rules target
set
  cert_type = pevo_rules.cert_type,
  state_name = pevo_rules.state_name,
  min_hours = pevo_rules.min_hours,
  is_active = true,
  accepts_wa_cert = pevo_rules.accepts_wa_cert,
  wa_accepts_theirs = pevo_rules.wa_accepts_theirs,
  requirements = jsonb_build_object(
    'requires_certification', pevo_rules.requires_certification,
    'validity_years', 3,
    'minimum_age', 18,
    'valid_driver_license_required', true,
    'source_confidence', 'extracted_2026_02_13_verify_before_enforcement',
    'roles', jsonb_build_array('pilot_car_operator','height_pole_operator','escort_vehicle_operator')
  ),
  additional_notes = pevo_rules.notes,
  source_url = pevo_rules.source_url,
  last_verified_at = now(),
  updated_at = now()
from pevo_rules
where target.state_code = pevo_rules.state_code;

with pevo_rules as (
  select *
  from (values
    ('pevo_wa','WA','Washington',8,true,true,true,'Washington State PEVO certification; 3-year validity cycle; WAC 468-38-100 aligned.', 'https://www.esc.org/program/pilot-car'),
    ('pevo_wa','AZ','Arizona',16,true,true,true,'Arizona requires pilot car certification; WA PEVO reciprocity is tracked as accepted in the ESC extraction.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','CO','Colorado',8,true,true,true,'Colorado certification/reciprocity market; mountain corridor and high-pole operations should be verified by current permit authority.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','FL','Florida',8,true,true,false,'Florida has state-specific pilot/escort certification requirements and defensive-driving expectations; treat WA acceptance as conditional.', 'https://techtransfer.ce.ufl.edu/training/pilot-escort-flagging/'),
    ('pevo_wa','GA','Georgia',8,true,true,false,'Georgia is tracked as a WA PEVO acceptance market; confirm permit-specific escort card instructions before dispatch.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','ID','Idaho',8,true,false,true,'Pacific Northwest adjacent market; verify reciprocity and route permit conditions before move assignment.', 'https://www.esc.org/safety-library'),
    ('pevo_wa','KS','Kansas',8,true,true,true,'Kansas reciprocity tracked for WA PEVO in ESC extraction; wind and superload corridors should check current permit text.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','MN','Minnesota',8,true,true,true,'Minnesota reciprocity tracked for WA PEVO; WITPAC relevance for wind transport should be surfaced.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','NC','North Carolina',8,true,true,false,'North Carolina tracked as accepting WA PEVO with state-specific conditions; verify current NCDOT requirements.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','OK','Oklahoma',8,true,true,true,'Oklahoma reciprocity tracked for WA PEVO; wind and oilfield corridors should surface WITPAC and high-pole readiness.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','OR','Oregon',8,true,false,true,'Pacific Northwest adjacent market; reciprocity and route-specific certification treatment must be verified before dispatch.', 'https://www.esc.org/safety-library'),
    ('pevo_wa','PA','Pennsylvania',8,true,true,false,'Pennsylvania tracked as accepting WA PEVO with special requirements; defensive-driving proof may be relevant.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','TX','Texas',8,true,true,true,'Texas reciprocity tracked for WA PEVO; high-demand wind, oilfield, and I-10/I-35 corridors should surface WITPAC-qualified operators.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','UT','Utah',8,true,true,true,'Utah reciprocity tracked for WA PEVO; high-pole and mountain corridor modules should be recommended.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_wa','VA','Virginia',8,true,true,false,'Virginia tracked as accepting WA PEVO with state-specific conditions; verify current permit terms.', 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
    ('pevo_ny','NY','New York',8,true,false,false,'New York maintains separate pilot car certification expectations; do not assume WA PEVO reciprocity.', 'https://www.ny.gov/')
  ) as t(cert_type, state_code, state_name, min_hours, requires_certification, accepts_wa_cert, wa_accepts_theirs, notes, source_url)
)
insert into public.pevo_certification_rules (
  cert_type,
  state_code,
  state_name,
  min_hours,
  is_active,
  accepts_wa_cert,
  wa_accepts_theirs,
  requirements,
  additional_notes,
  source_url,
  last_verified_at
)
select
  cert_type,
  state_code,
  state_name,
  min_hours,
  true,
  accepts_wa_cert,
  wa_accepts_theirs,
  jsonb_build_object(
    'requires_certification', requires_certification,
    'validity_years', 3,
    'minimum_age', 18,
    'valid_driver_license_required', true,
    'source_confidence', 'extracted_2026_02_13_verify_before_enforcement',
    'roles', jsonb_build_array('pilot_car_operator','height_pole_operator','escort_vehicle_operator')
  ),
  notes,
  source_url,
  now()
from pevo_rules
where not exists (
  select 1
  from public.pevo_certification_rules existing
  where existing.state_code = pevo_rules.state_code
);

insert into public.cert_reciprocity_rules (
  cert_type, issuing_region, valid_region, validity_type, conditions_json, priority_weight, source_url, last_verified_at
)
values
  ('pevo_wa','WA','WA','full','{"proof_required":"valid WA PEVO card","validity_years":3}'::jsonb,100,'https://www.esc.org/program/pilot-car',now()),
  ('pevo_wa','WA','AZ','full','{"proof_required":"valid WA PEVO card","verify_current_permit_text":true}'::jsonb,90,'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification',now()),
  ('pevo_wa','WA','CO','full','{"proof_required":"valid WA PEVO card","verify_current_permit_text":true}'::jsonb,90,'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification',now()),
  ('pevo_wa','WA','FL','conditional','{"proof_required":"valid WA PEVO card","state_specific_requirements":"defensive driving and current FDOT/UF T2 conditions may apply"}'::jsonb,80,'https://techtransfer.ce.ufl.edu/training/pilot-escort-flagging/',now()),
  ('pevo_wa','WA','GA','full','{"proof_required":"valid WA PEVO card","verify_current_permit_text":true}'::jsonb,90,'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification',now()),
  ('pevo_wa','WA','KS','full','{"proof_required":"valid WA PEVO card","verify_current_permit_text":true}'::jsonb,90,'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification',now()),
  ('pevo_wa','WA','MN','full','{"proof_required":"valid WA PEVO card","verify_current_permit_text":true}'::jsonb,90,'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification',now()),
  ('pevo_wa','WA','NC','conditional','{"proof_required":"valid WA PEVO card","verify_current_permit_text":true}'::jsonb,80,'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification',now()),
  ('pevo_wa','WA','OK','full','{"proof_required":"valid WA PEVO card","verify_current_permit_text":true}'::jsonb,90,'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification',now()),
  ('pevo_wa','WA','PA','conditional','{"proof_required":"valid WA PEVO card","verify_current_permit_text":true}'::jsonb,80,'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification',now()),
  ('pevo_wa','WA','TX','full','{"proof_required":"valid WA PEVO card","verify_current_permit_text":true}'::jsonb,90,'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification',now()),
  ('pevo_wa','WA','UT','full','{"proof_required":"valid WA PEVO card","verify_current_permit_text":true}'::jsonb,90,'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification',now()),
  ('pevo_wa','WA','VA','conditional','{"proof_required":"valid WA PEVO card","verify_current_permit_text":true}'::jsonb,80,'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification',now()),
  ('witpac','WA','TX','conditional','{"proof_required":"WITPAC plus valid PEVO/CDL prerequisite","market_use":"wind transport"}'::jsonb,85,'https://www.esc.org/program/pilot-car/pre-class-information/witpac',now()),
  ('witpac','WA','OK','conditional','{"proof_required":"WITPAC plus valid PEVO/CDL prerequisite","market_use":"wind transport"}'::jsonb,85,'https://www.esc.org/program/pilot-car/pre-class-information/witpac',now()),
  ('witpac','WA','MN','conditional','{"proof_required":"WITPAC plus valid PEVO/CDL prerequisite","market_use":"wind transport"}'::jsonb,85,'https://www.esc.org/program/pilot-car/pre-class-information/witpac',now()),
  ('witpac','WA','IA','conditional','{"proof_required":"WITPAC plus valid PEVO/CDL prerequisite","market_use":"wind transport"}'::jsonb,80,'https://www.esc.org/program/pilot-car/pre-class-information/witpac',now())
on conflict (cert_type, issuing_region, valid_region) do update set
  validity_type = excluded.validity_type,
  conditions_json = excluded.conditions_json,
  priority_weight = excluded.priority_weight,
  source_url = excluded.source_url,
  last_verified_at = excluded.last_verified_at;

insert into public.pevo_equipment_requirements (
  category, item_name, description, required, role_keys, monetization_surface, source_url
)
values
  ('vehicle','Oversize Load Sign','Roof-mounted or otherwise visible OVERSIZE LOAD signage appropriate to the jurisdiction and movement.',true,array['pilot_car_operator','escort_vehicle_operator'],'routeready_signage_bundle','https://www.esc.org/safety-library'),
  ('vehicle','Amber Warning Light','360-degree amber warning light or light bar visible at required distance under current state/province rules.',true,array['pilot_car_operator','escort_vehicle_operator'],'routeready_light_bar_bundle','https://www.esc.org/safety-library'),
  ('vehicle','High Pole','Non-conductive adjustable high pole with mounting hardware, striker tips, and visibility to the operator.',true,array['height_pole_operator','pilot_car_operator'],'high_pole_bundle','https://www.esc.org/safety-library'),
  ('vehicle','CB Radio / Two-Way Communications','Installed CB or approved two-way communication system for convoy coordination and pre-trip briefings.',true,array['pilot_car_operator','height_pole_operator','route_surveyor'],'communications_bundle','https://www.esc.org/safety-library'),
  ('ppe','ANSI High-Visibility Vest or Jacket','Class 2 or Class 3 high-visibility upper garment for roadside/flagging exposure.',true,array['pilot_car_operator','flagger','route_surveyor'],'ppe_bundle','https://www.esc.org/safety-library'),
  ('ppe','Hard Hat with Retroreflective Marking','High-visibility hard hat for jobsite and roadside exposure, especially night operations.',true,array['pilot_car_operator','flagger','route_surveyor'],'ppe_bundle','https://www.esc.org/safety-library'),
  ('signaling','STOP/SLOW Paddle','Retroreflective STOP/SLOW paddle sized for current jurisdiction and night operation requirements.',true,array['pilot_car_operator','flagger'],'traffic_control_bundle','https://www.esc.org/safety-library'),
  ('signaling','Emergency Reflective Triangles','Minimum emergency warning triangle set for roadside breakdown and convoy staging situations.',true,array['pilot_car_operator','escort_vehicle_operator'],'safety_bundle','https://www.esc.org/safety-library'),
  ('signaling','Traffic Cones','Retroreflective traffic cones for staging, breakdown, and hazard control.',true,array['pilot_car_operator','flagger','route_surveyor'],'traffic_control_bundle','https://www.esc.org/safety-library'),
  ('other','Pre-Trip Safety Briefing Checklist','Documented route, role, radio, emergency, and permit-condition briefing before movement.',true,array['pilot_car_operator','broker','carrier','dispatcher'],'training_to_assignment_os','https://www.esc.org/safety-library')
on conflict (category, item_name) do update set
  description = excluded.description,
  required = excluded.required,
  role_keys = excluded.role_keys,
  monetization_surface = excluded.monetization_surface,
  source_url = excluded.source_url,
  updated_at = now();

insert into public.pevo_insurance_providers (
  provider_name, city, state_code, website, offers_cert_discount, policy_types, source_url
)
values
  ('Charles James Cayias Insurance, Inc.','Salt Lake City','UT','https://www.cayias.com/',true,array['commercial_auto','general_liability','errors_omissions'],'https://www.esc.org/safety-library'),
  ('V.R. Williams & Company','Winchester','TN','https://vrwilliams.com/',true,array['commercial_auto','general_liability','errors_omissions'],'https://www.esc.org/safety-library'),
  ('Risk Managers Insurance',null,'UT','https://www.riskmanagersinc.com/',false,array['occupational_accident','workers_compensation'],'https://www.esc.org/safety-library')
on conflict (provider_name) do update set
  city = excluded.city,
  state_code = excluded.state_code,
  website = excluded.website,
  offers_cert_discount = excluded.offers_cert_discount,
  policy_types = excluded.policy_types,
  source_url = excluded.source_url,
  updated_at = now();

insert into public.hc_training_courses (
  slug, title, description, tier, price_cents, currency, duration_hours, modules_count, delivery_method,
  country_codes, location_country, accreditation_body, regulatory_citation, hc_trust_score_boost,
  certification_level, renewal_years, prerequisites, tags, is_active, is_featured, sort_order
)
values
  ('witpac-wind-transport-certification','WITPAC Wind Transport Certification Intelligence Track','Wind Industry Transport Professional Advanced Certification pathway, reciprocity logic, wind-blade escort readiness, and Haul Command operator matching tags.', 'tier3_specialist', 32500, 'USD', 8, 6, 'hybrid', array['US','CA'], 'US', 'Evergreen Safety Council / Haul Command verification overlay', 'WITPAC source extraction 2026-02-13', 60, 'WITPAC', 3, array['Valid PEVO certification or CDL-equivalent prerequisite where applicable'], array['witpac','wind','renewable-energy','certification','reciprocity'], true, true, 58),
  ('private-team-training','Private Team Training for Heavy Haul Support Crews','Company, fleet, utility, wind, and agency training intake for teams that need pilot car, flagging, high-pole, and route-support readiness.', 'enterprise', 220000, 'USD', 8, 8, 'hybrid', array['US','CA','AU','GB'], 'US', 'Haul Command Training OS', 'Private training intake modeled from ESC competitive extraction', 35, 'Team Training', 3, array['Company or agency cohort'], array['enterprise','team-training','fleet','agency','utility'], true, false, 82),
  ('pilot-car-recertification','Pilot Car Recertification and Renewal Tracker','Renewal preparation, expiration monitoring, reciprocity checks, equipment refresh, and HC-ID profile trust updates for certified escort operators.', 'tier2_us', 16500, 'USD', 4, 4, 'live_online', array['US'], 'US', 'Haul Command Training OS', '3-year renewal cycle intelligence from ESC extraction', 20, 'PEVO-Renewal', 3, array['Prior PEVO or equivalent certification'], array['pevo','recertification','renewal','expiration'], true, false, 83)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  tier = excluded.tier,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  duration_hours = excluded.duration_hours,
  modules_count = excluded.modules_count,
  delivery_method = excluded.delivery_method,
  country_codes = excluded.country_codes,
  location_country = excluded.location_country,
  accreditation_body = excluded.accreditation_body,
  regulatory_citation = excluded.regulatory_citation,
  hc_trust_score_boost = excluded.hc_trust_score_boost,
  certification_level = excluded.certification_level,
  renewal_years = excluded.renewal_years,
  prerequisites = excluded.prerequisites,
  tags = excluded.tags,
  is_active = excluded.is_active,
  is_featured = excluded.is_featured,
  sort_order = excluded.sort_order,
  updated_at = now();

update public.hc_training_courses
set
  accreditation_body = coalesce(accreditation_body, 'Evergreen Safety Council / Haul Command verification overlay'),
  regulatory_citation = coalesce(regulatory_citation, 'WAC 468-38-100; MUTCD Part 6; FHWA state regulation references'),
  prerequisites = coalesce(prerequisites, array['Valid driver license','Camera/microphone for live online class','Full attendance']),
  tags = array(select distinct unnest(coalesce(tags,'{}'::text[]) || array['esc-absorption','pevo','reciprocity'])),
  updated_at = now()
where slug in ('wa-pevo-certification','wa-pevo-recertification');

insert into public.hc_country_certifications (
  country_code, jurisdiction_code, certification_name, certification_code, is_mandatory,
  issuing_body, issuing_body_url, validity_months, renewal_process,
  training_available_online, estimated_cost_local, estimated_cost_currency, notes, is_active
)
values
  ('US','WA','Washington State Pilot/Escort Vehicle Operator Certification','pevo_wa',true,'Evergreen Safety Council','https://www.esc.org/program/pilot-car',36,'Renew before expiration; Haul Command should monitor expiration and reciprocity status.',true,265,'USD','Certification feeds HC-ID trust score, reciprocity checker, and marketplace routing.',true),
  ('US','WA','WITPAC Wind Transport Professional Advanced Certification','witpac',false,'Evergreen Safety Council','https://www.esc.org/program/pilot-car/pre-class-information/witpac',36,'Renew according to issuing-body cycle; verify prerequisite PEVO/CDL status.',true,325,'USD','Specialist credential for wind transport, renewable-energy corridors, and WITPAC-qualified operator routing.',true),
  ('US','FL','Florida Pilot/Escort Certification','pevo_fl',true,'Florida Technology Transfer Center','https://techtransfer.ce.ufl.edu/training/pilot-escort-flagging/',36,'Follow FDOT/UF T2 renewal requirements and defensive-driving proof where applicable.',true,265,'USD','State-specific certification should not be replaced by WA reciprocity without current authority review.',true),
  ('US','NY','New York Certified Escort Requirement','pevo_ny',true,'New York permitting authority','https://www.ny.gov/',36,'Verify current state certification and permit conditions before dispatch.',false,null,'USD','Separate certification expectation; do not assume WA reciprocity.',true)
on conflict (country_code, jurisdiction_code, certification_code) do update set
  certification_name = excluded.certification_name,
  is_mandatory = excluded.is_mandatory,
  issuing_body = excluded.issuing_body,
  issuing_body_url = excluded.issuing_body_url,
  validity_months = excluded.validity_months,
  renewal_process = excluded.renewal_process,
  training_available_online = excluded.training_available_online,
  estimated_cost_local = excluded.estimated_cost_local,
  estimated_cost_currency = excluded.estimated_cost_currency,
  notes = excluded.notes,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.hc_requirements_public (
  surface_key,
  country_slug,
  jurisdiction_slug,
  load_type_slug,
  jurisdiction_label,
  escort_thresholds_json,
  permit_links_json,
  governing_source_links_json,
  methodology_url,
  last_reviewed_at,
  quality_guardrail_pass
)
values
  ('us-wa-pevo-certification','united-states','washington','pilot-car-certification','Washington Pilot/Escort Vehicle Operator Certification',
   '{"certification_required":true,"minimum_training_hours":8,"validity_years":3,"roles":["pilot_car_operator","height_pole_operator"],"status_label":"live_requirement"}'::jsonb,
   '[{"label":"Washington State PEVO course","url":"https://www.esc.org/program/pilot-car"},{"label":"Haul Command certification verification","url":"/tools/pevo-certification-lookup"}]'::jsonb,
   '[{"label":"WAC 468-38-100","url":"https://app.leg.wa.gov/wac/default.aspx?cite=468-38-100"},{"label":"MUTCD Part 6","url":"https://mutcd.fhwa.dot.gov/"}]'::jsonb,
   '/resources/pilot-car-safety-library', now(), true),
  ('us-wa-witpac','united-states','washington','wind-transport','WITPAC Wind Transport Certification',
   '{"certification_required":false,"specialist_recommended":true,"validity_years":3,"roles":["pilot_car_operator","height_pole_operator","wind_transport_support"],"status_label":"specialist_track"}'::jsonb,
   '[{"label":"WITPAC student resources","url":"https://www.esc.org/program/pilot-car/pre-class-information/witpac"},{"label":"Find WITPAC-qualified operators","url":"/directory?country=US&category=pilot-car&credential=witpac"}]'::jsonb,
   '[{"label":"ESC WITPAC source","url":"https://www.esc.org/program/pilot-car/pre-class-information/witpac"}]'::jsonb,
   '/training/witpac', now(), true),
  ('us-pevo-reciprocity','united-states',null,'certification-reciprocity','Pilot Car Certification Reciprocity',
   '{"certification_required":"varies_by_state","wa_pevo_acceptance_tracked":true,"roles":["pilot_car_operator","broker","dispatcher"],"status_label":"verified_graph_seed"}'::jsonb,
   '[{"label":"Reciprocity checker","url":"/tools/certification-reciprocity-checker"},{"label":"State certification guide","url":"/resources/certification/state-pilot-car-certifications"}]'::jsonb,
   '[{"label":"ESC reciprocity extraction","url":"https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification"}]'::jsonb,
   '/tools/certification-reciprocity-checker', now(), true),
  ('global-pilot-car-equipment','global',null,'pilot-car-equipment','Pilot Car Equipment Checklist',
   '{"equipment_required":true,"items":["oversize_load_sign","amber_warning_light","high_pole_when_required","cb_radio","hi_vis_ppe","stop_slow_paddle","triangles","cones"],"status_label":"global_baseline_overlay"}'::jsonb,
   '[{"label":"Equipment checker","url":"/tools/pilot-car-equipment-checker"},{"label":"RouteReady gear bundles","url":"/routeready"}]'::jsonb,
   '[{"label":"MUTCD Part 6","url":"https://mutcd.fhwa.dot.gov/"},{"label":"ESC safety library extraction","url":"https://www.esc.org/safety-library"}]'::jsonb,
   '/resources/pilot-car-equipment-checklist', now(), true)
on conflict (surface_key) do update set
  country_slug = excluded.country_slug,
  jurisdiction_slug = excluded.jurisdiction_slug,
  load_type_slug = excluded.load_type_slug,
  jurisdiction_label = excluded.jurisdiction_label,
  escort_thresholds_json = excluded.escort_thresholds_json,
  permit_links_json = excluded.permit_links_json,
  governing_source_links_json = excluded.governing_source_links_json,
  methodology_url = excluded.methodology_url,
  last_reviewed_at = excluded.last_reviewed_at,
  quality_guardrail_pass = excluded.quality_guardrail_pass,
  updated_at = now();

with overlays as (
  select *
  from (values
    ('US','WA','state_dot','Washington State / ESC PEVO authority','{"pilot_car_terms":["PEVO","pilot/escort vehicle operator"],"high_pole_terms":["high pole","height pole"],"wind_terms":["WITPAC","wind transport professional"]}'::jsonb,'{"pevo_required":true,"pevo_training_hours":8,"validity_years":3,"witpac_specialist":true,"equipment_checklist_url":"/resources/pilot-car-equipment-checklist","verification_url":"/tools/pevo-certification-lookup"}'::jsonb,'{"source_confidence":"extracted_2026_02_13_verify_before_enforcement","source":"docs/intelligence/esc_org_extraction.md"}'::jsonb),
    ('US','TX','state_dot','Texas oversize/overweight permit authority','{"pilot_car_terms":["pilot car","escort vehicle"],"wind_terms":["WITPAC","wind blade escort"]}'::jsonb,'{"pevo_reciprocity":"WA PEVO tracked as accepted in seed graph","witpac_specialist":true,"market_routing":["wind","oilfield","I-10","I-35"],"verification_url":"/tools/certification-reciprocity-checker"}'::jsonb,'{"status":"live_market_overlay","source_confidence":"seeded_from_esc_extraction"}'::jsonb),
    ('US','OK','state_dot','Oklahoma oversize/overweight permit authority','{"pilot_car_terms":["pilot car","escort vehicle"],"wind_terms":["WITPAC","wind corridor"]}'::jsonb,'{"pevo_reciprocity":"WA PEVO tracked as accepted in seed graph","witpac_specialist":true,"market_routing":["wind","oilfield"],"verification_url":"/tools/certification-reciprocity-checker"}'::jsonb,'{"status":"live_market_overlay","source_confidence":"seeded_from_esc_extraction"}'::jsonb),
    ('US','MN','state_dot','Minnesota oversize/overweight permit authority','{"pilot_car_terms":["pilot car","escort vehicle"],"wind_terms":["WITPAC","wind corridor"]}'::jsonb,'{"pevo_reciprocity":"WA PEVO tracked as accepted in seed graph","witpac_specialist":true,"market_routing":["wind","upper_midwest"],"verification_url":"/tools/certification-reciprocity-checker"}'::jsonb,'{"status":"live_market_overlay","source_confidence":"seeded_from_esc_extraction"}'::jsonb),
    ('CA',null,'national_transport','Canadian provincial pilot car framework','{"pilot_car_terms":["pilot car","escort vehicle"],"license_terms":["Class 1","Class A equivalent"]}'::jsonb,'{"country_status":"coverage_model","witpac_prerequisite_note":"WITPAC extraction references Canadian CDL equivalency; verify province-specific requirements before dispatch.","verification_url":"/tools/certification-reciprocity-checker"}'::jsonb,'{"status":"coverage_model","source_confidence":"requires_country_overlay_expansion"}'::jsonb)
  ) as t(country_code, region_code, authority_type, authority_name, local_terminology, requirements, notes)
)
update public.hc_training_country_overlays target
set
  authority_type = overlays.authority_type,
  authority_name = overlays.authority_name,
  local_terminology = overlays.local_terminology,
  requirements = overlays.requirements,
  notes = overlays.notes,
  version = greatest(coalesce(target.version, 1), 2),
  last_verified_at = now()
from overlays
where target.country_code = overlays.country_code
  and coalesce(target.region_code,'') = coalesce(overlays.region_code,'');

with overlays as (
  select *
  from (values
    ('US','WA','state_dot','Washington State / ESC PEVO authority','{"pilot_car_terms":["PEVO","pilot/escort vehicle operator"],"high_pole_terms":["high pole","height pole"],"wind_terms":["WITPAC","wind transport professional"]}'::jsonb,'{"pevo_required":true,"pevo_training_hours":8,"validity_years":3,"witpac_specialist":true,"equipment_checklist_url":"/resources/pilot-car-equipment-checklist","verification_url":"/tools/pevo-certification-lookup"}'::jsonb,'{"source_confidence":"extracted_2026_02_13_verify_before_enforcement","source":"docs/intelligence/esc_org_extraction.md"}'::jsonb),
    ('US','TX','state_dot','Texas oversize/overweight permit authority','{"pilot_car_terms":["pilot car","escort vehicle"],"wind_terms":["WITPAC","wind blade escort"]}'::jsonb,'{"pevo_reciprocity":"WA PEVO tracked as accepted in seed graph","witpac_specialist":true,"market_routing":["wind","oilfield","I-10","I-35"],"verification_url":"/tools/certification-reciprocity-checker"}'::jsonb,'{"status":"live_market_overlay","source_confidence":"seeded_from_esc_extraction"}'::jsonb),
    ('US','OK','state_dot','Oklahoma oversize/overweight permit authority','{"pilot_car_terms":["pilot car","escort vehicle"],"wind_terms":["WITPAC","wind corridor"]}'::jsonb,'{"pevo_reciprocity":"WA PEVO tracked as accepted in seed graph","witpac_specialist":true,"market_routing":["wind","oilfield"],"verification_url":"/tools/certification-reciprocity-checker"}'::jsonb,'{"status":"live_market_overlay","source_confidence":"seeded_from_esc_extraction"}'::jsonb),
    ('US','MN','state_dot','Minnesota oversize/overweight permit authority','{"pilot_car_terms":["pilot car","escort vehicle"],"wind_terms":["WITPAC","wind corridor"]}'::jsonb,'{"pevo_reciprocity":"WA PEVO tracked as accepted in seed graph","witpac_specialist":true,"market_routing":["wind","upper_midwest"],"verification_url":"/tools/certification-reciprocity-checker"}'::jsonb,'{"status":"live_market_overlay","source_confidence":"seeded_from_esc_extraction"}'::jsonb),
    ('CA',null,'national_transport','Canadian provincial pilot car framework','{"pilot_car_terms":["pilot car","escort vehicle"],"license_terms":["Class 1","Class A equivalent"]}'::jsonb,'{"country_status":"coverage_model","witpac_prerequisite_note":"WITPAC extraction references Canadian CDL equivalency; verify province-specific requirements before dispatch.","verification_url":"/tools/certification-reciprocity-checker"}'::jsonb,'{"status":"coverage_model","source_confidence":"requires_country_overlay_expansion"}'::jsonb)
  ) as t(country_code, region_code, authority_type, authority_name, local_terminology, requirements, notes)
)
insert into public.hc_training_country_overlays (
  country_code, region_code, authority_type, authority_name, local_terminology, requirements, notes, version, last_verified_at
)
select country_code, region_code, authority_type, authority_name, local_terminology, requirements, notes, 2, now()
from overlays
where not exists (
  select 1
  from public.hc_training_country_overlays existing
  where existing.country_code = overlays.country_code
    and coalesce(existing.region_code,'') = coalesce(overlays.region_code,'')
);

insert into public.glossary_terms (term, definition, category, source_url)
values
  ('PEVO','Pilot/Escort Vehicle Operator. A trained operator who provides lead, chase, height-pole, traffic warning, or route-support services for oversize and overweight loads.','official','https://www.esc.org/safety-library'),
  ('WITPAC','Wind Industry Transport Professional Advanced Certification. A specialist credential pathway for operators supporting wind-industry heavy transport.','official','https://www.esc.org/program/pilot-car/pre-class-information/witpac'),
  ('Certification Reciprocity','The rule graph that determines whether a pilot car or escort vehicle certification issued in one jurisdiction is accepted in another.','regulation','https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification'),
  ('High Pole','A non-conductive measuring pole mounted to a pilot car or escort vehicle to test route clearance for tall oversize loads.','official','https://www.esc.org/safety-library'),
  ('Pre-Trip Safety Briefing','A required team review before movement covering permit conditions, route hazards, communication protocol, roles, and emergency response.','safety','https://www.esc.org/safety-library'),
  ('Bridge Strike','An incident where an oversize load contacts a bridge, sign, utility, or overhead structure; prevention depends on route survey, height-pole procedure, and disciplined communication.','safety','https://www.esc.org/safety-library')
on conflict do nothing;

create or replace view public.v_hc_esc_safety_library as
select
  'certification_rule'::text as content_type,
  state_code::text as market_code,
  coalesce(state_name, state_code)::text as title,
  additional_notes::text as summary,
  source_url,
  last_verified_at
from public.pevo_certification_rules
where coalesce(is_active, true)
union all
select
  'equipment_requirement',
  category,
  item_name,
  description,
  source_url,
  updated_at
from public.pevo_equipment_requirements
union all
select
  'public_requirement',
  coalesce(jurisdiction_slug, country_slug),
  jurisdiction_label,
  methodology_url,
  methodology_url,
  last_reviewed_at
from public.hc_requirements_public
where quality_guardrail_pass = true;

create or replace function public.hc_certification_reciprocity_check(
  p_cert_type text,
  p_issuing_region text,
  p_target_region text
)
returns table (
  cert_type text,
  issuing_region text,
  target_region text,
  validity_type text,
  conditions_json jsonb,
  source_url text,
  last_verified_at timestamptz
)
language sql
stable
as $$
  select
    r.cert_type,
    r.issuing_region,
    r.valid_region as target_region,
    r.validity_type,
    r.conditions_json,
    r.source_url,
    r.last_verified_at
  from public.cert_reciprocity_rules r
  where lower(r.cert_type) = lower(p_cert_type)
    and upper(r.issuing_region) = upper(p_issuing_region)
    and upper(r.valid_region) = upper(p_target_region)
  order by r.priority_weight desc, r.last_verified_at desc nulls last
  limit 1;
$$;

alter table public.pevo_certification_rules enable row level security;
alter table public.pevo_equipment_requirements enable row level security;
alter table public.pevo_insurance_providers enable row level security;
alter table public.hc_training_country_overlays enable row level security;
alter table public.hc_requirements_public enable row level security;

drop policy if exists "pevo_cert_public_read" on public.pevo_certification_rules;
create policy "pevo_cert_public_read"
on public.pevo_certification_rules for select using (true);

drop policy if exists "pevo_equipment_public_read" on public.pevo_equipment_requirements;
create policy "pevo_equipment_public_read"
on public.pevo_equipment_requirements for select using (true);

drop policy if exists "pevo_insurance_public_read" on public.pevo_insurance_providers;
create policy "pevo_insurance_public_read"
on public.pevo_insurance_providers for select using (true);

drop policy if exists "training_overlays_public_read" on public.hc_training_country_overlays;
create policy "training_overlays_public_read"
on public.hc_training_country_overlays for select using (true);

drop policy if exists "requirements_public_read" on public.hc_requirements_public;
create policy "requirements_public_read"
on public.hc_requirements_public for select using (quality_guardrail_pass = true);

drop policy if exists "sr_pevo_cert" on public.pevo_certification_rules;
create policy "sr_pevo_cert"
on public.pevo_certification_rules for all to service_role using (true) with check (true);

drop policy if exists "sr_pevo_equipment" on public.pevo_equipment_requirements;
create policy "sr_pevo_equipment"
on public.pevo_equipment_requirements for all to service_role using (true) with check (true);

drop policy if exists "sr_pevo_insurance" on public.pevo_insurance_providers;
create policy "sr_pevo_insurance"
on public.pevo_insurance_providers for all to service_role using (true) with check (true);

drop policy if exists "sr_training_overlays" on public.hc_training_country_overlays;
create policy "sr_training_overlays"
on public.hc_training_country_overlays for all to service_role using (true) with check (true);

drop policy if exists "sr_requirements_public" on public.hc_requirements_public;
create policy "sr_requirements_public"
on public.hc_requirements_public for all to service_role using (true) with check (true);

commit;
