-- Migration: 20260429_123_work_zone_safety_clearinghouse_source.sql
-- Adds Work Zone Safety Information Clearinghouse laws/standards/policies index as a U.S. source directory.
-- Scope: U.S. national/state work-zone safety, MUTCD, state specs/drawings, and traffic-control policy discovery.
-- Not a substitute for checking the underlying state DOT/statute source.

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
  'work-zone-safety-laws-standards-policies-index',
  'Laws, Standards & Policies',
  'Work Zone Safety Information Clearinghouse',
  null,
  null,
  'US',
  'source_directory',
  'https://workzonesafety.org/laws-standards-policies/',
  'U.S. work-zone safety source directory linking to the National Manual on Uniform Traffic Control Devices, FHWA state specifications, FHWA state standard drawings, and state-by-state work-zone laws, safety policies, mobility policies, traffic-control references, and related transportation management plan resources.',
  '["U.S. work-zone law discovery","state work-zone policy discovery","MUTCD reference routing","state DOT specifications discovery","state standard drawing discovery","traffic-control policy research","flagger training research","transportation management plan research","public safety page source trails","pilot/escort work-zone safety overlays","route survey work-zone risk overlays","corridor work-zone risk intelligence"]'::jsonb,
  '["global work-zone law","final legal authority without opening the underlying state source","current state law without verification","pilot car escort requirements unrelated to work zones","permit issuance authority","legal advice","automated blanket claims for all U.S. states"]'::jsonb,
  '["roadside-emergency-visibility","route-survey-fhwa-basics","trip-operations-lead-rear-pevo","florida-maneuvering-and-emergency-procedures","pilot-car-public-safety","public-driver-mistakes"]'::jsonb,
  '["work-zone-safety","mutcd","transportation-management-plan","temporary-traffic-control","flagger","state-standard-drawings","state-specifications","work-zone-speed-limit","traffic-control-authority"]'::jsonb,
  '["/safety/how-to-drive-near-an-oversize-load","/safety/why-pilot-cars-block-traffic","/safety/what-to-do-when-you-see-a-wide-load","/safety/why-oversize-loads-need-the-whole-road","/training/route-survey-prep","/regulatory-radar"]'::jsonb,
  'government',
  true,
  '2026-04-29'
)
on conflict (slug) do update set
  title = excluded.title,
  agency_name = excluded.agency_name,
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
  ('work-zone-safety', 'Work Zone Safety', 'Work zone safety is the set of laws, standards, traffic-control practices, devices, training, and mobility policies used to protect workers, drivers, pedestrians, and equipment in roadway construction or maintenance areas.', 'For Haul Command, work-zone safety matters because oversize loads and pilot/escort vehicles often move through construction zones, temporary lane shifts, narrowed bridges, flagging operations, and reduced-speed areas. The Work Zone Safety Information Clearinghouse is a U.S. source directory for national and state work-zone laws, standards, and policies.', 'safety', ARRAY['roadway work zone safety','construction zone safety','highway work zone safety'], ARRAY['temporary-traffic-control','mutcd','transportation-management-plan','traffic-control-authority','flagger'], ARRAY[]::text[], ARRAY['work-zone','safety','us','route-survey'], '[{"title":"Work Zone Safety Information Clearinghouse — Laws, Standards & Policies","url":"https://workzonesafety.org/laws-standards-policies/"}]'::jsonb, 'US', 'The route survey flagged a high-risk work zone before the oversize load entered the construction area.', 'Do not assume one state’s work-zone rule, speed penalty, or flagger requirement applies nationally.', true, false, 90),
  ('mutcd', 'Manual on Uniform Traffic Control Devices', 'The Manual on Uniform Traffic Control Devices, or MUTCD, is the national U.S. reference for traffic-control devices used on public roads, including signs, signals, pavement markings, and temporary traffic-control setups.', 'The Work Zone Safety Information Clearinghouse points users to the national MUTCD as the national standards reference. Haul Command should link MUTCD concepts to work-zone safety, pilot/escort traffic-control education, route surveys, and public safety pages while still checking state supplements and DOT policies.', 'standard', ARRAY['National MUTCD','traffic control devices manual'], ARRAY['temporary-traffic-control','work-zone-safety','traffic-control-authority','state-standard-drawings'], ARRAY['MUTCD'], ARRAY['mutcd','traffic-control','work-zone','us'], '[{"title":"Work Zone Safety Information Clearinghouse — Laws, Standards & Policies","url":"https://workzonesafety.org/laws-standards-policies/"},{"title":"National Manual on Uniform Traffic Control Devices","url":"https://mutcd.fhwa.dot.gov/"}]'::jsonb, 'US', 'A temporary traffic-control plan should be checked against MUTCD principles and the state DOT’s requirements.', 'Do not treat MUTCD alone as the only requirement; states may have supplements, specs, drawings, and project-specific traffic-control plans.', true, false, 93),
  ('transportation-management-plan', 'Transportation Management Plan', 'A transportation management plan, or TMP, is a project-level plan for managing traffic, safety, mobility, and public impact during roadway construction, maintenance, or major traffic disruptions.', 'For heavy haul, TMPs matter because work zones can change lane widths, shoulders, detours, bridge access, vertical clearances, and escort requirements. The Work Zone Safety Information Clearinghouse lists state safety and mobility policies where TMP references often appear.', 'planning', ARRAY['TMP','work zone mobility plan','traffic management plan'], ARRAY['work-zone-safety','route-survey','temporary-traffic-control','corridor-risk'], ARRAY['TMP'], ARRAY['work-zone','planning','mobility','route-survey'], '[{"title":"Work Zone Safety Information Clearinghouse — Laws, Standards & Policies","url":"https://workzonesafety.org/laws-standards-policies/"}]'::jsonb, 'US', 'The route surveyor checked the corridor’s TMP before approving an over-dimensional move through the work zone.', 'Do not assume a normal route remains safe during active construction; the TMP may change lanes, shoulders, detours, and timing.', true, false, 88),
  ('temporary-traffic-control', 'Temporary Traffic Control', 'Temporary traffic control is the use of signs, cones, barriers, flaggers, lane closures, detours, and other devices or procedures to manage traffic safely through temporary roadway conditions.', 'Temporary traffic control is central to work-zone safety and can affect pilot/escort vehicle positioning, traffic separation, oversize-load routing, and public-driver behavior. Haul Command should use it in training, safety pages, and route-survey checklists.', 'safety', ARRAY['TTC','temporary work zone traffic control','work zone traffic control'], ARRAY['mutcd','work-zone-safety','flagger','traffic-control-authority'], ARRAY['TTC'], ARRAY['traffic-control','work-zone','safety','us'], '[{"title":"Work Zone Safety Information Clearinghouse — Laws, Standards & Policies","url":"https://workzonesafety.org/laws-standards-policies/"}]'::jsonb, 'US', 'Temporary traffic control narrowed the route enough that the carrier needed a revised route survey.', 'Do not treat a pilot car as a substitute for required work-zone traffic-control devices or authorized flagging personnel.', true, false, 89),
  ('state-standard-drawings', 'State Standard Drawings', 'State standard drawings are official state DOT design drawings that show standard layouts, devices, dimensions, and details for roadway construction, work-zone, and traffic-control applications.', 'The Work Zone Safety Information Clearinghouse links to FHWA State Standard Drawing resources. Haul Command can use this source category to route users toward state-specific drawings when route surveys, work zones, construction zones, or temporary traffic-control setups affect oversize-load movements.', 'reference', ARRAY['state DOT standard drawings','standard plans','traffic control drawings'], ARRAY['state-specifications','work-zone-safety','temporary-traffic-control','route-survey'], ARRAY[]::text[], ARRAY['state-dot','standard-drawings','work-zone','us'], '[{"title":"Work Zone Safety Information Clearinghouse — Laws, Standards & Policies","url":"https://workzonesafety.org/laws-standards-policies/"}]'::jsonb, 'US', 'The route survey team checked state standard drawings before deciding whether the temporary lane shift could support the load.', 'Do not use another state’s drawing as proof for the current state or project.', true, false, 84)
