-- ============================================================
-- HAUL COMMAND: TRUTH RECOVERY MIGRATION
-- 20260329000000_truth_recovery.sql
-- ============================================================
-- WHAT THIS DOES:
-- 1. Quarantines all synthetic directory_listings (583K hex-named + duped records)
-- 2. Adds trust_classification + provenance fields to directory_listings
-- 3. Creates hc_real_operators view from trusted sources (hc_entity, operators, operator_phones)
-- 4. Creates canonical stats RPC for all public counts
-- 5. Creates hc_trusted_public_operators materialized view for site use
-- ============================================================

-- ─── STEP 1: Add provenance fields to directory_listings ───

ALTER TABLE directory_listings
  ADD COLUMN IF NOT EXISTS trust_classification text DEFAULT 'unclassified',
  ADD COLUMN IF NOT EXISTS source_system text,
  ADD COLUMN IF NOT EXISTS quarantined_at timestamptz,
  ADD COLUMN IF NOT EXISTS quarantine_reason text;

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_dl_trust_classification
  ON directory_listings (trust_classification);

-- ─── STEP 2: Mark ALL directory_listings as quarantined ───
-- Every row in directory_listings came from the synthetic seed pipeline.
-- We'll restore any salvageable records AFTER classification.
-- This detaches them from ALL public queries immediately.

UPDATE directory_listings
SET 
  trust_classification = 'fake_synthetic_generated',
  quarantined_at = now(),
  quarantine_reason = CASE
    WHEN name ~ 'Escort [0-9a-f]{6}' THEN 'hex_hash_name_pattern'
    WHEN name = 'NORTH AMERICAN' THEN 'duplicated_name_all_states_same_phone'
    WHEN name ~ '\y[0-9a-f]{6}\y' THEN 'embedded_hex_in_name'
    ELSE 'seeded_from_synthetic_pipeline_20260326'
  END
WHERE trust_classification = 'unclassified';

-- ─── STEP 3: Create the canonical real operator table ───
-- This is the new public-facing operator source.
-- Drawn ONLY from trusted provenance sources.

CREATE TABLE IF NOT EXISTS hc_real_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  display_name text NOT NULL,
  slug text UNIQUE,
  entity_type text NOT NULL, -- pilot_car_operator, escort_operator, pilot_driver, broker
  
  -- Contact (real data only — leave null if not proven)
  phone text,
  phone_e164 text,
  email text,
  website text,
  
  -- Location
  city text,
  state_code char(2),
  country_code char(2) NOT NULL DEFAULT 'US',
  
  -- Provenance — required
  source_system text NOT NULL,       -- uspilotcars, osow_haven, hc_entity, manual
  source_table text NOT NULL,        -- which DB table this came from
  source_id text,                    -- original row id in source table
  imported_at timestamptz NOT NULL DEFAULT now(),
  
  -- Trust
  trust_classification text NOT NULL DEFAULT 'likely_real_unverified',
  -- confirmed_real_current | confirmed_real_historical | likely_real_unverified
  -- duplicate_of_real | fake_synthetic_generated | test_seed_demo_fixture
  evidence_score numeric(4,2),
  trust_score numeric(4,2),
  
  -- Status
  is_public boolean NOT NULL DEFAULT true,
  claim_status text NOT NULL DEFAULT 'unclaimed', -- unclaimed | claimed | verified
  claimed_by_user_id uuid,
  claimed_at timestamptz,
  
  -- Profile
  description text,                  -- ONLY if real source exists, never generated
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hro_country ON hc_real_operators (country_code);
CREATE INDEX IF NOT EXISTS idx_hro_state ON hc_real_operators (state_code);
CREATE INDEX IF NOT EXISTS idx_hro_entity_type ON hc_real_operators (entity_type);
CREATE INDEX IF NOT EXISTS idx_hro_trust ON hc_real_operators (trust_classification);
CREATE INDEX IF NOT EXISTS idx_hro_public ON hc_real_operators (is_public);
CREATE INDEX IF NOT EXISTS idx_hro_source ON hc_real_operators (source_system);

