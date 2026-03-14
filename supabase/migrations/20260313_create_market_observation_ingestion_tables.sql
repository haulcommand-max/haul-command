-- ═══════════════════════════════════════════════════════════════
-- Historical Market Observation Ingestion Engine — Full Schema
-- Migration: create_market_observation_ingestion_tables
-- Global 57-country design, no US-only logic
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_ingestion_batches (
    id TEXT PRIMARY KEY,
    raw_text TEXT NOT NULL,
    text_hash TEXT NOT NULL,
    source_name TEXT,
    source_type TEXT NOT NULL DEFAULT 'pasted_text',
    source_classification TEXT NOT NULL DEFAULT 'historical_market_observation',
    country_hint TEXT,
    batch_date DATE,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    total_lines INT NOT NULL DEFAULT 0,
    parsed_lines INT NOT NULL DEFAULT 0,
    partial_lines INT NOT NULL DEFAULT 0,
    unparsed_lines INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_batches_ingested ON hc_ingestion_batches(ingested_at DESC);
CREATE INDEX IF NOT EXISTS idx_batches_hash ON hc_ingestion_batches(text_hash);

CREATE TABLE IF NOT EXISTS hc_market_entities (
    id TEXT PRIMARY KEY,
    canonical_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    entity_type TEXT NOT NULL DEFAULT 'unknown',
    primary_roles JSONB NOT NULL DEFAULT '[]',
    role_confidences JSONB NOT NULL DEFAULT '{}',
    primary_phone TEXT,
    country_code TEXT,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    observation_count INT NOT NULL DEFAULT 0,
    recurrence_score REAL NOT NULL DEFAULT 0,
    entity_confidence_score REAL NOT NULL DEFAULT 0,
    claim_priority_score REAL NOT NULL DEFAULT 0,
    monetization_value_score REAL NOT NULL DEFAULT 0,
    internal_risk_score REAL NOT NULL DEFAULT 0,
    public_display_eligible BOOLEAN NOT NULL DEFAULT false,
    data_completeness_score REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_entities_phone ON hc_market_entities(primary_phone) WHERE primary_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_entities_canonical ON hc_market_entities(canonical_name);
CREATE INDEX IF NOT EXISTS idx_entities_recurrence ON hc_market_entities(recurrence_score DESC);
CREATE INDEX IF NOT EXISTS idx_entities_claim ON hc_market_entities(claim_priority_score DESC);

CREATE TABLE IF NOT EXISTS hc_market_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id TEXT NOT NULL REFERENCES hc_ingestion_batches(id),
    source_name TEXT,
    source_type TEXT NOT NULL DEFAULT 'pasted_text',
    raw_line TEXT NOT NULL,
    observed_date DATE NOT NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    parsed_name_or_company TEXT,
    raw_phone TEXT,
    normalized_phone TEXT,
    origin_raw TEXT,
    origin_city TEXT,
    origin_region TEXT,
    destination_raw TEXT,
    destination_city TEXT,
    destination_region TEXT,
    service_type TEXT NOT NULL DEFAULT 'unknown',
    urgency TEXT NOT NULL DEFAULT 'unknown',
    payment_terms TEXT NOT NULL DEFAULT 'unknown',
    role_candidates JSONB NOT NULL DEFAULT '[]',
    reputation_signal TEXT NOT NULL DEFAULT 'none',
    truncation_flag BOOLEAN NOT NULL DEFAULT false,
    parse_confidence REAL NOT NULL DEFAULT 0,
    country_code_if_known TEXT,
    linked_entity_id TEXT,
    corridor_key TEXT,
    route_cluster_key TEXT
);
CREATE INDEX IF NOT EXISTS idx_obs_batch ON hc_market_observations(batch_id);
CREATE INDEX IF NOT EXISTS idx_obs_phone ON hc_market_observations(normalized_phone) WHERE normalized_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_obs_corridor ON hc_market_observations(corridor_key) WHERE corridor_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_obs_date ON hc_market_observations(observed_date DESC);

CREATE TABLE IF NOT EXISTS hc_entity_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id TEXT NOT NULL REFERENCES hc_market_entities(id),
    alias_name TEXT NOT NULL,
    alias_type TEXT NOT NULL DEFAULT 'name_variant',
    source_batch_id TEXT REFERENCES hc_ingestion_batches(id),
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    occurrence_count INT NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_aliases_entity ON hc_entity_aliases(entity_id);

CREATE TABLE IF NOT EXISTS hc_entity_phones (
    normalized_phone TEXT PRIMARY KEY,
    raw_phone TEXT NOT NULL,
    is_placeholder BOOLEAN NOT NULL DEFAULT false,
    linked_entity_ids JSONB NOT NULL DEFAULT '[]',
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    occurrence_count INT NOT NULL DEFAULT 1,
    country_code TEXT
);

CREATE TABLE IF NOT EXISTS hc_reputation_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id TEXT NOT NULL REFERENCES hc_ingestion_batches(id),
    raw_reputation_text TEXT NOT NULL,
    target_name TEXT,
    target_phone TEXT,
    target_entity_id TEXT REFERENCES hc_market_entities(id),
    repetition_count INT NOT NULL DEFAULT 1,
    corroboration_count INT NOT NULL DEFAULT 0,
    evidence_strength TEXT NOT NULL DEFAULT 'low',
    source_quality TEXT NOT NULL DEFAULT 'medium',
    confidence REAL NOT NULL DEFAULT 0,
    visibility TEXT NOT NULL DEFAULT 'internal_only',
    observed_date DATE NOT NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rep_entity ON hc_reputation_observations(target_entity_id) WHERE target_entity_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS hc_corridor_intelligence (
    corridor_key TEXT PRIMARY KEY,
    origin_region TEXT NOT NULL,
    origin_city TEXT,
    destination_region TEXT NOT NULL,
    destination_city TEXT,
    country_code TEXT,
    observation_count INT NOT NULL DEFAULT 0,
    unique_actor_count INT NOT NULL DEFAULT 0,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    service_type_mix JSONB NOT NULL DEFAULT '{}',
    urgency_mix JSONB NOT NULL DEFAULT '{}',
    payment_mix JSONB NOT NULL DEFAULT '{}',
    corridor_strength_score REAL NOT NULL DEFAULT 0,
    is_emerging BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_corridor_strength ON hc_corridor_intelligence(corridor_strength_score DESC);

CREATE TABLE IF NOT EXISTS hc_identity_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_a_id TEXT NOT NULL REFERENCES hc_market_entities(id),
    entity_b_id TEXT NOT NULL REFERENCES hc_market_entities(id),
    link_type TEXT NOT NULL DEFAULT 'possible_match',
    merge_confidence REAL NOT NULL DEFAULT 0,
    evidence_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS + service role policies
ALTER TABLE hc_ingestion_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_market_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_market_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_entity_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_entity_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_reputation_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_corridor_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_identity_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "srv_batches" ON hc_ingestion_batches FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_obs" ON hc_market_observations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_entities" ON hc_market_entities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_aliases" ON hc_entity_aliases FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_phones" ON hc_entity_phones FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_rep" ON hc_reputation_observations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_corridors" ON hc_corridor_intelligence FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_links" ON hc_identity_links FOR ALL TO service_role USING (true) WITH CHECK (true);
