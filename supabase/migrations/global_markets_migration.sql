-- ============================================================================
-- ANTIGRAVITY: GLOBAL MARKETS MIGRATION (FORTUNE 5 ARCHITECTURE)
-- ============================================================================
-- Rule 0: Additive only. Zero destructive changes. Layers on canonical schema.
-- Covers: US 50 states, CA 13 provinces, MX border, UK abnormal load,
--         AU tier-based pilots, EU axle weight, Turkey/EFTA, global backbone.
-- ============================================================================


-- ===================== NEW ENUMS =====================

CREATE TYPE market_tier AS ENUM ('live', 'expansion', 'infrastructure');
CREATE TYPE measurement_system AS ENUM ('imperial', 'metric');
CREATE TYPE jurisdiction_type AS ENUM ('country', 'state_province', 'municipality', 'corridor');
CREATE TYPE border_crossing_status AS ENUM ('open', 'restricted', 'closed');
CREATE TYPE permit_terminology AS ENUM (
  'oversize_overweight',   -- US Standard
  'superload',             -- US/CA heavy
  'abnormal_load',         -- UK
  'special_order',         -- UK VR1
  'excess_dimension',      -- Australia
  'transport_exceptionnel', -- EU/France
  'schwertransport',       -- EU/Germany
  'trasporto_eccezionale', -- EU/Italy
  'generic'                -- fallback
);
CREATE TYPE pilot_certification_tier AS ENUM (
  'none',
  'state_certified',       -- US (varies by state)
  'level_1',               -- Australia Tier 1 (front pilot only)
  'level_2',               -- Australia Tier 2 (front + rear, complex)
  'city_guilds',           -- UK City & Guilds certification
  'eu_certified',          -- EU member state certification
  'federal'                -- Country-level federal certification
);
CREATE TYPE vehicle_inspection_status AS ENUM (
  'unverified', 'pending_review', 'verified', 'failed', 'expired'
);


-- ===================== MARKETS (Top-Level Zones) =====================

CREATE TABLE public.markets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT NOT NULL UNIQUE,                -- 'US', 'CA', 'MX', 'UK', 'AU', 'EU', etc.
  name         TEXT NOT NULL,
  tier         market_tier NOT NULL,
  region       TEXT NOT NULL,                       -- 'north_america', 'europe', etc.
  default_measurement measurement_system NOT NULL DEFAULT 'imperial',
  default_currency    CHAR(3) NOT NULL DEFAULT 'USD',
  permit_term  permit_terminology NOT NULL DEFAULT 'generic',
  timezone_ref TEXT,                                -- IANA timezone for default display
  here_coverage BOOLEAN DEFAULT TRUE,              -- HERE Technologies data available
  regulatory_notes JSONB DEFAULT '{}',             -- freeform regulatory context
  activated_at TIMESTAMPTZ,                        -- NULL = not yet activated
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_markets_tier ON public.markets(tier);
CREATE INDEX idx_markets_code ON public.markets(code);

COMMENT ON TABLE public.markets IS 'Fortune 5 global market hierarchy. Tier: live/expansion/infrastructure.';


-- ===================== JURISDICTIONS (Regulatory Zones) =====================

CREATE TABLE public.jurisdictions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id     UUID NOT NULL REFERENCES public.markets(id),
  code          TEXT NOT NULL,                      -- 'US-FL', 'CA-AB', 'UK-ENG', 'AU-NSW'
  name          TEXT NOT NULL,
  type          jurisdiction_type NOT NULL DEFAULT 'state_province',
  iso_3166_2    TEXT,                               -- ISO 3166-2 subdivision code
  permit_term   permit_terminology,                 -- overrides market default if set
  pilot_cert_tier pilot_certification_tier DEFAULT 'none',
  reciprocal_with TEXT[] DEFAULT '{}',              -- list of jurisdiction codes that honor this cert
  has_curfew    BOOLEAN DEFAULT FALSE,
  curfew_rules  JSONB DEFAULT '{}',                 -- e.g. {"type":"night_only","start":"23:00","end":"05:00"}
  escort_required_above JSONB DEFAULT '{}',         -- e.g. {"width_ft":12,"height_ft":15,"weight_lb":120000}
  max_dimensions JSONB DEFAULT '{}',                -- absolute max without special permit
  speed_limits  JSONB DEFAULT '{}',                 -- oversize-specific speed limits
  regulatory_url TEXT,                              -- link to official DOT/transport authority
  notes         TEXT,
  activated_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(market_id, code)
);

