-- ============================================================================
-- HAUL COMMAND V3 — Migration Block 003: Entity Graph Base
-- ============================================================================
-- Prerequisites: block 001 (enums), block 002 (orchestration spine)
-- FK order: entities → aliases → relationships → observations → freshness → confidence
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. hc_entities — Universal entity registry
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_entities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     hc_entity_type NOT NULL,
    canonical_name  TEXT NOT NULL,
    slug            TEXT,                                        -- URL-safe identifier
    country_code    TEXT,                                        -- ISO 3166-1 alpha-2
    region_code     TEXT,
    city_name       TEXT,
    geo_point       GEOGRAPHY(Point, 4326),                     -- PostGIS point
    -- Identity signals
    phone           TEXT,
    email           TEXT,
    website         TEXT,
    external_ids    JSONB NOT NULL DEFAULT '{}',                 -- {'fmcsa_dot': '123', 'mc_number': '456'}
    -- Status
    status          hc_status NOT NULL DEFAULT 'draft',
    claim_status    TEXT NOT NULL DEFAULT 'unclaimed'
                    CHECK (claim_status IN ('unclaimed', 'nudged', 'invited', 'claimed', 'verified')),
    claimed_by      UUID,                                       -- auth.uid() of claimer
    claimed_at      TIMESTAMPTZ,
    -- Scores (computed, not user-editable)
    trust_score     NUMERIC(5,2),
    freshness_score NUMERIC(5,4),
    confidence_score NUMERIC(5,4),
    completeness_score NUMERIC(5,4),
    -- Metadata
    metadata        JSONB NOT NULL DEFAULT '{}',
    tags            TEXT[] NOT NULL DEFAULT '{}',
    data_sources    TEXT[] NOT NULL DEFAULT '{}',                -- provenance tracking
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcen_type ON hc_entities (entity_type);
CREATE INDEX IF NOT EXISTS idx_hcen_country ON hc_entities (country_code) WHERE country_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hcen_status ON hc_entities (status);
CREATE INDEX IF NOT EXISTS idx_hcen_claim ON hc_entities (claim_status);
CREATE INDEX IF NOT EXISTS idx_hcen_slug ON hc_entities (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hcen_name_trgm ON hc_entities USING gin (canonical_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_hcen_geo ON hc_entities USING gist (geo_point) WHERE geo_point IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hcen_tags ON hc_entities USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_hcen_external_ids ON hc_entities USING gin (external_ids);

CREATE TRIGGER hc_entities_updated_at BEFORE UPDATE ON hc_entities
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. hc_entity_aliases — Alternative names, abbreviations, translations
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_entity_aliases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id       UUID NOT NULL REFERENCES hc_entities(id) ON DELETE CASCADE,
    alias           TEXT NOT NULL,
    alias_type      TEXT NOT NULL DEFAULT 'trading_name'
                    CHECK (alias_type IN ('trading_name', 'abbreviation', 'translation', 'former_name', 'dba', 'typo_correction')),
    language_code   TEXT NOT NULL DEFAULT 'en',
    confidence      NUMERIC(3,2) NOT NULL DEFAULT 1.0,          -- how sure we are this alias is correct
    source          TEXT,                                        -- where this alias was found
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcea_entity ON hc_entity_aliases (entity_id);
CREATE INDEX IF NOT EXISTS idx_hcea_alias_trgm ON hc_entity_aliases USING gin (alias gin_trgm_ops);
CREATE UNIQUE INDEX IF NOT EXISTS idx_hcea_unique ON hc_entity_aliases (entity_id, alias, language_code);

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. hc_entity_relationships — Graph edges between entities
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_entity_relationships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_entity_id  UUID NOT NULL REFERENCES hc_entities(id) ON DELETE CASCADE,
    to_entity_id    UUID NOT NULL REFERENCES hc_entities(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,                             -- 'employs', 'operates_for', 'competes_with', 'installs_for', 'adjacent_to'
    strength_score  NUMERIC(3,2) NOT NULL DEFAULT 0.5,          -- 0-1
    evidence_count  INTEGER NOT NULL DEFAULT 0,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT no_self_relationship CHECK (from_entity_id != to_entity_id)
);

CREATE INDEX IF NOT EXISTS idx_hcer_from ON hc_entity_relationships (from_entity_id);
CREATE INDEX IF NOT EXISTS idx_hcer_to ON hc_entity_relationships (to_entity_id);
CREATE INDEX IF NOT EXISTS idx_hcer_type ON hc_entity_relationships (relationship_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_hcer_unique ON hc_entity_relationships (from_entity_id, to_entity_id, relationship_type);

CREATE TRIGGER hc_entity_relationships_updated_at BEFORE UPDATE ON hc_entity_relationships
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. hc_observations — Raw facts observed about entities
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_observations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id       UUID NOT NULL REFERENCES hc_entities(id) ON DELETE CASCADE,
    observation_type TEXT NOT NULL,                              -- 'phone_found', 'website_scraped', 'review_posted', 'load_posted', 'permit_filed'
    source          TEXT NOT NULL,                               -- 'browser_grid', 'api_enrichment', 'user_submitted', 'fmcsa_api'
    source_url      TEXT,
    observed_data   JSONB NOT NULL DEFAULT '{}',
    confidence      NUMERIC(3,2) NOT NULL DEFAULT 0.5,
    is_stale        BOOLEAN NOT NULL DEFAULT false,
    observed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcob_entity ON hc_observations (entity_id);
CREATE INDEX IF NOT EXISTS idx_hcob_type ON hc_observations (observation_type);
CREATE INDEX IF NOT EXISTS idx_hcob_source ON hc_observations (source);
CREATE INDEX IF NOT EXISTS idx_hcob_observed ON hc_observations (observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_hcob_stale ON hc_observations (is_stale) WHERE is_stale = false;

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. hc_profile_freshness — Freshness tracking per entity
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_profile_freshness (
    entity_id           UUID PRIMARY KEY REFERENCES hc_entities(id) ON DELETE CASCADE,
    last_profile_update TIMESTAMPTZ,
    last_availability_update TIMESTAMPTZ,
    last_doc_refresh    TIMESTAMPTZ,
    last_checkin        TIMESTAMPTZ,
    last_observation    TIMESTAMPTZ,
    freshness_score     NUMERIC(5,4) NOT NULL DEFAULT 0,        -- computed 0-1
    decay_rate          TEXT NOT NULL DEFAULT 'standard'
                        CHECK (decay_rate IN ('slow', 'standard', 'fast')),
    computed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER hc_profile_freshness_updated_at BEFORE UPDATE ON hc_profile_freshness
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. hc_confidence_factors — Per-entity confidence breakdown
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_confidence_factors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id       UUID NOT NULL REFERENCES hc_entities(id) ON DELETE CASCADE,
    factor_type     TEXT NOT NULL,                               -- 'name_match', 'phone_verified', 'address_confirmed', 'fmcsa_match', 'review_density'
    factor_value    NUMERIC(3,2) NOT NULL,                      -- 0-1 contribution
    weight          NUMERIC(3,2) NOT NULL DEFAULT 1.0,
    evidence_ref    TEXT,                                        -- observation_id or source reference
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (entity_id, factor_type)
);

CREATE INDEX IF NOT EXISTS idx_hccf_entity ON hc_confidence_factors (entity_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. RLS ENABLEMENT
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE hc_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_entity_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_profile_freshness ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_confidence_factors ENABLE ROW LEVEL SECURITY;

-- Service role: full access on all
CREATE POLICY hc_entities_service ON hc_entities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_entity_aliases_service ON hc_entity_aliases FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_entity_relationships_service ON hc_entity_relationships FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_observations_service ON hc_observations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_profile_freshness_service ON hc_profile_freshness FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_confidence_factors_service ON hc_confidence_factors FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Entities: no direct anon/authenticated access; exposed via views (created in bonus migration)
-- Freshness: authenticated can read own through secured view (created later)
-- Admin: read access on observations and confidence
CREATE POLICY hc_observations_admin_read ON hc_observations FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY hc_confidence_factors_admin_read ON hc_confidence_factors FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');
