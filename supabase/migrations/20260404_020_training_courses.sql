-- Migration: 20260404_020_training_courses.sql
-- HC Training Platform — course catalog, enrollments, credentials
begin;

create table if not exists public.hc_training_courses (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  title                 text not null,
  description           text,
  tier                  text not null check(tier in('free','tier1','tier2_us','tier2_intl','tier3_specialist','tier4_master','enterprise')),
  track                 text,
  price_cents           int not null default 0,
  currency              char(3) not null default 'USD',
  duration_hours        numeric(5,2),
  modules_count         int default 0,
  delivery_method       text check(delivery_method in('self_paced','live_online','in_person','hybrid')),
  country_codes         text[] default '{}',
  location_country      char(2),
  language_codes        text[] default '{"en"}',
  accreditation_body    text,
  regulatory_citation   text,
  hc_trust_score_boost  int not null default 0,
  certification_level   text,
  renewal_years         int,
  prerequisites         text[],
  tags                  text[] default '{}',
  is_active             boolean default true,
  is_featured           boolean default false,
  sort_order            int default 100,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index if not exists idx_training_courses_tier      on public.hc_training_courses(tier);
create index if not exists idx_training_courses_country   on public.hc_training_courses using gin(country_codes);
create index if not exists idx_training_courses_active    on public.hc_training_courses(is_active, sort_order);

alter table public.hc_training_courses enable row level security;
create policy "Public read active courses" on public.hc_training_courses for select using (is_active = true);
create policy "Service role full access courses" on public.hc_training_courses for all using (auth.role() = 'service_role');

-- Enrollments
create table if not exists public.hc_training_enrollments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  course_id     uuid not null references public.hc_training_courses(id) on delete cascade,
  status        text not null default 'enrolled' check(status in('enrolled','in_progress','completed','failed','expired')),
  progress_pct  int default 0 check(progress_pct between 0 and 100),
  passed        boolean default false,
  score_pct     int,
  attempts      int default 0,
  enrolled_at   timestamptz default now(),
  completed_at  timestamptz,
  expires_at    timestamptz,
  cert_id       text unique,
  cert_hash     text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(user_id, course_id)
);

alter table public.hc_training_enrollments enable row level security;
create policy "Users read own enrollments" on public.hc_training_enrollments for select using (auth.uid() = user_id);
create policy "Users manage own enrollments" on public.hc_training_enrollments for all using (auth.uid() = user_id);
create policy "Service role full access enrollments" on public.hc_training_enrollments for all using (auth.role() = 'service_role');

-- Seed: 10 free micro-courses
insert into public.hc_training_courses (slug, title, description, tier, price_cents, duration_hours, modules_count, delivery_method, hc_trust_score_boost, tags, is_active, sort_order) values
  ('what-is-a-pilot-car', 'What Is a Pilot Car? The 7-Minute Explainer', 'The basics of pilot car and escort vehicle operations. What they do, why they matter, when they are required.', 'free', 0, 0.12, 1, 'self_paced', 0, ARRAY['basics','intro','global'], true, 1),
  ('why-pilot-car-certification-matters', 'Why Pilot Car Certification Matters', 'Why most states still do not require it — and why getting certified anyway is the smartest career move.', 'free', 0, 0.25, 1, 'self_paced', 0, ARRAY['certification','career'], true, 2),
  ('bridge-hit-epidemic', 'The Bridge Hit Epidemic: $300K Per Strike', 'Real data from 3,700 bridge strikes in 10 years. What causes them, what they cost, and how certified operators prevent them.', 'free', 0, 0.25, 1, 'self_paced', 0, ARRAY['safety','case-study','bridges'], true, 3),
  ('reading-your-first-permit', 'Reading Your First Oversize Permit — Line by Line', 'A guided walkthrough of a real oversize permit. What every field means, what conditions trigger escorts, and what to carry.', 'free', 0, 0.25, 1, 'self_paced', 0, ARRAY['permits','documentation','basics'], true, 4),
  ('radio-etiquette-101', 'Radio Etiquette 101: CB Protocol for Pilot Car Operators', 'CB channels, callout procedures, phonetic alphabet, and professional communication on a live convoy.', 'free', 0, 0.25, 1, 'self_paced', 0, ARRAY['communication','radio','basics'], true, 5),
  ('what-equipment-do-you-need', 'What Equipment Do You Need in a Pilot Car?', 'The minimum equipment stack: signs, lights, flags, communication, high pole, and state-specific add-ons.', 'free', 0, 0.25, 1, 'self_paced', 0, ARRAY['equipment','setup','basics'], true, 6),
  ('reciprocity-map', 'The Reciprocity Map: Which States Accept Which Certifications (2026)', 'Exactly which states honor Washington PEVO, WA reciprocity partners, and what New York requires separately.', 'free', 0, 0.25, 1, 'self_paced', 0, ARRAY['reciprocity','states','us'], true, 7),
  ('starting-your-pilot-car-business', 'Starting Your Pilot Car Business: Entity, Insurance, Equipment', 'LLC vs sole prop, minimum insurance by state, financing your vehicle, getting your first load.', 'free', 0, 0.33, 1, 'self_paced', 0, ARRAY['business','startup','career'], true, 8),
  ('high-pole-what-is-it', 'The High Pole: What It Is, How It Works, When You Need One', 'High pole physics, speed effects, sag calculations, electronic backup devices, and state-specific requirements.', 'free', 0, 0.25, 1, 'self_paced', 0, ARRAY['high-pole','specialist','basics'], true, 9),
  ('pilot-car-finances', 'Pilot Car Finances: What the Top Operators Earn and How', 'Real earnings breakdown, rate setting, contract vs. call-out, and the financial habits of operators who last 20+ years.', 'free', 0, 0.33, 1, 'self_paced', 0, ARRAY['business','rates','career'], true, 10)
