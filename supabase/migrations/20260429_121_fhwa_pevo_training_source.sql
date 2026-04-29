-- Migration: 20260429_121_fhwa_pevo_training_source.sql
-- Adds FHWA HOP-16-050 as a U.S. federal PEVO training reference.
-- This is a U.S.-specific source layer, not a global rule authority.

begin;

create table if not exists public.hc_authority_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  agency_name text not null,
  publication_number text,
  publication_date date,
  country_code text not null,
  source_type text not null,
  url text not null,
  summary text,
  use_for jsonb default '[]'::jsonb,
  do_not_use_for jsonb default '[]'::jsonb,
  related_training_slugs jsonb default '[]'::jsonb,
  related_glossary_slugs jsonb default '[]'::jsonb,
  related_page_paths jsonb default '[]'::jsonb,
  trust_tier text default 'government' check (trust_tier in ('government','association','commercial','community','internal')),
  requires_local_overlay boolean default true,
  last_reviewed_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_hc_authority_sources_country on public.hc_authority_sources(country_code);
create index if not exists idx_hc_authority_sources_type on public.hc_authority_sources(source_type);
create index if not exists idx_hc_authority_sources_trust on public.hc_authority_sources(trust_tier);

alter table public.hc_authority_sources enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_authority_sources' and policyname = 'Public read authority sources') then
    create policy "Public read authority sources"
      on public.hc_authority_sources
      for select
      using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_authority_sources' and policyname = 'Service role full access authority sources') then
    create policy "Service role full access authority sources"
      on public.hc_authority_sources
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

insert into public.hc_authority_sources (
  slug,
  title,
  agency_name,
  publication_number,
  publication_date,
  country_code,
  source_type,
  url,
  summary,
  use_for,
  do_not_use_for,
  related_training_slugs,
  related_glossary_slugs,
  related_page_paths,
  trust_tier,
  requires_local_overlay,
  last_reviewed_at
) values (
  'fhwa-hop-16-050-pevo-training-manual',
  'Pilot/Escort Vehicle Operators Training Manual',
  'Federal Highway Administration Office of Operations',
  'FHWA HOP-16-050',
  '2017-02-01',
  'US',
  'federal_training_reference',
  'https://ops.fhwa.dot.gov/publications/fhwahop16050/index.htm',
  'U.S. FHWA PEVO training manual covering pilot/escort industry background, operator and vehicle requirements, route planning and route surveys, pre-trip activities, trip operations, traffic control, railroad crossings, emergency procedures, post-trip responsibilities, trip logs, and driver safety issues.',
  '["PEVO training structure","operator role definitions","certification and reciprocity education","escort vehicle equipment education","route planning","route surveys","pre-trip planning","permit and route review","trip operations","lead pilot/escort role education","rear pilot/escort role education","traffic control","railroad crossing safety","emergency procedures","post-trip reports","trip logs","driver safety modules"]'::jsonb,
  '["current state-by-state legal thresholds without verification","global pilot car rules","country-specific requirements outside the United States","legal advice","permit issuance authority"]'::jsonb,
  '["what-is-a-pilot-car","reading-your-first-permit","radio-etiquette-101","what-equipment-do-you-need","high-pole-what-is-it","route-survey-prep","oversize-documentation","warning-triangle-placement","roadside-emergency-visibility","how-to-read-fmcsa-exemption"]'::jsonb,
  '["pilot-car","pilot-escort-vehicle-operator","lead-car","chase-car","high-pole-car","route-survey","permitted-route","route-clearance","oversize-load-signs","height-pole"]'::jsonb,
  '["/what-is-a-pilot-car","/training/what-is-a-pilot-car","/safety/how-to-drive-near-an-oversize-load","/safety/why-pilot-cars-block-traffic","/safety/warning-triangles-vs-beacons"]'::jsonb,
  'government',
  true,
  '2026-04-29'
)
on conflict (slug) do update set
  title = excluded.title,
  agency_name = excluded.agency_name,
  publication_number = excluded.publication_number,
  publication_date = excluded.publication_date,
  source_type = excluded.source_type,
  url = excluded.url,
  summary = excluded.summary,
  use_for = excluded.use_for,
  do_not_use_for = excluded.do_not_use_for,
  related_training_slugs = excluded.related_training_slugs,
  related_glossary_slugs = excluded.related_glossary_slugs,
  related_page_paths = excluded.related_page_paths,
  trust_tier = excluded.trust_tier,
  requires_local_overlay = excluded.requires_local_overlay,
  last_reviewed_at = excluded.last_reviewed_at,
  updated_at = now();

