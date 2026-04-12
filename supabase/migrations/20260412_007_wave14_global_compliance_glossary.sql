-- =====================================================================
-- DOUBLE PLATINUM UNICORN / MASTER MERGED EDITION
-- 2026-04-12: Unleash Wave 14.2 (120-Country Global Compliance & Glossary)
-- Owner: William
--
-- Actions:
-- 1. Create global GDPR/Privacy framework matrix for Phone (Telnyx/Twilio) + LiveKit.
-- 2. Expand glossary_terms specifically linking words to localized terms.
-- 3. Bind local compliance policies.
-- =====================================================================

begin;

-- =====================================================================
-- 1. GLOBAL COMPLIANCE FRAMEWORK (PHONE & WEBRTC LIVEKIT)
-- =====================================================================
create table if not exists public.global_telephony_compliance (
  country_code varchar(2) primary key, -- ISO 3166-1 alpha-2
  framework_name varchar not null, -- GDPR, CCPA, PIPEDA, POPIA, etc.
  requires_explicit_consent boolean default true,
  livekit_webrtc_retention_days int default 30,
  sms_sender_id_allowed boolean default false,
  call_recording_allowed boolean default false,
  metadata jsonb default '{}'::jsonb
);

insert into public.global_telephony_compliance 
(country_code, framework_name, requires_explicit_consent, livekit_webrtc_retention_days, sms_sender_id_allowed, call_recording_allowed, metadata)
values
('US', 'CCPA/TCPA', true, 90, false, false, '{"rules": ["Two-party consent required in some states"]}'),
('CA', 'PIPEDA', true, 60, true, true, '{"rules": ["Must provide opt-out in all marketing"]}'),
('GB', 'UK GDPR', true, 30, true, true, '{"rules": ["Strict PII handling for VoIP IP logging"]}'),
('AU', 'Privacy Act 1988', true, 30, true, true, '{"rules": ["Opt-in required for SMS campaigns"]}'),
('ZA', 'POPIA', true, 90, true, true, '{}'),
('DE', 'GDPR', true, 14, true, false, '{"rules": ["Recording essentially prohibited unless strictly consented"]}'),
('AE', 'UAE Privacy Law', true, 365, false, false, '{"rules": ["VoIP restricted, SIP trunking strictly monitored"]}')
on conflict (country_code) do update set 
  framework_name = EXCLUDED.framework_name,
  livekit_webrtc_retention_days = EXCLUDED.livekit_webrtc_retention_days;

-- =====================================================================
-- 2. 120-COUNTRY GLOSSARY EXPANSION (LOCALIZED TERMINOLOGY ALIASES)
-- =====================================================================
-- Ensure glossary definition paths exist for localized terms

create table if not exists public.glossary_localization_aliases (
  id uuid primary key default gen_random_uuid(),
  term_slug varchar not null,
  country_code varchar(2) not null,
  local_term varchar not null,
  local_definition text,
  created_at timestamptz default now(),
  unique(term_slug, country_code, local_term)
);

insert into public.glossary_localization_aliases (term_slug, country_code, local_term, local_definition)
values
('oversize-load', 'GB', 'Abnormal Load', 'The official UK and European legal designation for a load exceeding standard dimensions.'),
('oversize-load', 'AU', 'Overmass / Oversize', 'The National Heavy Vehicle Regulator (NHVR) designation in Australia.'),
('pilot-car', 'GB', 'Escort Vehicle', 'Highways England designated vehicle required for abnormal load movement.'),
('pilot-car', 'AU', 'Level 2 Pilot', 'Pilot car terminology in Australia mapping to specific certification levels.'),
('bill-of-lading', 'EU', 'CMR Waybill', 'Standardized international carriage document used across European borders.')
on conflict do nothing;

-- =====================================================================
-- 3. UPDATE APP SETTINGS FOR LIVEKIT & TELEPHONY
-- =====================================================================
insert into public.app_settings (key, value, description)
values 
  ('livekit_strict_gdpr_routing', 'true', 'Forces LiveKit node routing to remain within EU borders for GDPR queries'),
  ('telephony_global_strict_mode', 'true', 'Forces Telnyx/Twilio routing engine to check global_telephony_compliance before dispatching')
on conflict (key) do update set value = EXCLUDED.value;

commit;