CREATE INDEX idx_jurisdictions_market ON public.jurisdictions(market_id);
CREATE INDEX idx_jurisdictions_code   ON public.jurisdictions(code);
CREATE INDEX idx_jurisdictions_type   ON public.jurisdictions(type);

COMMENT ON TABLE public.jurisdictions IS 'Per-jurisdiction regulatory data: curfews, escort thresholds, certifications, dimension limits.';


-- ===================== JURISDICTION RULES (Specific Regulations) =====================

CREATE TABLE public.jurisdiction_rules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id  UUID NOT NULL REFERENCES public.jurisdictions(id) ON DELETE CASCADE,
  rule_category    TEXT NOT NULL,                   -- 'escort', 'permit', 'curfew', 'speed', 'equipment', 'signage'
  rule_key         TEXT NOT NULL,                   -- 'front_escort_required', 'rear_escort_above_width', etc.
  rule_value       JSONB NOT NULL,                  -- {"threshold_ft": 14, "required": true}
  effective_date   DATE,
  expiry_date      DATE,
  source_url       TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(jurisdiction_id, rule_category, rule_key)
);

CREATE INDEX idx_jurisdiction_rules_jid ON public.jurisdiction_rules(jurisdiction_id);
CREATE INDEX idx_jurisdiction_rules_cat ON public.jurisdiction_rules(rule_category);

COMMENT ON TABLE public.jurisdiction_rules IS 'Granular regulations per jurisdiction: escort thresholds, equipment requirements, signage, speed limits.';


-- ===================== BORDER CROSSINGS =====================

CREATE TABLE public.border_crossings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  from_jurisdiction_id UUID REFERENCES public.jurisdictions(id),
  to_jurisdiction_id   UUID REFERENCES public.jurisdictions(id),
  crossing_type      TEXT NOT NULL DEFAULT 'land',  -- 'land', 'sea', 'rail'
  status             border_crossing_status DEFAULT 'open',
  lat                NUMERIC(10,7),
  lng                NUMERIC(10,7),
  customs_required   BOOLEAN DEFAULT TRUE,
  customs_broker_required BOOLEAN DEFAULT FALSE,
  drayage_transfer_required BOOLEAN DEFAULT FALSE,
  pre_clearance_hours INTEGER DEFAULT 48,           -- hours advance notice needed
  documentation_required JSONB DEFAULT '{}',        -- {"commercial_invoice":true,"border_permit":true}
  operating_hours    JSONB DEFAULT '{}',            -- {"weekday":"06:00-22:00","weekend":"08:00-18:00"}
  oversize_restrictions JSONB DEFAULT '{}',         -- {"max_width_ft":16,"night_only":true}
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_border_crossings_from ON public.border_crossings(from_jurisdiction_id);
CREATE INDEX idx_border_crossings_to   ON public.border_crossings(to_jurisdiction_id);

COMMENT ON TABLE public.border_crossings IS 'Cross-border transit points with customs, drayage, and oversize-specific restrictions.';


-- ===================== CURRENCIES (ISO 4217) =====================

CREATE TABLE public.currencies (
  code     CHAR(3) PRIMARY KEY,
  name     TEXT NOT NULL,
  symbol   TEXT NOT NULL,
  active   BOOLEAN DEFAULT TRUE
);

INSERT INTO public.currencies (code, name, symbol) VALUES
  ('USD', 'US Dollar', '$'),
  ('CAD', 'Canadian Dollar', 'C$'),
  ('MXN', 'Mexican Peso', 'MX$'),
  ('GBP', 'British Pound', '£'),
  ('EUR', 'Euro', '€'),
  ('AUD', 'Australian Dollar', 'A$'),
  ('TRY', 'Turkish Lira', '₺'),
  ('BRL', 'Brazilian Real', 'R$'),
  ('AED', 'UAE Dirham', 'د.إ'),
  ('CNY', 'Chinese Yuan', '¥');