on conflict (slug) do nothing;

-- Seed: Tier 1 foundation courses
insert into public.hc_training_courses (slug, title, description, tier, price_cents, currency, duration_hours, modules_count, delivery_method, language_codes, hc_trust_score_boost, tags, is_active, sort_order) values
  ('hc-certified-global-edition', 'HC Certified — Heavy Haul Safety Fundamentals (Global)', 'Core: load physics, risk assessment, incident prevention, communication protocols. Available in 5 languages. No jurisdiction-specific content.', 'tier1', 4900, 'USD', 4, 5, 'self_paced', ARRAY['en','es','pt','fr','de'], 10, ARRAY['foundation','global','safety'], true, 20),
  ('defensive-driving-pilot-car', 'Defensive Driving for Pilot Car Operators', 'Advanced vehicle handling, hazard recognition, emergency maneuvers, following distance. Fulfills defensive driving requirement for FL, PA, NC, VA.', 'tier1', 4900, 'USD', 4, 4, 'self_paced', ARRAY['en'], 10, ARRAY['driving','safety','foundation'], true, 21),
  ('radio-communication-mastery', 'Radio & Communication Mastery for Oversize Transport', 'CB radio, FRS, MURS, digital comm, phonetic alphabet, situation reports, convoy management.', 'tier1', 4900, 'USD', 3, 3, 'self_paced', ARRAY['en'], 5, ARRAY['communication','radio','foundation'], true, 22),
  ('route-survey-prep', 'Route Survey Certification Prep', 'Pre-trip surveys, bridge clearance measurement, weight rating interpretation, utility notification, documenting findings.', 'tier1', 4900, 'USD', 3, 3, 'self_paced', ARRAY['en'], 5, ARRAY['route-survey','foundation'], true, 23),
  ('oversize-documentation', 'Oversize Load Documentation: Permits, Logs, and Compliance Records', 'Reading permits, understanding conditions, maintaining trip logs, digital documentation. Meets record-keeping requirements in all jurisdictions.', 'tier1', 4900, 'USD', 3, 3, 'self_paced', ARRAY['en'], 5, ARRAY['documentation','compliance','foundation'], true, 24)
on conflict (slug) do nothing;

-- Seed: Tier 2 US state certifications
insert into public.hc_training_courses (slug, title, description, tier, price_cents, currency, duration_hours, modules_count, delivery_method, country_codes, hc_trust_score_boost, certification_level, renewal_years, tags, is_featured, is_active, sort_order) values
  ('wa-pevo-certification', 'Washington State PEVO Certification', '8-hour live online Washington State pilot/escort vehicle operator certification. Reciprocity accepted in 13 states: AZ, CO, UT, MN, OK, VA, GA, TX, KS, FL, PA, NC. Digital card issued.', 'tier2_us', 26500, 'USD', 8, 7, 'live_online', ARRAY['US'], 25, 'PEVO', 3, ARRAY['washington','pevo','reciprocity','us'], true, 30),
  ('wa-pevo-recertification', 'Washington State PEVO Recertification', 'Updated 2026 standards. Refreshed content on bridge strikes, digital permits, new reciprocity agreements. Exam required. 4 hours.', 'tier2_us', 16500, 'USD', 4, 4, 'live_online', ARRAY['US'], 15, 'PEVO-Renewal', 3, ARRAY['washington','pevo','recertification'], false, 31),
  ('fl-pevo-certification', 'Florida PEVO Certification', 'FDOT requirements, Florida Technology Transfer Center content, defensive driving requirement integrated, FL-specific curfews and night move rules.', 'tier2_us', 26500, 'USD', 8, 7, 'live_online', ARRAY['US'], 25, 'PEVO', 3, ARRAY['florida','pevo','us'], false, 32),
  ('az-pevo-certification', 'Arizona PEVO Certification', 'AZ-mandated 16-hour program. Load measurement simulation modules. Desert heat operations. I-10 and I-40 corridor specifics.', 'tier2_us', 29500, 'USD', 16, 10, 'live_online', ARRAY['US'], 30, 'PEVO', 3, ARRAY['arizona','pevo','us'], false, 33),
  ('co-pevo-certification', 'Colorado PEVO Certification', 'CO-specific content layered on WA base curriculum. Reciprocity with WA network. Mountain corridor modules.', 'tier2_us', 26500, 'USD', 8, 7, 'live_online', ARRAY['US'], 25, 'PEVO', 3, ARRAY['colorado','pevo','us'], false, 34)
