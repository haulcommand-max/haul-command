-- ══════════════════════════════════════════════════════════════
-- Haul Command — WLS Regulation Data Schema
-- Migration: hc_jurisdiction_regulations + related tables
-- Source: WideLoadShipping.com competitive extraction
-- ══════════════════════════════════════════════════════════════

-- 1. Core regulation facts per jurisdiction
CREATE TABLE IF NOT EXISTS hc_jurisdiction_regulations (
  id BIGSERIAL PRIMARY KEY,
  country_code TEXT NOT NULL,            -- 'US', 'CA', etc.
  admin1_code TEXT NOT NULL,             -- 'TX', 'ON', etc.
  admin1_name TEXT NOT NULL,             -- 'Texas', 'Ontario'
  max_length_ft NUMERIC,                 -- legal max without permit
  max_width_ft NUMERIC,
  max_height_ft NUMERIC,
  max_weight_lbs INTEGER,
  max_overhang_rear_ft NUMERIC,
  max_overhang_front_ft NUMERIC,
  superload_threshold_lbs INTEGER,       -- max WITH permit
  superload_threshold_width_ft NUMERIC,
  superload_threshold_height_ft NUMERIC,
  superload_threshold_length_ft NUMERIC,
  permit_source_url TEXT,
  dot_agency_name TEXT,
  dot_phone TEXT,
  dot_website TEXT,
  source TEXT DEFAULT 'wls',
  source_url TEXT,
  confidence_score NUMERIC DEFAULT 0.7,
  raw_text TEXT,
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_code, admin1_code)
);