-- Seed FHWA-aligned U.S. training courses using the real hc_training_courses schema.
insert into public.hc_training_courses (
  slug,
  title,
  description,
  tier,
  price_cents,
  currency,
  duration_hours,
  modules_count,
  delivery_method,
  country_codes,
  location_country,
  language_codes,
  tags,
  is_active,
  sort_order
) values
  ('fhwa-pevo-training-manual-overview', 'FHWA PEVO Training Manual Overview', 'A Haul Command guide to the FHWA HOP-16-050 PEVO manual: what it covers, how to use it, and where state overlays are still required.', 'free', 0, 'USD', 0.5, 1, 'self_paced', ARRAY['US'], 'US', ARRAY['en'], ARRAY['fhwa','pevo','training','us'], true, 11),
  ('route-survey-fhwa-basics', 'Route Survey Basics Using FHWA PEVO Training Structure', 'Route survey tools, procedures, contents, railroad crossing checks, and evaluation concepts based on the FHWA PEVO training outline.', 'tier1', 4900, 'USD', 2.0, 3, 'self_paced', ARRAY['US'], 'US', ARRAY['en'], ARRAY['fhwa','route-survey','us','safety'], true, 25),
  ('trip-operations-lead-rear-pevo', 'Trip Operations: Lead and Rear PEVO Roles', 'Lead and rear pilot/escort responsibilities, hazard communication, load movement preparation, roadway positioning, and traffic control using FHWA PEVO module structure.', 'tier1', 4900, 'USD', 2.0, 3, 'self_paced', ARRAY['US'], 'US', ARRAY['en'], ARRAY['fhwa','lead-car','chase-car','trip-operations'], true, 26),
  ('pevo-emergency-procedures-fhwa', 'PEVO Emergency Procedures and Post-Trip Reporting', 'Traffic emergencies, vehicle emergencies, emergency roadside parking, warning-light checks, signs/flags, height pole checks, trip logs, and written reports.', 'tier1', 4900, 'USD', 2.0, 3, 'self_paced', ARRAY['US'], 'US', ARRAY['en'], ARRAY['fhwa','emergency','post-trip','trip-logs'], true, 27)
on conflict (slug) do nothing;

