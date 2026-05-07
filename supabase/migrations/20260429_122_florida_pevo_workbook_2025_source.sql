-- Migration: 20260429_122_florida_pevo_workbook_2025_source.sql
-- Adds University of Florida T2 / FDOT Florida Pilot/Escort Flagging Participant Workbook as a Florida-specific source.
-- Scope: Florida and Florida-accepted PEVO qualification references only. Not global law.

begin;

-- The hc_authority_sources table is introduced in 20260429_121_fhwa_pevo_training_source.sql.
-- Keep this migration safe if run independently.
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
  'florida-pevo-flagging-participant-workbook-2025',
  'Florida Pilot/Escort Flagging — Participant Workbook',
  'University of Florida Transportation Institute / Florida Transportation Technology Transfer Center (T2)',
  'PE-Participant-Workbook-04-01-2025',
  '2025-04-01',
  'US-FL',
  'state_training_reference',
  'https://techtransfer.ce.ufl.edu/wp-content/uploads/sites/251/2025/11/PE-Participant-Workbook-04-01-2025.pdf',
  'Florida Pilot/Escort Flagging Participant Workbook used for Florida pilot/escort training. It covers the escort driver, escort vehicle, over-dimensional load stipulations, maneuvering techniques, Florida Administrative Code Chapter 14-26, Florida statutes, related federal regulations, permit examples, flagging operations, state-by-state contacts, escort checklist, and after-action report materials.',
  '["Florida PEVO training structure","Florida escort qualification education","Florida required apparel and flagging procedures","Florida escort vehicle specifications","Florida escort vehicle equipment checklist","Florida over-dimensional load stipulations","Florida permit review education","Florida pre-trip and post-trip meeting education","Florida maneuvering techniques","Florida emergency procedures","Florida after-action report workflow","Florida height-pole education","Florida accepted-state qualification reference"]'::jsonb,
  '["global pilot car rules","all 120-country standards","current non-Florida state law without verification","legal advice","permit issuance authority","proof that another state accepts Florida rules without checking that state"]'::jsonb,
  '["fl-pevo-certification","florida-pevo-flagging-workbook-2025","florida-escort-vehicle-equipment","florida-overdimensional-load-stipulations","florida-maneuvering-and-emergency-procedures","high-pole-what-is-it","reading-your-first-permit"]'::jsonb,
  '["florida-administrative-code-14-26","florida-pilot-escort-flagging","florida-escort-checklist","height-pole","pre-trip-safety-meeting","after-action-report","escort-vehicle-equipment","flagging-operations"]'::jsonb,
  '["/training/florida-pevo-flagging-workbook-2025","/training/fl-pevo-certification","/glossary/florida-administrative-code-14-26","/glossary/high-pole-car","/safety/how-to-drive-near-an-oversize-load","/what-is-a-pilot-car"]'::jsonb,
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