on conflict (slug) do update set
  short_definition = excluded.short_definition,
  long_definition = excluded.long_definition,
  category = excluded.category,
  synonyms = excluded.synonyms,
  related_slugs = excluded.related_slugs,
  acronyms = excluded.acronyms,
  tags = excluded.tags,
  sources = excluded.sources,
  jurisdiction = excluded.jurisdiction,
  example_usage = excluded.example_usage,
  common_mistakes = excluded.common_mistakes,
  updated_at = now();

-- Training overlays for U.S. work-zone/route-survey safety. Use existing hc_training_courses schema.
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
  ('work-zone-safety-for-pilot-cars', 'Work Zone Safety for Pilot Car Operators', 'U.S. work-zone safety basics for pilot/escort operators: temporary traffic control, reduced speed areas, narrowed lanes, flaggers, work-zone devices, and state policy lookup.', 'tier1', 4900, 'USD', 1.5, 2, 'self_paced', ARRAY['US'], 'US', ARRAY['en'], ARRAY['work-zone','pilot-car','safety','us'], true, 31),
  ('mutcd-and-temporary-traffic-control-basics', 'MUTCD and Temporary Traffic Control Basics', 'Beginner-friendly overview of MUTCD concepts, temporary traffic-control devices, and why state supplements and project-specific plans still matter.', 'tier1', 4900, 'USD', 1.5, 2, 'self_paced', ARRAY['US'], 'US', ARRAY['en'], ARRAY['mutcd','traffic-control','work-zone','us'], true, 32),
  ('route-survey-work-zone-risk', 'Route Survey: Work-Zone Risk Checks', 'How to flag work-zone risks during route surveys: lane shifts, shoulders, detours, narrowed bridges, temporary signs, equipment staging, and state DOT policy sources.', 'tier1', 4900, 'USD', 2.0, 3, 'self_paced', ARRAY['US'], 'US', ARRAY['en'], ARRAY['route-survey','work-zone','corridor-risk','us'], true, 33)
on conflict (slug) do update set
  description = excluded.description,
  tags = excluded.tags,
  updated_at = now();

commit;
