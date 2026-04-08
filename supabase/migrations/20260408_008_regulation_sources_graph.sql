-- ============================================================
-- DIESEL BLOOD USA — Regulation Sources Graph
-- Objective: Extend the rule/regulation system to store specific source links
--            and track explicit compliance properties natively.
-- ============================================================

CREATE TABLE IF NOT EXISTS country_ingest_queue (
  country_code CHAR(2) PRIMARY KEY,
  country_name TEXT NOT NULL,
  tier TEXT,
  crawl_priority INT,
  search_status TEXT DEFAULT 'not_started',
  coverage_status TEXT DEFAULT 'seeded_from_user_tier_map',
  last_crawled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enables mapping between raw source URLs and explicit rule threshold data
CREATE TABLE IF NOT EXISTS regulation_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_key TEXT UNIQUE, -- e.g. 'HC-001'
  country_code CHAR(2) NOT NULL REFERENCES country_ingest_queue(country_code),
  country_name TEXT NOT NULL,
  state_province TEXT,
  city_region TEXT,
  jurisdiction_level TEXT NOT NULL, -- 'national', 'state', 'province', 'region', 'federal'
  source_type TEXT NOT NULL, -- 'official_training_workbook', 'official_permit_manual', etc.
  source_title TEXT NOT NULL,
  authority_name TEXT NOT NULL,
  year_stated TEXT,
  official_status TEXT, -- 'official', 'non-official'
  training_value_score INT,
  language_code TEXT,
  url TEXT NOT NULL,
  notes TEXT,

  -- Computed/Extracted specific compliance objects that power deterministic linking
  permit_thresholds JSONB,
  escort_thresholds JSONB,
  training_or_certification_required BOOLEAN,
  warning_vehicle_count INT,
  vehicle_marking_rules JSONB,
  authority_notification_required BOOLEAN,
  fees_and_charges JSONB,
  route_restrictions JSONB,
  forms_and_portal_links JSONB,
  effective_date DATE,
  jurisdiction_scope TEXT,
  raw_source_excerpt TEXT,
  source_confidence TEXT, -- 'verified_current', 'seeded_needs_review', etc.
  last_verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reg_sources_country ON regulation_sources(country_code);
CREATE INDEX IF NOT EXISTS idx_reg_sources_state ON regulation_sources(state_province);
CREATE INDEX IF NOT EXISTS idx_reg_sources_type ON regulation_sources(source_type);

-- RLS
ALTER TABLE country_ingest_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "country_ingest_queue: public read" ON country_ingest_queue FOR SELECT USING (true);

ALTER TABLE regulation_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regulation_sources: public read" ON regulation_sources FOR SELECT USING (true);

-- Auto-update timestamp triggers
CREATE OR REPLACE FUNCTION update_reg_sources_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER country_ingest_queue_updated_at
  BEFORE UPDATE ON country_ingest_queue
  FOR EACH ROW EXECUTE FUNCTION update_reg_sources_timestamp();

CREATE TRIGGER regulation_sources_updated_at
  BEFORE UPDATE ON regulation_sources
  FOR EACH ROW EXECUTE FUNCTION update_reg_sources_timestamp();