-- ===================== VEHICLE INSPECTIONS (Ghetto Pilot Prevention) =====================

CREATE TABLE public.vehicle_inspections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id      UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  vehicle_year     INTEGER,
  vehicle_make     TEXT,
  vehicle_model    TEXT,
  vehicle_type     TEXT,                            -- 'truck', 'suv', 'sedan', 'van'
  photo_front_url  TEXT,
  photo_rear_url   TEXT,
  photo_signage_url TEXT,
  photo_lights_url  TEXT,
  ai_score         NUMERIC(5,2) DEFAULT 0,          -- AI-analyzed professionalism score
  ai_flags         JSONB DEFAULT '{}',              -- {"sedan_detected":true,"missing_signage":true}
  status           vehicle_inspection_status DEFAULT 'unverified',
  inspected_at     TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  reviewer_notes   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicle_inspections_provider ON public.vehicle_inspections(provider_id);
CREATE INDEX idx_vehicle_inspections_status   ON public.vehicle_inspections(status);

COMMENT ON TABLE public.vehicle_inspections IS 'Verified Unicorn Badge system. AI + human review of pilot vehicle professionalism.';


-- ===================== ROUTE HAZARDS (Deflection, Soft Shoulders, Tip Strikes) =====================

CREATE TABLE public.route_hazards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hazard_type      TEXT NOT NULL,                   -- 'bridge_clearance', 'soft_shoulder', 'sharp_turn', 'urban_zigzag', 'rail_crossing'
  lat              NUMERIC(10,7) NOT NULL,
  lng              NUMERIC(10,7) NOT NULL,
  jurisdiction_id  UUID REFERENCES public.jurisdictions(id),
  mile_marker      TEXT,
  clearance_ft     NUMERIC(6,2),                    -- posted clearance (bridges)
  deflection_risk  BOOLEAN DEFAULT FALSE,           -- high pole deflection risk zone
  soft_shoulder_risk BOOLEAN DEFAULT FALSE,
  weather_sensitive BOOLEAN DEFAULT FALSE,          -- needs weather overlay check
  speed_advisory   INTEGER,                         -- recommended mph for this hazard
  description      TEXT,
  data_source      TEXT,                            -- 'nbi', 'crowdsourced', 'route_survey', 'dot'
  last_verified_at TIMESTAMPTZ,
  reported_by      UUID,                            -- user who reported it
  severity         TEXT DEFAULT 'medium',           -- 'low', 'medium', 'high', 'critical'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_route_hazards_type    ON public.route_hazards(hazard_type);
CREATE INDEX idx_route_hazards_geo     ON public.route_hazards(lat, lng);
CREATE INDEX idx_route_hazards_juris   ON public.route_hazards(jurisdiction_id);

COMMENT ON TABLE public.route_hazards IS 'Bridge clearances, soft shoulders, deflection zones, urban zigzag points. Crowdsourced + DOT.';


-- ===================== NO-GO FEE ESCROW =====================

