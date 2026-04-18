-- WAVE-8 + WAVE-9: Compliance, Permit Intake, KYC Webhooks + 120-Country Expansion
-- Fully additive. All IF NOT EXISTS guarded.

-- ==============================================================
-- WAVE-8: COMPLIANCE & KYC INFRASTRUCTURE
-- ==============================================================

-- 1. Permit intake table — multi-country permit request submissions
CREATE TABLE IF NOT EXISTS permit_intake_requests (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  submitted_by        uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  country_iso         text        NOT NULL,
  region_code         text        NULL,
  permit_type         text        NOT NULL,  -- from jurisdiction registry
  vehicle_type        text        NULL,
  load_weight_kg      numeric     NULL,
  load_dimensions     jsonb       NULL,  -- { width_m, height_m, length_m }
  route_description   text        NULL,
  status              text        NOT NULL DEFAULT 'submitted',
  stripe_payment_intent_id text   NULL,  -- paid permit flow
  amount_cents        integer     NULL,
  official_source_url text        NULL,
  notes               text        NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS permit_intake_profile_idx ON permit_intake_requests(profile_id);
CREATE INDEX IF NOT EXISTS permit_intake_country_idx ON permit_intake_requests(country_iso, region_code);

ALTER TABLE permit_intake_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permit_intake_owner_select" ON permit_intake_requests
  FOR SELECT TO authenticated
  USING (submitted_by = auth.uid() OR profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "permit_intake_auth_insert" ON permit_intake_requests
  FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid());

-- 2. KYC verification sessions — Persona/Stripe Identity webhook targets
CREATE TABLE IF NOT EXISTS kyc_verification_sessions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider            text        NOT NULL DEFAULT 'stripe_identity', -- 'persona', 'stripe_identity', 'manual'
  provider_session_id text        NULL,  -- external provider's session/inquiry ID
  tier_requested      integer     NOT NULL DEFAULT 1,
  tier_granted        integer     NULL,
  status              text        NOT NULL DEFAULT 'pending',  -- pending, passed, failed, expired, cancelled
  failure_reason      text        NULL,
  passed_at           timestamptz NULL,
  failed_at           timestamptz NULL,
  expires_at          timestamptz NULL,
  webhook_payload     jsonb       NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kyc_sessions_profile_idx ON kyc_verification_sessions(profile_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS kyc_sessions_provider_session_uidx
  ON kyc_verification_sessions(provider, provider_session_id)
  WHERE provider_session_id IS NOT NULL;

ALTER TABLE kyc_verification_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kyc_sessions_owner" ON kyc_verification_sessions
  FOR ALL TO authenticated
  USING (profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. Notification preferences — per-user channel control
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id              uuid    PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  push_enabled         boolean NOT NULL DEFAULT true,
  email_enabled        boolean NOT NULL DEFAULT true,
  sms_enabled          boolean NOT NULL DEFAULT false,
  quiet_hours_enabled  boolean NOT NULL DEFAULT false,
  quiet_start_hour     integer NOT NULL DEFAULT 22,
  quiet_end_hour       integer NOT NULL DEFAULT 7,
  timezone             text    NOT NULL DEFAULT 'UTC',
  load_match_push      boolean NOT NULL DEFAULT true,
  claim_nudge_push     boolean NOT NULL DEFAULT true,
  payout_alert_push    boolean NOT NULL DEFAULT true,
  marketing_email      boolean NOT NULL DEFAULT true,
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================
-- WAVE-9: 120-COUNTRY GLOBAL EXPANSION SCHEMA
-- ==============================================================

-- 4. Country registry — canonical 120-country metadata
CREATE TABLE IF NOT EXISTS country_registry (
  iso                 text        PRIMARY KEY,  -- 'US', 'CA', 'AU', 'DE', etc.
  name                text        NOT NULL,
  tier                text        NOT NULL DEFAULT 'E',  -- 'A','B','C','D','E' per master prompt tiers
  currency_code       text        NOT NULL DEFAULT 'USD',
  locale              text        NOT NULL DEFAULT 'en',
  phone_prefix        text        NULL,
  weight_system       text        NOT NULL DEFAULT 'metric',  -- 'metric' | 'imperial'
  weight_limit_kg     numeric     NULL,
  regulatory_authority text       NULL,
  crypto_restricted   boolean     NOT NULL DEFAULT false,
  launch_status       text        NOT NULL DEFAULT 'waitlist',  -- 'live', 'expanding', 'waitlist', 'planned'
  seo_priority        boolean     NOT NULL DEFAULT false,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Seed Tier A countries (Gold — highest priority)
INSERT INTO country_registry (iso, name, tier, currency_code, locale, weight_system, launch_status, seo_priority)
VALUES
  ('US', 'United States',  'A', 'USD', 'en-US', 'imperial', 'live',       true),
  ('CA', 'Canada',         'A', 'CAD', 'en-CA', 'metric',   'live',       true),
  ('AU', 'Australia',      'A', 'AUD', 'en-AU', 'metric',   'expanding',  true),
  ('GB', 'United Kingdom', 'A', 'GBP', 'en-GB', 'metric',   'expanding',  true),
  ('NZ', 'New Zealand',    'A', 'NZD', 'en-NZ', 'metric',   'waitlist',   true),
  ('ZA', 'South Africa',   'A', 'ZAR', 'en-ZA', 'metric',   'waitlist',   false),
  ('DE', 'Germany',        'A', 'EUR', 'de-DE', 'metric',   'waitlist',   false),
  ('NL', 'Netherlands',    'A', 'EUR', 'nl-NL', 'metric',   'waitlist',   false),
  ('AE', 'UAE',            'A', 'AED', 'ar-AE', 'metric',   'waitlist',   false),
  ('BR', 'Brazil',         'A', 'BRL', 'pt-BR', 'metric',   'waitlist',   false)
ON CONFLICT (iso) DO NOTHING;

-- Seed Tier B countries (Blue)
INSERT INTO country_registry (iso, name, tier, currency_code, locale, weight_system, launch_status)
VALUES
  ('IE', 'Ireland',     'B', 'EUR', 'en-IE', 'metric', 'waitlist'),
  ('SE', 'Sweden',      'B', 'SEK', 'sv-SE', 'metric', 'waitlist'),
  ('NO', 'Norway',      'B', 'NOK', 'nb-NO', 'metric', 'waitlist'),
  ('DK', 'Denmark',     'B', 'DKK', 'da-DK', 'metric', 'waitlist'),
  ('MX', 'Mexico',      'B', 'MXN', 'es-MX', 'metric', 'waitlist'),
  ('IN', 'India',       'B', 'INR', 'en-IN', 'metric', 'waitlist'),
  ('SA', 'Saudi Arabia','B', 'SAR', 'ar-SA', 'metric', 'waitlist'),
  ('FR', 'France',      'B', 'EUR', 'fr-FR', 'metric', 'waitlist'),
  ('DE', 'Germany',     'A', 'EUR', 'de-DE', 'metric', 'waitlist')
ON CONFLICT (iso) DO NOTHING;

-- 5. Country landing page registry — one per live/expanding country
CREATE TABLE IF NOT EXISTS country_landing_pages (
  country_iso         text        PRIMARY KEY REFERENCES country_registry(iso),
  title               text        NOT NULL,
  meta_description    text        NULL,
  hero_headline       text        NULL,
  operator_count      integer     NOT NULL DEFAULT 0,  -- real count, not fake
  corridor_count      integer     NOT NULL DEFAULT 0,
  regulation_count    integer     NOT NULL DEFAULT 0,
  last_refreshed_at   timestamptz NOT NULL DEFAULT now(),
  published           boolean     NOT NULL DEFAULT false
);

-- Seed US + CA + AU landing pages (live markets)
INSERT INTO country_landing_pages (country_iso, title, meta_description, hero_headline, published)
VALUES
  ('US', 'Heavy Haul Escort & Pilot Car Directory — United States | Haul Command',
   'Find verified heavy haul escort operators, pilot car services, and oversize load brokers across all 50 US states. Trusted by the transport industry.',
   'The Trusted OS for US Heavy Haul', true),
  ('CA', 'Heavy Haul Escort & Pilot Car Directory — Canada | Haul Command',
   'Find verified oversize load escort operators across all Canadian provinces. Haul Command is the heavy transport authority for Canadian corridors.',
   'Canada\'s Heavy Haul Operating System', true),
  ('AU', 'Heavy Haulage Pilot Vehicle Directory — Australia | Haul Command',
   'Verified pilot vehicle operators, PBS escorts, and oversize transport specialists across all Australian states and territories.',
   'Australia\'s Pilot Vehicle & Heavy Haulage Authority', true)
ON CONFLICT (country_iso) DO NOTHING;

-- 6. Jurisdiction registry — extends from GEM-R04 30-country pack
CREATE TABLE IF NOT EXISTS jurisdiction_registry (
  id                  bigserial   PRIMARY KEY,
  country_iso         text        NOT NULL REFERENCES country_registry(iso) ON DELETE CASCADE,
  region_code         text        NULL,   -- NULL = national level
  authority_name      text        NOT NULL,
  authority_url       text        NULL,
  permit_types        text[]      NOT NULL DEFAULT ARRAY[]::text[],
  weight_limit_kg     numeric     NULL,
  special_requirements text[]     NOT NULL DEFAULT ARRAY[]::text[],
  crypto_restricted   boolean     NOT NULL DEFAULT false,
  confidence_state    text        NOT NULL DEFAULT 'seeded_needs_review',
  last_verified_at    timestamptz NULL,
  official_source_url text        NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_iso, region_code)
);

-- Seed verified jurisdictions (GEM-R04 data + US/CA core)
INSERT INTO jurisdiction_registry (country_iso, region_code, authority_name, authority_url, permit_types, weight_limit_kg, confidence_state, official_source_url)
VALUES
  ('US', NULL, 'Federal Highway Administration (FHWA)', 'https://ops.fhwa.dot.gov', ARRAY['Federal Oversize Permit', 'Interstate Permit'], 36287, 'verified_current', 'https://ops.fhwa.dot.gov/freight/sw/permit_report/index.htm'),
  ('CA', NULL, 'Transport Canada / Provincial',          'https://tc.gc.ca',          ARRAY['Oversize Load Permit', 'Provincial Pilot Car Permit'], 62500, 'partially_verified', 'https://tc.gc.ca/en/transport-canada.html'),
  ('AU', NULL, 'National Heavy Vehicle Regulator (NHVR)', 'https://www.nhvr.gov.au', ARRAY['Class 1 Pilot Vehicle Permit', 'PBS Assessment'], 42500, 'verified_current', 'https://www.nhvr.gov.au/road-access/oversize-overmass'),
  ('GB', NULL, 'Driver and Vehicle Standards Agency (DVSA)', 'https://www.gov.uk/dvsa', ARRAY['Abnormal Load Notification', 'Special Order'], 44000, 'verified_current', 'https://www.gov.uk/special-types-general-order-vehicles'),
  ('DE', NULL, 'Bundesamt für Logistik und Mobilität (BALM)', 'https://www.balm.bund.de', ARRAY['§29 StVO Permit', 'Grossraum-Transport'], 40000, 'partially_verified', 'https://www.balm.bund.de'),
  ('IN', NULL, 'Ministry of Road Transport and Highways (MoRTH)', 'https://morth.nic.in', ARRAY['ODC Permit', 'National Permit'], 49000, 'seeded_needs_review', 'https://morth.nic.in'),
  ('BR', NULL, 'Agência Nacional de Transportes Terrestres (ANTT)', 'https://www.antt.gov.br', ARRAY['AET Special Transit Authorization'], 74000, 'seeded_needs_review', 'https://www.antt.gov.br'),
  ('MX', NULL, 'SICT Mexico', 'https://www.sct.gob.mx', ARRAY['Permiso Especial de Carga'], 75500, 'seeded_needs_review', 'https://www.sct.gob.mx'),
  ('AE', NULL, 'Roads and Transport Authority (RTA)', 'https://www.rta.ae', ARRAY['Heavy Truck Permit', 'Abnormal Load Permit'], 50000, 'seeded_needs_review', 'https://www.rta.ae'),
  ('ZA', NULL, 'Department of Transport South Africa', 'https://www.transport.gov.za', ARRAY['Abnormal Load Permit', 'Pilot Vehicle Permit'], 56000, 'seeded_needs_review', 'https://www.transport.gov.za')
ON CONFLICT (country_iso, region_code) DO NOTHING;

-- 7. Claim pressure queue (referenced by claim-growth-core)
CREATE TABLE IF NOT EXISTS claim_pressure_queue (
  profile_id          uuid        PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  country_iso         text        NULL,
  region_code         text        NULL,
  trust_score         integer     NOT NULL DEFAULT 0,
  last_pressure_at    timestamptz NOT NULL DEFAULT now(),
  pressure_count      integer     NOT NULL DEFAULT 1
);

-- 8. AdGrid impression + click tables (referenced by adgrid-yield-core)
CREATE TABLE IF NOT EXISTS ad_impressions (
  id              bigserial   PRIMARY KEY,
  placement_id    uuid        NULL,
  geo_key         text        NOT NULL,
  role_context    text        NULL,
  user_id         uuid        NULL,
  epoch           bigint      NOT NULL,
  billed          boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_impressions_placement_billed_idx ON ad_impressions(placement_id, billed);
CREATE INDEX IF NOT EXISTS ad_impressions_epoch_idx ON ad_impressions(epoch);

CREATE TABLE IF NOT EXISTS ad_clicks (
  id              bigserial   PRIMARY KEY,
  placement_id    uuid        NULL,
  user_id         uuid        NULL,
  referrer        text        NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 9. match_offers unique constraint (referenced by route-matcher-agent)
ALTER TABLE match_offers ADD COLUMN IF NOT EXISTS offer_rank integer;
CREATE UNIQUE INDEX IF NOT EXISTS match_offers_load_escort_uidx
  ON match_offers(load_id, escort_id)
  WHERE status != 'expired';