on conflict (slug) do nothing;

-- Seed: Tier 2 international (first-mover certs)
insert into public.hc_training_courses (slug, title, description, tier, price_cents, currency, duration_hours, modules_count, delivery_method, country_codes, location_country, language_codes, hc_trust_score_boost, certification_level, renewal_years, tags, is_featured, is_active, sort_order) values
  ('hc-australia-national-pilot-vehicle', 'HC Australia National Pilot Vehicle Certification', 'THE FIRST PAN-AUSTRALIA PILOT VEHICLE CERTIFICATION. NHVR compliance, state overlays for all 8 states/territories, PBS scheme. Not available anywhere else.', 'tier2_intl', 29500, 'AUD', 12, 8, 'live_online', ARRAY['AU'], 'AU', ARRAY['en'], 50, 'HC Australia NPVC', 3, ARRAY['australia','nhvr','first-mover','global'], true, 40),
  ('hc-canada-national-pilot-car', 'HC Canada National Pilot Car Certification', 'THE FIRST PAN-CANADA PILOT CAR CERTIFICATION. All 10 provinces + 3 territories. Bilingual delivery. BC Coquihalla, AB oil patch, ON 400-series highways.', 'tier2_intl', 29500, 'CAD', 10, 8, 'live_online', ARRAY['CA'], 'CA', ARRAY['en','fr'], 50, 'HC Canada NPCC', 3, ARRAY['canada','transport-canada','first-mover','global'], true, 41),
  ('hc-uk-halo-certification', 'HC UK Heavy Abnormal Load Operator (HALO) Certification', 'THE FIRST FORMAL UK ESCORT CERTIFICATION. STGO Cat 1/2/3, National Highways notifications, police liaison, CLOCS/FORS metro standards, VR1/VR2 permit processes.', 'tier2_intl', 19500, 'GBP', 8, 6, 'live_online', ARRAY['GB'], 'GB', ARRAY['en'], 50, 'HC UK HALO', 3, ARRAY['uk','stgo','abnormal-load','first-mover'], true, 42),
  ('hc-deutschland-begleitfahrzeug', 'HC Deutschland Begleitfahrzeug-Zertifizierung', 'ERSTE OFFIZIELLE HC BEGLEITFAHRZEUG-ZERTIFIZIERUNG. BAG compliance, 4 Schwertransport categories, Autobahn protocols, cross-border DE-NL-AT movements.', 'tier2_intl', 22500, 'EUR', 10, 8, 'live_online', ARRAY['DE'], 'DE', ARRAY['de','en'], 50, 'HC DE BFZ', 3, ARRAY['germany','bag','schwertransport','first-mover'], true, 43),
  ('hc-gcc-heavy-transport-safety', 'HC GCC Heavy Transport Safety Certification', 'FIRST FORMAL GCC ESCORT CERTIFICATION. All 7 UAE emirates, RTA Dubai, Abu Dhabi DoT, cross-emirate borders, Saudi Arabia + Qatar cross-border.', 'tier2_intl', 89500, 'AED', 8, 6, 'live_online', ARRAY['AE','SA','QA','KW','BH','OM'], 'AE', ARRAY['en','ar'], 50, 'HC GCC HTSC', 3, ARRAY['uae','gcc','middle-east','first-mover'], true, 44),
  ('hc-brasil-certificacao', 'HC Brasil Certificação Acompanhante de Cargas Especiais', 'CONTRAN Resolution 483, ANTT interstate permits, DNIT federal routes, all 26 state DETRAN overlays, Rio-SP ARTESP corridor.', 'tier2_intl', 49500, 'BRL', 10, 8, 'live_online', ARRAY['BR'], 'BR', ARRAY['pt'], 50, 'HC Brasil ACCE', 3, ARRAY['brazil','contran','antt','first-mover'], true, 45),
  ('hc-south-africa-escort', 'HC South Africa Escort Vehicle Operator Certificate', 'National Road Traffic Act, RTMC compliance, C-permit system, 9 provincial overlays, SABS equipment standards, N1/N2/N3 corridor protocols.', 'tier2_intl', 149500, 'ZAR', 8, 6, 'live_online', ARRAY['ZA'], 'ZA', ARRAY['en'], 50, 'HC ZA EVOC', 3, ARRAY['south-africa','rtmc','mining','first-mover'], true, 46),
  ('hc-new-zealand-pilot-vehicle', 'HC New Zealand Pilot Vehicle Operator Certificate', 'Waka Kotahi Overdimension Load Code, HPMV scheme, Cook Strait ferry crossing protocols, cross-recognition with HC Australia program.', 'tier2_intl', 29500, 'NZD', 8, 6, 'live_online', ARRAY['NZ'], 'NZ', ARRAY['en'], 50, 'HC NZ PVOC', 3, ARRAY['new-zealand','nzta','waka-kotahi','first-mover'], true, 47)