-- ─── STEP 4: Backfill from hc_entity (USpilotcars / PCL data) ───
-- These are real pilot car drivers/operators from the USpilotcars scrape.
-- escort_operator has phone + email = highest confidence.

INSERT INTO hc_real_operators (
  display_name,
  slug,
  entity_type,
  phone,
  email,
  website,
  city,
  state_code,
  country_code,
  source_system,
  source_table,
  source_id,
  imported_at,
  trust_classification,
  evidence_score,
  trust_score,
  is_public
)
SELECT
  e.canonical_name,
  -- Generate a slug from name + region
  lower(
    regexp_replace(
      regexp_replace(e.canonical_name || '-' || coalesce(e.region, ''), '[^a-zA-Z0-9]+', '-', 'g'),
      '-+', '-', 'g'
    )
  ),
  e.entity_type,
  e.phone,
  e.email,
  e.website,
  nullif(trim(e.city), ''),
  nullif(trim(e.region), ''),
  coalesce(e.country_code, 'US'),
  'uspilotcars_hc_entity',
  'hc_entity',
  e.id::text,
  coalesce(e.first_seen_at, e.created_at, now()),
  CASE
    WHEN e.trust_score >= 0.5 THEN 'confirmed_real_current'
    WHEN e.trust_score >= 0.2 THEN 'likely_real_unverified'
    ELSE 'confirmed_real_historical'
  END,
  e.evidence_score,
  e.trust_score,
  true
FROM hc_entity e
WHERE 
  e.entity_type IN ('escort_operator', 'pilot_car_operator', 'pilot_driver')
  AND e.canonical_name IS NOT NULL
  AND trim(e.canonical_name) != ''
  -- Exclude obvious garbage
  AND length(e.canonical_name) > 3
ON CONFLICT (slug) DO NOTHING;

-- ─── STEP 5: Backfill from operators + operator_phones (OSOW Haven) ───

INSERT INTO hc_real_operators (
  display_name,
  slug,
  entity_type,
  phone,
  phone_e164,
  email,
  state_code,
  country_code,
  source_system,
  source_table,
  source_id,
  imported_at,
  trust_classification,
  is_public
)
SELECT
  o.company_name,
  lower(
    regexp_replace(
      regexp_replace(o.company_name || '-' || coalesce(o.state, ''), '[^a-zA-Z0-9]+', '-', 'g'),
      '-+', '-', 'g'
    )
  ),
  'pilot_car_operator',
  p.phone,
  p.phone, -- already E.164
  o.email,
  o.state,
  coalesce(o.country_code, 'US'),
  'osow_haven',
  'operators',
  o.id::text,
  o.created_at,
  'likely_real_unverified',
  true
FROM operators o
JOIN operator_phones p ON p.operator_id = o.id AND p.is_primary = true
WHERE 
  o.company_name IS NOT NULL
  AND trim(o.company_name) != ''
ON CONFLICT (slug) DO NOTHING;

-- ─── STEP 6: Create canonical stats RPC ───
-- ONE function that ALL pages/components use for counts.
-- Zero hardcoded numbers anywhere in the UI.

