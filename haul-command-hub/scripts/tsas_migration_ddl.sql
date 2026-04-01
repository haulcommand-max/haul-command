-- ═══════════════════════════════════════════════════════════════
-- TSAS Ingestion Tables — Run in Supabase SQL Editor if RPC fails
-- ═══════════════════════════════════════════════════════════════

-- 1. Primary staging table for all crawled TSAS records
CREATE TABLE IF NOT EXISTS hc_source_tsas (
  id              BIGSERIAL PRIMARY KEY,
  source_id       INTEGER UNIQUE NOT NULL,
  source_url      TEXT,
  source_category_id INTEGER,
  source_category_label TEXT,
  hc_entity_type  TEXT,
  name            TEXT NOT NULL,
  name_normalized TEXT,
  city            TEXT,
  admin1_code     TEXT,
  postal_code     TEXT,
  country_code    TEXT DEFAULT 'US',
  phone_primary   TEXT,
  phone_normalized TEXT,
  fax             TEXT,
  email           TEXT,
  website_url     TEXT,
  payment_methods TEXT[],
  raw_description TEXT,
  is_mobile_service BOOLEAN DEFAULT FALSE,
  is_24_7         BOOLEAN DEFAULT FALSE,
  is_sponsored    BOOLEAN DEFAULT FALSE,
  service_radius_miles INTEGER,
  chain_brand     TEXT,
  is_chain        BOOLEAN DEFAULT FALSE,
  states_listed_in TEXT[],
  ingested_at     TIMESTAMPTZ DEFAULT NOW(),
  normalized_at   TIMESTAMPTZ,
  promoted_at     TIMESTAMPTZ,
  promoted_to_public BOOLEAN DEFAULT FALSE,
  hc_entity_id    UUID,
  claim_priority  TEXT DEFAULT 'low',
  CONSTRAINT valid_claim_priority CHECK (claim_priority IN ('critical','high','medium','low'))
);

CREATE INDEX IF NOT EXISTS idx_tsas_source_id ON hc_source_tsas(source_id);
CREATE INDEX IF NOT EXISTS idx_tsas_hc_type ON hc_source_tsas(hc_entity_type);
CREATE INDEX IF NOT EXISTS idx_tsas_admin1 ON hc_source_tsas(admin1_code);
CREATE INDEX IF NOT EXISTS idx_tsas_phone ON hc_source_tsas(phone_normalized);
CREATE INDEX IF NOT EXISTS idx_tsas_claim ON hc_source_tsas(claim_priority);
CREATE INDEX IF NOT EXISTS idx_tsas_promoted ON hc_source_tsas(promoted_to_public);

-- 2. Category mapping reference table
CREATE TABLE IF NOT EXISTS hc_tsas_category_map (
  source_category_id  INTEGER PRIMARY KEY,
  source_label        TEXT NOT NULL,
  hc_entity_type      TEXT NOT NULL,
  is_physical_place   BOOLEAN DEFAULT FALSE,
  is_mobile_service   BOOLEAN DEFAULT FALSE,
  is_hc_core_vertical BOOLEAN DEFAULT FALSE
);

-- 3. Reviews from TSAS source
CREATE TABLE IF NOT EXISTS hc_source_reviews (
  id              BIGSERIAL PRIMARY KEY,
  source          TEXT DEFAULT 'tsas',
  source_entity_id INTEGER,
  hc_entity_id    UUID,
  review_text     TEXT,
  reviewer_name   TEXT,
  review_date     TIMESTAMPTZ,
  ingested_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tsas_reviews_entity ON hc_source_reviews(source_entity_id);

-- 4. Service area coverage edges (entity → states served)
CREATE TABLE IF NOT EXISTS hc_tsas_service_areas (
  id              BIGSERIAL PRIMARY KEY,
  source_id       INTEGER REFERENCES hc_source_tsas(source_id),
  admin1_code     TEXT NOT NULL,
  country_code    TEXT DEFAULT 'US',
  is_home_state   BOOLEAN DEFAULT FALSE,
  discovered_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tsas_sa_source ON hc_tsas_service_areas(source_id);
CREATE INDEX IF NOT EXISTS idx_tsas_sa_state ON hc_tsas_service_areas(admin1_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tsas_sa_unique ON hc_tsas_service_areas(source_id, admin1_code);