on conflict (slug) do nothing;

-- Seed: Tier 3 specialist certs
insert into public.hc_training_courses (slug, title, description, tier, price_cents, currency, duration_hours, modules_count, delivery_method, hc_trust_score_boost, tags, is_active, sort_order) values
  ('hc-high-pole-mastery', 'HC High Pole Mastery Certification', 'High pole physics, sag and wind flex, speed effects, night illumination, electronic backup devices, striker tip protocols, advanced bridge survey.', 'tier3_specialist', 29500, 'USD', 6, 5, 'self_paced', 75, ARRAY['high-pole','specialist','advanced'], true, 60),
  ('hc-steerman-certification', 'HC Steerman / Rear Steer Operator Certification', 'When rear steer is required, equipment by state, communication with truck driver, liability framework, state-specific requirements: AZ, TX, CA, WA, OR.', 'tier3_specialist', 39500, 'USD', 8, 6, 'self_paced', 75, ARRAY['steerman','rear-steer','specialist'], true, 61),
  ('hc-route-survey-professional', 'HC Route Survey Professional Certification', 'Comprehensive methodology, bridge visual inspection basics, utility identification, GIS mapping, NHVR/DOT report standards, indemnification documentation.', 'tier3_specialist', 39500, 'USD', 8, 6, 'self_paced', 75, ARRAY['route-survey','specialist','advanced'], true, 62),
  ('hc-renewable-energy-transport', 'HC Renewable Energy Transport Specialist', 'Wind blade, tower, nacelle, substation, crane coordination, offshore wind port logistics, solar panel transport, battery storage. US/CA/AU/GB/DE versions.', 'tier3_specialist', 49500, 'USD', 8, 7, 'self_paced', 75, ARRAY['renewable','wind','energy','specialist','global'], true, 63),
  ('hc-twic-port-access', 'HC TWIC Port Access + Escort Certification', 'Transportation Worker Identification Credential, USCG Maritime Security, port facility escort, vessel coordination, Savannah/Houston/Long Beach/NY specifics.', 'tier3_specialist', 29500, 'USD', 6, 5, 'self_paced', 75, ARRAY['twic','port','maritime','specialist'], true, 64),
  ('hc-military-dod-transport', 'HC Military & DoD Transport Certification', 'STRAC clearance overview, MTMC, convoy with USMP, classified cargo, base access procedures, cross-state military movement orders.', 'tier3_specialist', 39500, 'USD', 8, 6, 'self_paced', 75, ARRAY['military','dod','specialist','government'], true, 65)
on conflict (slug) do nothing;

-- Seed: Tier 4 master tracks
insert into public.hc_training_courses (slug, title, description, tier, price_cents, currency, duration_hours, modules_count, delivery_method, hc_trust_score_boost, tags, is_featured, is_active, sort_order) values
  ('hc-master-operator', 'HC Master Operator Certification', 'The highest HC individual certification. Requires: active PEVO cert + 2 specialist certs + 500 documented escort miles. 120-question master exam + practical video assessment. Gold badge, priority directory placement, load board preference.', 'tier4_master', 79500, 'USD', 12, 10, 'hybrid', 100, ARRAY['master','elite','advanced','career'], true, 70),
  ('hc-instructor-certification', 'HC Instructor Certification', 'Become an authorized HC training instructor. Prerequisite: HC Master. Adult learning, course facilitation, assessment design, remote proctoring, liability as instructor. Revenue share: 60/40.', 'tier4_master', 149500, 'USD', 16, 12, 'hybrid', 100, ARRAY['instructor','master','enterprise'], false, 71),
  ('hc-safety-manager', 'HC Safety Manager Certification', 'For fleet managers, permit agents, and logistics directors. Risk management, incident investigation, driver coaching, insurance optimization, DOT compliance auditing.', 'tier4_master', 129500, 'USD', 12, 10, 'hybrid', 100, ARRAY['safety-manager','enterprise','fleet'], false, 72)
on conflict (slug) do nothing;

commit;