-- Florida-specific training overlays using the actual hc_training_courses schema.
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
  accreditation_body,
  regulatory_citation,
  tags,
  is_active,
  sort_order
) values
  ('florida-pevo-flagging-workbook-2025', 'Florida Pilot/Escort Flagging Workbook 2025 Overview', 'Florida-specific overview of the UF T2 / FDOT Pilot/Escort Flagging participant workbook, including course sessions, exam/flagging requirements, and where state overlays apply.', 'free', 0, 'USD', 0.75, 1, 'self_paced', ARRAY['US'], 'US', ARRAY['en'], 'Florida Transportation Technology Transfer Center (T2)', 'Florida Administrative Code Chapter 14-26', ARRAY['florida','fdot','pevo','flagging','uf-t2'], true, 12),
  ('florida-escort-vehicle-equipment', 'Florida Escort Vehicle Equipment and Checklist', 'Florida escort vehicle specifications, onboard equipment, identification placards, warning lights, cones, signs, flags, and height-pole education from the 2025 Florida workbook.', 'tier1', 4900, 'USD', 1.5, 2, 'self_paced', ARRAY['US'], 'US', ARRAY['en'], 'Florida Transportation Technology Transfer Center (T2)', 'Florida Administrative Code Chapter 14-26', ARRAY['florida','escort-vehicle','equipment','height-pole'], true, 28),
  ('florida-overdimensional-load-stipulations', 'Florida Over-Dimensional Load Stipulations and Permit Review', 'Florida-focused permit review, travel restrictions, escort requirements, route survey considerations, and load stipulations that affect pilot/escort drivers.', 'tier1', 4900, 'USD', 1.5, 2, 'self_paced', ARRAY['US'], 'US', ARRAY['en'], 'Florida Transportation Technology Transfer Center (T2)', 'Florida Administrative Code Chapter 14-26', ARRAY['florida','permits','load-stipulations','route-survey'], true, 29),
  ('florida-maneuvering-and-emergency-procedures', 'Florida Maneuvering Techniques and Emergency Procedures', 'Florida pilot/escort maneuvering techniques for common road configurations, breakdowns, clearance issues, minimum travel distances, braking distances, post-trip meetings, and after-action reporting.', 'tier1', 4900, 'USD', 2.0, 3, 'self_paced', ARRAY['US'], 'US', ARRAY['en'], 'Florida Transportation Technology Transfer Center (T2)', 'Florida Administrative Code Chapter 14-26', ARRAY['florida','maneuvering','emergency','after-action-report'], true, 30)
on conflict (slug) do update set
  description = excluded.description,
  accreditation_body = excluded.accreditation_body,
  regulatory_citation = excluded.regulatory_citation,
  tags = excluded.tags,
  updated_at = now();