CREATE TABLE public.nogo_escrow (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id    UUID REFERENCES public.assignments(id),
  provider_id      UUID NOT NULL REFERENCES public.providers(id),
  buyer_account_id UUID NOT NULL,
  fee_amount       NUMERIC(10,2) NOT NULL,
  currency_code    CHAR(3) DEFAULT 'USD' REFERENCES public.currencies(code),
  pre_authorized   BOOLEAN DEFAULT FALSE,
  gps_arrival_verified BOOLEAN DEFAULT FALSE,       -- provider arrived at pickup (GPS proof)
  arrival_lat      NUMERIC(10,7),
  arrival_lng      NUMERIC(10,7),
  arrival_at       TIMESTAMPTZ,
  cancellation_reason TEXT,
  released_at      TIMESTAMPTZ,                     -- when fee was released to provider
  status           TEXT DEFAULT 'held',              -- 'held', 'released', 'refunded', 'disputed'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nogo_escrow_provider ON public.nogo_escrow(provider_id);
CREATE INDEX idx_nogo_escrow_status   ON public.nogo_escrow(status);

COMMENT ON TABLE public.nogo_escrow IS 'Smart Contract Escrow for No-Go fees. GPS-verified arrival triggers auto-release on cancellation.';


-- ===================== ADDITIVE COLUMNS ON EXISTING TABLES =====================

-- Companies: international addressing
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS market_id       UUID REFERENCES public.markets(id);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address_line1   TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address_line2   TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS city            TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS state_province  TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS postal_code     TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS country_code    CHAR(2) DEFAULT 'US';

-- Leads: jurisdiction awareness + dual measurement
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS origin_jurisdiction_id UUID REFERENCES public.jurisdictions(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS dest_jurisdiction_id   UUID REFERENCES public.jurisdictions(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS measurement_system    measurement_system DEFAULT 'imperial';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS load_length_m         NUMERIC(8,2);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS load_width_m          NUMERIC(8,2);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS load_height_m         NUMERIC(8,2);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS load_weight_kg        NUMERIC(12,2);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS border_crossing_id    UUID REFERENCES public.border_crossings(id);

-- Offers + Assignments: currency support
ALTER TABLE public.offers      ADD COLUMN IF NOT EXISTS currency_code CHAR(3) DEFAULT 'USD';
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS currency_code CHAR(3) DEFAULT 'USD';

-- Providers: market + country awareness
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS market_id     UUID REFERENCES public.markets(id);
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS country_code  CHAR(2) DEFAULT 'US';
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS pilot_cert_tier pilot_certification_tier DEFAULT 'none';


-- ===================== RLS ON NEW TABLES =====================

ALTER TABLE public.markets              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurisdictions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurisdiction_rules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.border_crossings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inspections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_hazards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nogo_escrow          ENABLE ROW LEVEL SECURITY;

-- Public read for reference tables
CREATE POLICY "markets_public_read" ON public.markets FOR SELECT USING (TRUE);
CREATE POLICY "jurisdictions_public_read" ON public.jurisdictions FOR SELECT USING (TRUE);
CREATE POLICY "currencies_public_read" ON public.currencies FOR SELECT USING (TRUE);

-- Service role full access on new tables
CREATE POLICY "service_role_all_markets" ON public.markets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_jurisdictions" ON public.jurisdictions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_jurisdiction_rules" ON public.jurisdiction_rules FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_border_crossings" ON public.border_crossings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_vehicle_inspections" ON public.vehicle_inspections FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_route_hazards" ON public.route_hazards FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_nogo_escrow" ON public.nogo_escrow FOR ALL USING (auth.role() = 'service_role');


-- ===================== SEED: MARKETS =====================

INSERT INTO public.markets (code, name, tier, region, default_measurement, default_currency, permit_term, timezone_ref, activated_at) VALUES
  -- Tier 1: Live
  ('US', 'United States',  'live', 'north_america', 'imperial', 'USD', 'oversize_overweight', 'America/New_York', NOW()),
  ('CA', 'Canada',         'live', 'north_america', 'metric',   'CAD', 'oversize_overweight', 'America/Toronto', NOW()),
  -- Tier 2: Expansion
  ('MX', 'Mexico',         'expansion', 'north_america', 'metric', 'MXN', 'generic', 'America/Mexico_City', NULL),
  ('UK', 'United Kingdom', 'expansion', 'europe', 'metric', 'GBP', 'abnormal_load', 'Europe/London', NULL),
  ('AU', 'Australia',      'expansion', 'oceania', 'metric', 'AUD', 'excess_dimension', 'Australia/Sydney', NULL),
  ('EU', 'European Union', 'expansion', 'europe', 'metric', 'EUR', 'transport_exceptionnel', 'Europe/Berlin', NULL),
  ('TR', 'Turkey',         'expansion', 'europe', 'metric', 'TRY', 'generic', 'Europe/Istanbul', NULL),
  -- Tier 3: Infrastructure
  ('SA_REGION', 'South America',       'infrastructure', 'south_america', 'metric', 'BRL', 'generic', 'America/Sao_Paulo', NULL),
  ('AU_REGION', 'Australia/Oceania',   'infrastructure', 'oceania', 'metric', 'AUD', 'generic', 'Australia/Sydney', NULL),
  ('ME_REGION', 'Middle East/Africa',  'infrastructure', 'middle_east_africa', 'metric', 'AED', 'generic', 'Asia/Dubai', NULL),
  ('AP_REGION', 'Asia-Pacific',        'infrastructure', 'asia_pacific', 'metric', 'CNY', 'generic', 'Asia/Shanghai', NULL);


-- ===================== SEED: US JURISDICTIONS (50 States) =====================

DO $$
DECLARE
  us_market_id UUID;
BEGIN
  SELECT id INTO us_market_id FROM public.markets WHERE code = 'US';

  INSERT INTO public.jurisdictions (market_id, code, name, type, iso_3166_2, pilot_cert_tier, activated_at) VALUES
    (us_market_id, 'US-AL', 'Alabama',        'state_province', 'US-AL', 'state_certified', NOW()),
    (us_market_id, 'US-AK', 'Alaska',         'state_province', 'US-AK', 'state_certified', NOW()),
    (us_market_id, 'US-AZ', 'Arizona',        'state_province', 'US-AZ', 'state_certified', NOW()),
    (us_market_id, 'US-AR', 'Arkansas',       'state_province', 'US-AR', 'state_certified', NOW()),
    (us_market_id, 'US-CA', 'California',     'state_province', 'US-CA', 'state_certified', NOW()),
    (us_market_id, 'US-CO', 'Colorado',       'state_province', 'US-CO', 'state_certified', NOW()),
    (us_market_id, 'US-CT', 'Connecticut',    'state_province', 'US-CT', 'state_certified', NOW()),
    (us_market_id, 'US-DE', 'Delaware',       'state_province', 'US-DE', 'state_certified', NOW()),
    (us_market_id, 'US-FL', 'Florida',        'state_province', 'US-FL', 'state_certified', NOW()),
    (us_market_id, 'US-GA', 'Georgia',        'state_province', 'US-GA', 'state_certified', NOW()),
    (us_market_id, 'US-HI', 'Hawaii',         'state_province', 'US-HI', 'state_certified', NOW()),
    (us_market_id, 'US-ID', 'Idaho',          'state_province', 'US-ID', 'state_certified', NOW()),
    (us_market_id, 'US-IL', 'Illinois',       'state_province', 'US-IL', 'state_certified', NOW()),
    (us_market_id, 'US-IN', 'Indiana',        'state_province', 'US-IN', 'state_certified', NOW()),
    (us_market_id, 'US-IA', 'Iowa',           'state_province', 'US-IA', 'state_certified', NOW()),
    (us_market_id, 'US-KS', 'Kansas',         'state_province', 'US-KS', 'state_certified', NOW()),
    (us_market_id, 'US-KY', 'Kentucky',       'state_province', 'US-KY', 'state_certified', NOW()),
    (us_market_id, 'US-LA', 'Louisiana',      'state_province', 'US-LA', 'state_certified', NOW()),
    (us_market_id, 'US-ME', 'Maine',          'state_province', 'US-ME', 'state_certified', NOW()),
    (us_market_id, 'US-MD', 'Maryland',       'state_province', 'US-MD', 'state_certified', NOW()),
    (us_market_id, 'US-MA', 'Massachusetts',  'state_province', 'US-MA', 'state_certified', NOW()),
    (us_market_id, 'US-MI', 'Michigan',       'state_province', 'US-MI', 'state_certified', NOW()),
    (us_market_id, 'US-MN', 'Minnesota',      'state_province', 'US-MN', 'state_certified', NOW()),
    (us_market_id, 'US-MS', 'Mississippi',    'state_province', 'US-MS', 'state_certified', NOW()),
    (us_market_id, 'US-MO', 'Missouri',       'state_province', 'US-MO', 'state_certified', NOW()),
    (us_market_id, 'US-MT', 'Montana',        'state_province', 'US-MT', 'state_certified', NOW()),
    (us_market_id, 'US-NE', 'Nebraska',       'state_province', 'US-NE', 'state_certified', NOW()),
    (us_market_id, 'US-NV', 'Nevada',         'state_province', 'US-NV', 'state_certified', NOW()),
    (us_market_id, 'US-NH', 'New Hampshire',  'state_province', 'US-NH', 'state_certified', NOW()),
    (us_market_id, 'US-NJ', 'New Jersey',     'state_province', 'US-NJ', 'state_certified', NOW()),
    (us_market_id, 'US-NM', 'New Mexico',     'state_province', 'US-NM', 'state_certified', NOW()),
    (us_market_id, 'US-NY', 'New York',       'state_province', 'US-NY', 'state_certified', NOW()),
    (us_market_id, 'US-NC', 'North Carolina', 'state_province', 'US-NC', 'state_certified', NOW()),
    (us_market_id, 'US-ND', 'North Dakota',   'state_province', 'US-ND', 'state_certified', NOW()),
    (us_market_id, 'US-OH', 'Ohio',           'state_province', 'US-OH', 'state_certified', NOW()),
    (us_market_id, 'US-OK', 'Oklahoma',       'state_province', 'US-OK', 'state_certified', NOW()),
    (us_market_id, 'US-OR', 'Oregon',         'state_province', 'US-OR', 'state_certified', NOW()),
    (us_market_id, 'US-PA', 'Pennsylvania',   'state_province', 'US-PA', 'state_certified', NOW()),
    (us_market_id, 'US-RI', 'Rhode Island',   'state_province', 'US-RI', 'state_certified', NOW()),
    (us_market_id, 'US-SC', 'South Carolina', 'state_province', 'US-SC', 'state_certified', NOW()),
    (us_market_id, 'US-SD', 'South Dakota',   'state_province', 'US-SD', 'state_certified', NOW()),
    (us_market_id, 'US-TN', 'Tennessee',      'state_province', 'US-TN', 'state_certified', NOW()),
    (us_market_id, 'US-TX', 'Texas',          'state_province', 'US-TX', 'state_certified', NOW()),
    (us_market_id, 'US-UT', 'Utah',           'state_province', 'US-UT', 'state_certified', NOW()),
    (us_market_id, 'US-VT', 'Vermont',        'state_province', 'US-VT', 'state_certified', NOW()),
    (us_market_id, 'US-VA', 'Virginia',       'state_province', 'US-VA', 'state_certified', NOW()),
    (us_market_id, 'US-WA', 'Washington',     'state_province', 'US-WA', 'state_certified', NOW()),
    (us_market_id, 'US-WV', 'West Virginia',  'state_province', 'US-WV', 'state_certified', NOW()),
    (us_market_id, 'US-WI', 'Wisconsin',      'state_province', 'US-WI', 'state_certified', NOW()),
    (us_market_id, 'US-WY', 'Wyoming',        'state_province', 'US-WY', 'state_certified', NOW());
END $$;


-- ===================== SEED: CANADA JURISDICTIONS (13 Provinces/Territories) =====================

DO $$
DECLARE
  ca_market_id UUID;
BEGIN
  SELECT id INTO ca_market_id FROM public.markets WHERE code = 'CA';

  INSERT INTO public.jurisdictions (market_id, code, name, type, iso_3166_2, pilot_cert_tier, activated_at) VALUES
    (ca_market_id, 'CA-AB', 'Alberta',                   'state_province', 'CA-AB', 'state_certified', NOW()),
    (ca_market_id, 'CA-BC', 'British Columbia',           'state_province', 'CA-BC', 'state_certified', NOW()),
    (ca_market_id, 'CA-MB', 'Manitoba',                   'state_province', 'CA-MB', 'state_certified', NOW()),
    (ca_market_id, 'CA-NB', 'New Brunswick',              'state_province', 'CA-NB', 'state_certified', NOW()),
    (ca_market_id, 'CA-NL', 'Newfoundland and Labrador',  'state_province', 'CA-NL', 'state_certified', NOW()),
    (ca_market_id, 'CA-NT', 'Northwest Territories',      'state_province', 'CA-NT', 'state_certified', NOW()),
    (ca_market_id, 'CA-NS', 'Nova Scotia',                'state_province', 'CA-NS', 'state_certified', NOW()),
    (ca_market_id, 'CA-NU', 'Nunavut',                    'state_province', 'CA-NU', 'state_certified', NOW()),
    (ca_market_id, 'CA-ON', 'Ontario',                    'state_province', 'CA-ON', 'state_certified', NOW()),
    (ca_market_id, 'CA-PE', 'Prince Edward Island',       'state_province', 'CA-PE', 'state_certified', NOW()),
    (ca_market_id, 'CA-QC', 'Quebec',                     'state_province', 'CA-QC', 'state_certified', NOW()),
    (ca_market_id, 'CA-SK', 'Saskatchewan',               'state_province', 'CA-SK', 'state_certified', NOW()),
    (ca_market_id, 'CA-YT', 'Yukon',                      'state_province', 'CA-YT', 'state_certified', NOW());
END $$;


-- ===================== SEED: EXPANSION JURISDICTIONS =====================

-- Mexico
DO $$
DECLARE
  mx_market_id UUID;
BEGIN
  SELECT id INTO mx_market_id FROM public.markets WHERE code = 'MX';

  INSERT INTO public.jurisdictions (market_id, code, name, type, iso_3166_2, notes) VALUES
    (mx_market_id, 'MX-BCN', 'Baja California',      'state_province', 'MX-BCN', 'Key border crossing with US-CA'),
    (mx_market_id, 'MX-SON', 'Sonora',                'state_province', 'MX-SON', 'Nogales corridor to US-AZ'),
    (mx_market_id, 'MX-CHH', 'Chihuahua',             'state_province', 'MX-CHH', 'Juárez corridor to US-TX'),
    (mx_market_id, 'MX-TAM', 'Tamaulipas',            'state_province', 'MX-TAM', 'Laredo/McAllen corridor to US-TX'),
    (mx_market_id, 'MX-NLE', 'Nuevo León',            'state_province', 'MX-NLE', 'Monterrey industrial hub');
END $$;

-- United Kingdom
DO $$
DECLARE
  uk_market_id UUID;
BEGIN
  SELECT id INTO uk_market_id FROM public.markets WHERE code = 'UK';

  INSERT INTO public.jurisdictions (market_id, code, name, type, pilot_cert_tier, notes) VALUES
    (uk_market_id, 'UK-ENG', 'England',         'state_province', 'city_guilds', 'VR1 permits, Special Orders for widths >6.1m'),
    (uk_market_id, 'UK-SCT', 'Scotland',        'state_province', 'city_guilds', 'Transport Scotland authority'),
    (uk_market_id, 'UK-WLS', 'Wales',           'state_province', 'city_guilds', 'Welsh trunk road network'),
    (uk_market_id, 'UK-NIR', 'Northern Ireland', 'state_province', 'city_guilds', 'Separate regulatory body (DfI)');
END $$;

-- Australia
DO $$
DECLARE
  au_market_id UUID;
BEGIN
  SELECT id INTO au_market_id FROM public.markets WHERE code = 'AU';

  INSERT INTO public.jurisdictions (market_id, code, name, type, pilot_cert_tier, has_curfew, curfew_rules, notes) VALUES
    (au_market_id, 'AU-NSW', 'New South Wales',    'state_province', 'level_2', TRUE,
      '{"type":"night_only","start":"23:00","end":"05:00","applies_to":"oversize_over_5m_wide"}',
      'Strictest curfew rules. Two-tier pilot system. RMS authority.'),
    (au_market_id, 'AU-QLD', 'Queensland',         'state_province', 'level_2', TRUE,
      '{"type":"restricted_hours","restricted":"06:30-09:00,15:30-18:30","applies_to":"oversize"}',
      'TMR authority. Mining corridor heavy traffic.'),
    (au_market_id, 'AU-WA',  'Western Australia',  'state_province', 'level_1', FALSE, '{}',
      'Main Roads WA. Mining/resource transport hub. Road train country.'),
    (au_market_id, 'AU-VIC', 'Victoria',           'state_province', 'level_2', TRUE,
      '{"type":"daytime_only","start":"09:30","end":"15:30","applies_to":"class_1_oversize"}',
      'VicRoads authority. Dense urban corridors around Melbourne.');
END $$;

-- EU Key Member States
DO $$
DECLARE
  eu_market_id UUID;
BEGIN
  SELECT id INTO eu_market_id FROM public.markets WHERE code = 'EU';

  INSERT INTO public.jurisdictions (market_id, code, name, type, iso_3166_2, notes) VALUES
    (eu_market_id, 'EU-DE', 'Germany',         'state_province', 'DE', 'Schwertransport. BASt authority. Autobahn-specific rules.'),
    (eu_market_id, 'EU-FR', 'France',          'state_province', 'FR', 'Transport Exceptionnel. Prefecture-based permits.'),
    (eu_market_id, 'EU-NL', 'Netherlands',     'state_province', 'NL', 'RDW authority. Port of Rotterdam heavy haul hub.'),
    (eu_market_id, 'EU-BE', 'Belgium',         'state_province', 'BE', 'Key transit country. Flemish/Walloon split regulations.'),
    (eu_market_id, 'EU-IT', 'Italy',           'state_province', 'IT', 'Trasporto Eccezionale. ANAS authority.');
END $$;


-- ===================== SEED: BORDER CROSSINGS =====================

DO $$
DECLARE
  us_tx UUID; mx_tam UUID; us_ca UUID; mx_bcn UUID;
  us_az UUID; mx_son UUID; us_mi UUID; ca_on UUID;
  us_ny UUID; us_wa UUID; ca_bc UUID; us_nd UUID; ca_mb UUID;
BEGIN
  SELECT id INTO us_tx  FROM public.jurisdictions WHERE code = 'US-TX';
  SELECT id INTO mx_tam FROM public.jurisdictions WHERE code = 'MX-TAM';
  SELECT id INTO us_ca  FROM public.jurisdictions WHERE code = 'US-CA';
  SELECT id INTO mx_bcn FROM public.jurisdictions WHERE code = 'MX-BCN';
  SELECT id INTO us_az  FROM public.jurisdictions WHERE code = 'US-AZ';
  SELECT id INTO mx_son FROM public.jurisdictions WHERE code = 'MX-SON';
  SELECT id INTO us_mi  FROM public.jurisdictions WHERE code = 'US-MI';
  SELECT id INTO ca_on  FROM public.jurisdictions WHERE code = 'CA-ON';
  SELECT id INTO us_ny  FROM public.jurisdictions WHERE code = 'US-NY';
  SELECT id INTO us_wa  FROM public.jurisdictions WHERE code = 'US-WA';
  SELECT id INTO ca_bc  FROM public.jurisdictions WHERE code = 'CA-BC';
  SELECT id INTO us_nd  FROM public.jurisdictions WHERE code = 'US-ND';
  SELECT id INTO ca_mb  FROM public.jurisdictions WHERE code = 'CA-MB';

  INSERT INTO public.border_crossings (name, from_jurisdiction_id, to_jurisdiction_id, lat, lng, customs_required, customs_broker_required, drayage_transfer_required, pre_clearance_hours, oversize_restrictions) VALUES
    -- US ↔ Mexico
    ('Laredo–Nuevo Laredo',          us_tx, mx_tam, 27.5036, -99.5075, TRUE, TRUE, TRUE, 72,
      '{"max_width_ft":16, "night_crossing":false, "escort_required":true}'),
    ('Otay Mesa–Tijuana',            us_ca, mx_bcn, 32.5535, -116.9715, TRUE, TRUE, TRUE, 72,
      '{"max_width_ft":14, "commercial_only":true}'),
    ('Nogales–Nogales',              us_az, mx_son, 31.3345, -110.9378, TRUE, TRUE, FALSE, 48,
      '{"max_width_ft":14}'),
    -- US ↔ Canada
    ('Ambassador Bridge (Detroit–Windsor)', us_mi, ca_on, 42.3125, -83.0764, TRUE, FALSE, FALSE, 24,
      '{"max_weight_lb":160000, "height_restricted":true}'),
    ('Peace Bridge (Buffalo–Fort Erie)',    us_ny, ca_on, 42.9064, -78.9047, TRUE, FALSE, FALSE, 24, '{}'),
    ('Pacific Highway (Blaine–Surrey)',     us_wa, ca_bc, 49.0024, -122.7572, TRUE, FALSE, FALSE, 24, '{}'),
    ('Pembina–Emerson',                     us_nd, ca_mb, 48.9987, -97.2315, TRUE, FALSE, FALSE, 24,
      '{"agriculture_inspection":true}');
END $$;


-- ===================== UPDATED_AT TRIGGERS ON NEW TABLES =====================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'markets', 'jurisdictions', 'border_crossings',
      'vehicle_inspections', 'route_hazards'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;


-- ============================================================================
-- END GLOBAL MARKETS MIGRATION
-- ============================================================================