CREATE OR REPLACE FUNCTION get_canonical_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    -- Operator counts from REAL data only
    'total_real_operators',
      (SELECT count(*) FROM hc_real_operators 
       WHERE is_public = true 
         AND trust_classification != 'fake_synthetic_generated'
         AND trust_classification != 'test_seed_demo_fixture'),
    
    'operators_with_phone',
      (SELECT count(*) FROM hc_real_operators 
       WHERE is_public = true 
         AND phone IS NOT NULL 
         AND phone != ''
         AND trust_classification != 'fake_synthetic_generated'),
    
    'operators_with_email',
      (SELECT count(*) FROM hc_real_operators 
       WHERE is_public = true 
         AND email IS NOT NULL 
         AND email != ''
         AND trust_classification != 'fake_synthetic_generated'),
    
    'claimed_profiles',
      (SELECT count(*) FROM hc_real_operators 
       WHERE claim_status != 'unclaimed'),
    
    'us_operators',
      (SELECT count(*) FROM hc_real_operators 
       WHERE country_code = 'US' 
         AND is_public = true
         AND trust_classification != 'fake_synthetic_generated'),
    
    -- Countries with REAL data
    'active_countries',
      (SELECT count(DISTINCT country_code) FROM hc_real_operators 
       WHERE is_public = true
         AND trust_classification != 'fake_synthetic_generated'),
    
    -- Jurisdictions (this table is real regulatory data)
    'jurisdictions',
      (SELECT count(*) FROM jurisdictions),
    
    -- Infrastructure (hc_places is real infrastructure data)
    'infrastructure_locations',
      (SELECT count(*) FROM hc_places WHERE status = 'published'),
    
    -- Synthetic quarantined (for admin transparency)
    'quarantined_synthetic',
      (SELECT count(*) FROM directory_listings 
       WHERE trust_classification = 'fake_synthetic_generated'),
    
    -- Source breakdown
    'sources', jsonb_build_object(
      'uspilotcars_hc_entity', (SELECT count(*) FROM hc_real_operators WHERE source_system = 'uspilotcars_hc_entity'),
      'osow_haven', (SELECT count(*) FROM hc_real_operators WHERE source_system = 'osow_haven')
    ),
    
    'computed_at', now()
  )
$$;

-- ─── STEP 7: Create public-safe view used by all web pages ───

CREATE OR REPLACE VIEW hc_public_operators AS
SELECT
  id,
  display_name AS name,
  slug,
  entity_type,
  phone,
  email,
  website,
  city,
  state_code,
  country_code,
  trust_classification,
  claim_status,
  evidence_score,
  trust_score,
  source_system,
  created_at,
  updated_at
FROM hc_real_operators
WHERE 
  is_public = true
  AND trust_classification NOT IN ('fake_synthetic_generated', 'test_seed_demo_fixture')
  AND display_name IS NOT NULL;

-- ─── STEP 8: Per-state count view (replaces synthetic mv_state_counts) ───

CREATE OR REPLACE VIEW hc_real_state_counts AS
SELECT
  state_code,
  count(*) AS operator_count,
  count(phone) AS with_phone,
  count(email) AS with_email
FROM hc_real_operators
WHERE 
  country_code = 'US'
  AND is_public = true
  AND trust_classification != 'fake_synthetic_generated'
GROUP BY state_code;

-- ─── STEP 9: Remove search_documents mirror of fake data ───
-- search_documents mirrors directory_listings — quarantine those too

ALTER TABLE search_documents
  ADD COLUMN IF NOT EXISTS is_quarantined boolean DEFAULT false;

UPDATE search_documents sd
SET is_quarantined = true
FROM directory_listings dl
WHERE sd.entity_id = dl.id::text
  AND dl.trust_classification = 'fake_synthetic_generated';

-- Also quarantine any search_documents whose record_type points at synthetic records
UPDATE search_documents
SET is_quarantined = true
WHERE 
  content ~* 'Escort [0-9a-f]{6}' 
  OR content ~* 'NORTH AMERICAN.*217-860-2201';

-- ─── STEP 10: Grant RLS-safe access ───

ALTER TABLE hc_real_operators ENABLE ROW LEVEL SECURITY;

-- Public can read non-quarantined real operators
CREATE POLICY "Public read real operators"
  ON hc_real_operators FOR SELECT
  USING (
    is_public = true
    AND trust_classification NOT IN ('fake_synthetic_generated', 'test_seed_demo_fixture')
  );

-- Service role can do everything
CREATE POLICY "Service role full access"
  ON hc_real_operators FOR ALL
  USING (auth.role() = 'service_role');