-- Add source-backed glossary terms using the active glossary_terms schema.
insert into public.glossary_terms (
  slug,
  term,
  short_definition,
  long_definition,
  category,
  synonyms,
  related_slugs,
  acronyms,
  tags,
  sources,
  jurisdiction,
  example_usage,
  common_mistakes,
  published,
  noindex,
  priority
) values
  ('pilot-escort-vehicle-operator', 'Pilot/Escort Vehicle Operator', 'A pilot/escort vehicle operator, often shortened to PEVO, operates a pilot or escort vehicle for oversize or overweight load movement.', 'In U.S. training references, PEVOs support public safety during oversize load movement by warning traffic, communicating hazards, helping with permitted routes, and working with the load driver before, during, and after the trip. State rules and certification requirements still vary and must be verified locally.', 'role', ARRAY['PEVO','pilot car operator','escort vehicle operator'], ARRAY['pilot-car','lead-car','chase-car','high-pole-car','route-survey'], ARRAY['PEVO'], ARRAY['fhwa','us','training','pilot-car'], '[{"title":"FHWA Pilot/Escort Vehicle Operators Training Manual","url":"https://ops.fhwa.dot.gov/publications/fhwahop16050/index.htm","publication_number":"FHWA HOP-16-050"}]'::jsonb, 'US', 'A broker may ask whether the PEVO has the correct certification and equipment for the permitted route.', 'Do not assume PEVO certification requirements are uniform across all U.S. states.', true, false, 95),
  ('route-survey', 'Route Survey', 'A route survey is a structured review of a planned oversize-load route to identify clearances, hazards, railroad crossings, turns, and other constraints before movement.', 'The FHWA PEVO training manual includes route survey tools, procedures, contents, railroad crossings, and route survey evaluation as part of the U.S. training structure. Haul Command treats route surveys as both a safety workflow and a monetizable specialist service.', 'operations', ARRAY['route clearance','route review','pre-trip route survey'], ARRAY['route-clearance','permitted-route','high-pole-car','railroad-crossing'], ARRAY[]::text[], ARRAY['fhwa','route-survey','oversize-load','us'], '[{"title":"FHWA Pilot/Escort Vehicle Operators Training Manual","url":"https://ops.fhwa.dot.gov/publications/fhwahop16050/index.htm","publication_number":"FHWA HOP-16-050"}]'::jsonb, 'US', 'The carrier requested a route survey before moving the superload through town.', 'A route survey is not the same as a permit; the permit authorizes movement while the survey checks practical route risk.', true, false, 92),
  ('pre-trip-safety-meeting', 'Pre-Trip Safety Meeting', 'A pre-trip safety meeting is a coordination meeting before an oversize-load move to review permits, route issues, communication, load details, hazards, and team roles.', 'The FHWA PEVO training manual includes pre-trip planning, safety meetings, communication issues, team dynamics, load issues, hazardous materials, permit review, and route review. Haul Command uses this concept in training, dispatch readiness, and operator scoring.', 'safety', ARRAY['pre-trip meeting','pre-trip briefing','safety briefing'], ARRAY['permitted-route','radio-communication','route-survey','trip-log'], ARRAY[]::text[], ARRAY['fhwa','pre-trip','safety','us'], '[{"title":"FHWA Pilot/Escort Vehicle Operators Training Manual","url":"https://ops.fhwa.dot.gov/publications/fhwahop16050/index.htm","publication_number":"FHWA HOP-16-050"}]'::jsonb, 'US', 'The lead PEVO, rear PEVO, and driver reviewed the permit conditions during the pre-trip safety meeting.', 'Skipping the pre-trip meeting can cause missed permit restrictions, route hazards, or communication failures.', true, false, 90),
  ('trip-log', 'Trip Log', 'A trip log is a written or digital record of key oversize-load movement details, including route, timing, incidents, equipment issues, and post-trip notes.', 'The FHWA PEVO training manual includes written reports and trip logs in post-trip responsibilities. Haul Command can use trip logs for operator trust scoring, incident history, compliance documentation, and insurance-ready proof packs.', 'documentation', ARRAY['written report','post-trip report','movement log'], ARRAY['pre-trip-safety-meeting','route-survey','incident-documentation'], ARRAY[]::text[], ARRAY['fhwa','trip-log','documentation','us'], '[{"title":"FHWA Pilot/Escort Vehicle Operators Training Manual","url":"https://ops.fhwa.dot.gov/publications/fhwahop16050/index.htm","publication_number":"FHWA HOP-16-050"}]'::jsonb, 'US', 'The operator uploaded a trip log after completing the escorted move.', 'A trip log should not be treated as optional if a customer, insurer, or regulator later asks for proof of what happened.', true, false, 88),
  ('traffic-control-authority', 'Traffic Control Authority', 'Traffic control authority refers to the legal limits and procedures governing when and how pilot/escort operators may help control traffic during oversize-load movement.', 'The FHWA PEVO training manual includes traffic control operations, equipment for controlling traffic, and traffic control authority. State and local rules still control what an operator may legally do, so Haul Command marks this as U.S.-specific and state-overlay required.', 'safety', ARRAY['traffic control','lane control','flagging authority'], ARRAY['lead-car','chase-car','traffic-control','pilot-escort-vehicle-operator'], ARRAY[]::text[], ARRAY['fhwa','traffic-control','us','safety'], '[{"title":"FHWA Pilot/Escort Vehicle Operators Training Manual","url":"https://ops.fhwa.dot.gov/publications/fhwahop16050/index.htm","publication_number":"FHWA HOP-16-050"}]'::jsonb, 'US', 'The permit required a traffic control plan before the oversize load entered a restricted area.', 'Do not assume a PEVO can direct traffic the same way law enforcement can in every jurisdiction.', true, false, 87)
on conflict (slug) do update set
  short_definition = excluded.short_definition,
  long_definition = excluded.long_definition,
  category = excluded.category,
  synonyms = excluded.synonyms,
  related_slugs = excluded.related_slugs,
  tags = excluded.tags,
  sources = excluded.sources,
  jurisdiction = excluded.jurisdiction,
  example_usage = excluded.example_usage,
  common_mistakes = excluded.common_mistakes,
  updated_at = now();

commit;