-- 2. Permit cost rules per jurisdiction + type
CREATE TABLE IF NOT EXISTS hc_permit_cost_rules (
  id BIGSERIAL PRIMARY KEY,
  jurisdiction_id BIGINT REFERENCES hc_jurisdiction_regulations(id) ON DELETE CASCADE,
  permit_type TEXT NOT NULL,             -- 'oversize_single_trip', 'annual', '30_day', etc.
  weight_min_lbs INTEGER,
  weight_max_lbs INTEGER,
  base_cost_usd NUMERIC,
  additional_fees JSONB,                 -- county fees, highway maintenance, etc.
  validity_days INTEGER,
  notes TEXT,
  source TEXT DEFAULT 'wls',
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Travel time restrictions per jurisdiction
CREATE TABLE IF NOT EXISTS hc_travel_restrictions (
  id BIGSERIAL PRIMARY KEY,
  jurisdiction_id BIGINT REFERENCES hc_jurisdiction_regulations(id) ON DELETE CASCADE,
  restriction_type TEXT NOT NULL,        -- 'daylight_only', 'holiday_blackout', 'curfew', 'weekend'
  applies_when TEXT,                     -- 'oversize', 'overweight', 'superload', 'all'
  dimension_threshold JSONB,             -- {"width_ft": 14, "length_ft": 110}
  time_window_start TEXT,
  time_window_end TEXT,
  blackout_dates TEXT[],
  curfew_zones TEXT,
  description TEXT,
  source TEXT DEFAULT 'wls',
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pilot car certification requirements per jurisdiction
CREATE TABLE IF NOT EXISTS hc_certification_requirements (
  id BIGSERIAL PRIMARY KEY,
  country_code TEXT NOT NULL DEFAULT 'US',
  admin1_code TEXT NOT NULL,
  admin1_name TEXT NOT NULL,
  requires_certification BOOLEAN DEFAULT FALSE,
  min_age INTEGER,
  certification_name TEXT,
  training_hours INTEGER,
  training_provider TEXT,
  training_urls TEXT[],
  application_urls TEXT[],
  certification_cost_usd NUMERIC,
  renewal_period_years INTEGER,
  insurance_min_usd INTEGER,
  reciprocity_states TEXT[],             -- state codes whose certs are accepted
  special_notes TEXT,
  source TEXT DEFAULT 'wls',
  confidence_score NUMERIC DEFAULT 0.7,
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_code, admin1_code)
);

-- 5. Signage and marking requirements
CREATE TABLE IF NOT EXISTS hc_signage_requirements (
  id BIGSERIAL PRIMARY KEY,
  jurisdiction_id BIGINT REFERENCES hc_jurisdiction_regulations(id) ON DELETE CASCADE,
  headlights_required BOOLEAN DEFAULT TRUE,
  flag_size_inches INTEGER DEFAULT 16,
  sign_min_width_ft INTEGER DEFAULT 5,
  sign_max_width_ft INTEGER DEFAULT 7,
  sign_letter_height_inches INTEGER DEFAULT 8,
  sign_text TEXT DEFAULT 'OVERSIZE LOAD',
  strobe_light_required BOOLEAN DEFAULT FALSE,
  strobe_light_min_size_inches INTEGER,
  rear_lights_required_overhang_ft NUMERIC DEFAULT 4,
  notes TEXT,
  source TEXT DEFAULT 'wls',
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Frost law records
CREATE TABLE IF NOT EXISTS hc_frost_laws (
  id BIGSERIAL PRIMARY KEY,
  country_code TEXT NOT NULL DEFAULT 'US',
  admin1_code TEXT NOT NULL,
  admin1_name TEXT NOT NULL,
  has_frost_law BOOLEAN DEFAULT FALSE,
  typical_start_month INTEGER,           -- 2 = February
  typical_end_month INTEGER,             -- 5 = May
  weight_reduction_pct NUMERIC,
  affected_road_types TEXT[],            -- ['secondary', 'county', 'township']
  current_year_active BOOLEAN,
  current_year_start_date DATE,
  current_year_end_date DATE,
  notes TEXT,
  source TEXT DEFAULT 'wls',
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_code, admin1_code)
);

-- 7. Content freshness tracking
CREATE TABLE IF NOT EXISTS hc_content_freshness (
  id BIGSERIAL PRIMARY KEY,
  page_path TEXT UNIQUE NOT NULL,
  content_type TEXT NOT NULL,            -- 'regulation', 'certification', 'frost_law', etc.
  jurisdiction_code TEXT,
  last_verified_at TIMESTAMPTZ,
  last_changed_at TIMESTAMPTZ,
  change_description TEXT,
  next_review_due TIMESTAMPTZ,
  confidence_score NUMERIC DEFAULT 0.7,
  auto_refreshable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- Indexes for query performance
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_jurisdiction_country_admin1
  ON hc_jurisdiction_regulations(country_code, admin1_code);

CREATE INDEX IF NOT EXISTS idx_permit_costs_jurisdiction
  ON hc_permit_cost_rules(jurisdiction_id);

CREATE INDEX IF NOT EXISTS idx_travel_restrictions_jurisdiction
  ON hc_travel_restrictions(jurisdiction_id);

CREATE INDEX IF NOT EXISTS idx_certification_admin1
  ON hc_certification_requirements(country_code, admin1_code);

CREATE INDEX IF NOT EXISTS idx_frost_laws_admin1
  ON hc_frost_laws(country_code, admin1_code);

CREATE INDEX IF NOT EXISTS idx_content_freshness_path
  ON hc_content_freshness(page_path);

-- ══════════════════════════════════════════════════════════════
-- RLS policies (public read, service role write)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE hc_jurisdiction_regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_permit_cost_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_travel_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_certification_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_signage_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_frost_laws ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_content_freshness ENABLE ROW LEVEL SECURITY;

-- Public read access for all regulation tables
CREATE POLICY IF NOT EXISTS "Public read jurisdiction_regulations"
  ON hc_jurisdiction_regulations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read permit_cost_rules"
  ON hc_permit_cost_rules FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read travel_restrictions"
  ON hc_travel_restrictions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read certification_requirements"
  ON hc_certification_requirements FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read signage_requirements"
  ON hc_signage_requirements FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read frost_laws"
  ON hc_frost_laws FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read content_freshness"
  ON hc_content_freshness FOR SELECT USING (true);