-- Florida-specific glossary/source terms. Keep them jurisdiction-scoped and source-backed.
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
  ('florida-administrative-code-14-26', 'Florida Administrative Code Chapter 14-26', 'Florida Administrative Code Chapter 14-26 is Florida’s rule chapter covering safety regulations and permit-related requirements for overweight and overdimensional vehicles.', 'The 2025 Florida Pilot/Escort Flagging participant workbook includes FAC Chapter 14-26 as a core supplemental reference. Haul Command should use it for Florida-specific training overlays and source trails, while still verifying current rule text through the official Florida Administrative Code.', 'regulation', ARRAY['FAC 14-26','Florida escort regulations','Florida OWOD rules'], ARRAY['florida-pilot-escort-flagging','permitted-route','escort-vehicle-equipment'], ARRAY['FAC'], ARRAY['florida','fdot','regulation','pevo'], '[{"title":"Florida Pilot/Escort Flagging Participant Workbook","url":"https://techtransfer.ce.ufl.edu/wp-content/uploads/sites/251/2025/11/PE-Participant-Workbook-04-01-2025.pdf","publication_number":"PE-Participant-Workbook-04-01-2025"}]'::jsonb, 'US-FL', 'A Florida PEVO course may reference FAC 14-26 when explaining escort qualifications and vehicle equipment.', 'Do not use a workbook excerpt as a substitute for checking the current official Florida Administrative Code text.', true, false, 94),
  ('florida-pilot-escort-flagging', 'Florida Pilot/Escort Flagging', 'Florida Pilot/Escort Flagging is the Florida-specific training category for pilot/escort drivers responsible for assisting oversize-load drivers and warning the motoring public on Florida highways.', 'The UF T2 workbook states that the course was developed for pilot/escort drivers responsible for assisting oversize load drivers and warning the motoring public on Florida highways. It is a Florida training overlay and should not be treated as a global PEVO standard.', 'training', ARRAY['Florida PEVO flagging','Florida escort flagging','FDOT pilot escort flagging'], ARRAY['pilot-escort-vehicle-operator','traffic-control-authority','pre-trip-safety-meeting'], ARRAY['PEVO'], ARRAY['florida','fdot','training','flagging'], '[{"title":"Florida Pilot/Escort Flagging Participant Workbook","url":"https://techtransfer.ce.ufl.edu/wp-content/uploads/sites/251/2025/11/PE-Participant-Workbook-04-01-2025.pdf","publication_number":"PE-Participant-Workbook-04-01-2025"}]'::jsonb, 'US-FL', 'The carrier requested a Florida Pilot/Escort Flagging-qualified escort for an overdimensional movement.', 'Do not assume Florida flagging qualification automatically covers every other state without checking that state’s acceptance rules.', true, false, 93),
  ('florida-escort-checklist', 'Florida Escort Checklist', 'The Florida Escort Checklist is a Florida workbook tool for checking escort qualification, escort vehicle requirements, onboard equipment, warning devices, placards, signs, cones, flags, and height-pole readiness.', 'The 2025 Florida workbook includes an escort checklist with qualification and equipment items such as age/license, defensive driving or CDL option, pilot/escort flagging course, accepted-state qualifications, vehicle registration, side placards, amber lights visible within 500 feet, signs, cones, flags, and a height pole for over-height loads.', 'checklist', ARRAY['Florida pilot car checklist','Florida PEVO checklist','escort vehicle checklist'], ARRAY['escort-vehicle-equipment','height-pole','florida-pilot-escort-flagging'], ARRAY[]::text[], ARRAY['florida','checklist','equipment','pevo'], '[{"title":"Florida Pilot/Escort Flagging Participant Workbook","url":"https://techtransfer.ce.ufl.edu/wp-content/uploads/sites/251/2025/11/PE-Participant-Workbook-04-01-2025.pdf","publication_number":"PE-Participant-Workbook-04-01-2025"}]'::jsonb, 'US-FL', 'The dispatcher asked the operator to complete the Florida Escort Checklist before the move.', 'Do not copy the checklist blindly into another state; equipment and qualification requirements vary.', true, false, 91),
  ('after-action-report', 'After Action Report', 'An after action report is a post-trip document that records assignment details, encountered issues, recommendations, responsible team members, follow-up dates, and lessons learned.', 'The Florida workbook includes an after action report template for documenting assignment summary, load description, team members, issues, recommendations, follow-up, conclusions, and signatures. Haul Command can use this as a model for trip logs, proof packs, incident documentation, and operator trust scoring.', 'documentation', ARRAY['AAR','post-trip report','lessons learned report'], ARRAY['trip-log','pre-trip-safety-meeting','incident-documentation'], ARRAY['AAR'], ARRAY['florida','documentation','post-trip','safety'], '[{"title":"Florida Pilot/Escort Flagging Participant Workbook","url":"https://techtransfer.ce.ufl.edu/wp-content/uploads/sites/251/2025/11/PE-Participant-Workbook-04-01-2025.pdf","publication_number":"PE-Participant-Workbook-04-01-2025"}]'::jsonb, 'US-FL', 'The lead escort completed an after action report after a clearance issue delayed the load.', 'Do not wait until a dispute to reconstruct what happened; record issues and lessons learned immediately after the move.', true, false, 89),
  ('height-pole-six-inch-clearance-florida', 'Florida Height Pole Six-Inch Clearance Rule', 'Florida training materials state that a height pole for over-height loads must be non-conductive, non-destructive, and positioned at least six inches above the height of the escorted load.', 'The 2025 Florida workbook includes height-pole requirements in both the training slides and supplemental FAC material. Haul Command should use this as a Florida-specific rule reference and connect it to high-pole car training, equipment marketplace content, and route-clearance workflows.', 'equipment', ARRAY['Florida height pole rule','height indicator','high pole clearance'], ARRAY['high-pole-car','route-clearance','escort-vehicle-equipment'], ARRAY[]::text[], ARRAY['florida','height-pole','equipment','clearance'], '[{"title":"Florida Pilot/Escort Flagging Participant Workbook","url":"https://techtransfer.ce.ufl.edu/wp-content/uploads/sites/251/2025/11/PE-Participant-Workbook-04-01-2025.pdf","publication_number":"PE-Participant-Workbook-04-01-2025"}]'::jsonb, 'US-FL', 'For an over-height Florida load, the lead vehicle used a non-conductive height pole set at least six inches above load height.', 'Do not apply the Florida six-inch statement globally without verifying the jurisdiction.', true, false, 90)
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
