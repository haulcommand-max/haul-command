-- PART 1: Schema changes only (fast) 
-- Run separately from data operations

-- Add provenance fields to directory_listings
ALTER TABLE directory_listings
  ADD COLUMN IF NOT EXISTS trust_classification text DEFAULT 'fake_synthetic_generated',
  ADD COLUMN IF NOT EXISTS source_system text,
  ADD COLUMN IF NOT EXISTS quarantined_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS quarantine_reason text DEFAULT 'seeded_from_synthetic_pipeline';

-- All existing rows get default = 'fake_synthetic_generated' from the column default
-- New rows inserted from here forward need explicit classification

CREATE INDEX IF NOT EXISTS idx_dl_trust_classification
  ON directory_listings (trust_classification);

-- Add quarantine field to search_documents
ALTER TABLE search_documents
  ADD COLUMN IF NOT EXISTS is_quarantined boolean DEFAULT true;

-- Create the canonical real operator table
CREATE TABLE IF NOT EXISTS hc_real_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  slug text UNIQUE,
  entity_type text NOT NULL,
  phone text,
  phone_e164 text,
  email text,
  website text,
  city text,
  state_code char(2),
  country_code char(2) NOT NULL DEFAULT 'US',
  source_system text NOT NULL,
  source_table text NOT NULL,
  source_id text,
  imported_at timestamptz NOT NULL DEFAULT now(),
  trust_classification text NOT NULL DEFAULT 'likely_real_unverified',
  evidence_score numeric(4,2),
  trust_score numeric(4,2),
  is_public boolean NOT NULL DEFAULT true,
  claim_status text NOT NULL DEFAULT 'unclaimed',
  claimed_by_user_id uuid,
  claimed_at timestamptz,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hro_country ON hc_real_operators (country_code);
CREATE INDEX IF NOT EXISTS idx_hro_state ON hc_real_operators (state_code);
CREATE INDEX IF NOT EXISTS idx_hro_entity_type ON hc_real_operators (entity_type);
CREATE INDEX IF NOT EXISTS idx_hro_trust ON hc_real_operators (trust_classification);
CREATE INDEX IF NOT EXISTS idx_hro_public ON hc_real_operators (is_public);
CREATE INDEX IF NOT EXISTS idx_hro_source ON hc_real_operators (source_system);

-- RLS
ALTER TABLE hc_real_operators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read real operators" ON hc_real_operators;
CREATE POLICY "Public read real operators"
  ON hc_real_operators FOR SELECT
  USING (
    is_public = true
    AND trust_classification NOT IN ('fake_synthetic_generated', 'test_seed_demo_fixture')
  );

DROP POLICY IF EXISTS "Service role full access" ON hc_real_operators;
CREATE POLICY "Service role full access"
  ON hc_real_operators FOR ALL
  USING (auth.role() = 'service_role');
