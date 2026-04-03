-- Legal Freshness OS — Database Schema
-- Tracks confidence states for all legal/regulatory content

CREATE TABLE IF NOT EXISTS legal_freshness (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  region TEXT,
  confidence TEXT NOT NULL DEFAULT 'seeded_needs_human_review'
    CHECK (confidence IN ('verified_current','verified_but_review_due','partially_verified','seeded_needs_human_review','historical_reference_only')),
  last_verified_at TIMESTAMPTZ,
  last_verified_by TEXT,
  official_source_url TEXT,
  official_source_name TEXT,
  review_cadence_days INTEGER DEFAULT 90,
  next_review_due TIMESTAMPTZ,
  known_facts TEXT[] DEFAULT '{}',
  unknown_gaps TEXT[] DEFAULT '{}',
  what_to_do_next TEXT DEFAULT 'Contact local authorities for current requirements.',
  fallback_copy TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_legal_freshness_country ON legal_freshness(country_code);
CREATE INDEX IF NOT EXISTS idx_legal_freshness_confidence ON legal_freshness(confidence);
CREATE INDEX IF NOT EXISTS idx_legal_freshness_review_due ON legal_freshness(next_review_due) WHERE next_review_due IS NOT NULL;

ALTER TABLE legal_freshness ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON legal_freshness FOR ALL USING (true) WITH CHECK (true);
