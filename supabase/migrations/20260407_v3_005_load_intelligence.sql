-- ============================================================================
-- HAUL COMMAND V3 — Migration Block 005: Load Intelligence
-- ============================================================================
-- Prerequisites: block 001 (enums), block 003 (hc_entities)
-- FK order: loads → observations → dedupe_clusters → matches → broker_surfaces
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. hc_loads — Normalized load records from all sources
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_loads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Source tracking
    source_name     TEXT NOT NULL,                               -- 'load_board_x', 'api_submission', 'browser_grid', 'manual'
    external_id     TEXT,                                        -- ID from source system
    source_url      TEXT,
    -- Parties
    broker_entity_id UUID REFERENCES hc_entities(id) ON DELETE SET NULL,
    shipper_entity_id UUID REFERENCES hc_entities(id) ON DELETE SET NULL,
    -- Origin
    origin_text     TEXT,                                        -- raw text as ingested
    origin_city     TEXT,
    origin_region   TEXT,
    origin_country  TEXT NOT NULL DEFAULT 'US',
    origin_geo      GEOGRAPHY(Point, 4326),
    -- Destination
    destination_text TEXT,
    destination_city TEXT,
    destination_region TEXT,
    destination_country TEXT,
    destination_geo GEOGRAPHY(Point, 4326),
    -- Dimensions (unit-agnostic; measurement_system in metadata)
    length_value    NUMERIC(10,2),
    width_value     NUMERIC(10,2),
    height_value    NUMERIC(10,2),
    weight_value    NUMERIC(12,2),
    length_unit     TEXT DEFAULT 'ft' CHECK (length_unit IN ('ft', 'm')),
    weight_unit     TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg', 'tonnes')),
    -- Classification
    load_type       TEXT,                                        -- 'oversize', 'overweight', 'super_load', 'standard'
    commodity       TEXT,
    equipment_required TEXT,
    escort_count_required INTEGER,
    permits_required TEXT[] NOT NULL DEFAULT '{}',
    -- Pricing
    rate_amount     NUMERIC(10,2),
    rate_type       TEXT DEFAULT 'flat'
                    CHECK (rate_type IN ('flat', 'per_mile', 'per_hour', 'negotiable')),
    currency_code   TEXT NOT NULL DEFAULT 'USD',
    -- Status
    status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'assigned', 'in_transit', 'delivered', 'cancelled', 'expired')),
    -- Intelligence scores (computed)
    urgency_score   NUMERIC(3,2),                               -- 0-1
    matchability_score NUMERIC(3,2),                            -- 0-1
    quality_score   NUMERIC(3,2),                               -- 0-1 (rate fairness + broker trust)
    -- Corridor
    corridor_key    TEXT,
    estimated_miles NUMERIC(8,1),
    -- Dates
    pickup_date     DATE,
    delivery_date   DATE,
    posted_at       TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    -- Parse quality
    parse_confidence NUMERIC(3,2) NOT NULL DEFAULT 0.5,
    raw_payload     JSONB,                                       -- original ingested data
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcl_status ON hc_loads (status);
CREATE INDEX IF NOT EXISTS idx_hcl_broker ON hc_loads (broker_entity_id) WHERE broker_entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hcl_source ON hc_loads (source_name);
CREATE INDEX IF NOT EXISTS idx_hcl_corridor ON hc_loads (corridor_key) WHERE corridor_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hcl_origin_geo ON hc_loads USING gist (origin_geo) WHERE origin_geo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hcl_dest_geo ON hc_loads USING gist (destination_geo) WHERE destination_geo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hcl_pickup ON hc_loads (pickup_date) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_hcl_posted ON hc_loads (posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_hcl_external ON hc_loads (source_name, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hcl_country ON hc_loads (origin_country);
CREATE INDEX IF NOT EXISTS idx_hcl_urgency ON hc_loads (urgency_score DESC NULLS LAST) WHERE status = 'open';

CREATE TRIGGER hc_loads_updated_at BEFORE UPDATE ON hc_loads
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. hc_load_observations — Price/availability snapshots over time
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_load_observations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id         UUID NOT NULL REFERENCES hc_loads(id) ON DELETE CASCADE,
    observation_type TEXT NOT NULL,                              -- 'price_change', 'status_change', 'repost', 'expired', 'rate_update'
    observed_data   JSONB NOT NULL DEFAULT '{}',
    source          TEXT,
    observed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hclo_load ON hc_load_observations (load_id);
CREATE INDEX IF NOT EXISTS idx_hclo_type ON hc_load_observations (observation_type);
CREATE INDEX IF NOT EXISTS idx_hclo_observed ON hc_load_observations (observed_at DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. hc_load_dedupe_clusters — Deduplication groups
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_load_dedupe_clusters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_load_id UUID REFERENCES hc_loads(id) ON DELETE SET NULL,
    member_load_ids UUID[] NOT NULL DEFAULT '{}',
    cluster_confidence NUMERIC(3,2) NOT NULL DEFAULT 0.5,
    merge_strategy  TEXT NOT NULL DEFAULT 'newest_wins'
                    CHECK (merge_strategy IN ('newest_wins', 'highest_confidence', 'manual')),
    member_count    INTEGER NOT NULL DEFAULT 1,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcldc_canonical ON hc_load_dedupe_clusters (canonical_load_id);
CREATE INDEX IF NOT EXISTS idx_hcldc_members ON hc_load_dedupe_clusters USING gin (member_load_ids);

CREATE TRIGGER hc_load_dedupe_clusters_updated_at BEFORE UPDATE ON hc_load_dedupe_clusters
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. hc_load_matches — Matches between loads and operators
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_load_matches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id         UUID NOT NULL REFERENCES hc_loads(id) ON DELETE CASCADE,
    entity_id       UUID NOT NULL REFERENCES hc_entities(id) ON DELETE CASCADE,
    -- Scoring
    match_score     NUMERIC(3,2) NOT NULL,                      -- 0-1 composite
    distance_score  NUMERIC(3,2),                               -- proximity component
    trust_score     NUMERIC(3,2),                               -- entity trust component
    availability_score NUMERIC(3,2),                            -- availability component
    experience_score NUMERIC(3,2),                              -- corridor experience component
    -- Status
    contact_status  TEXT NOT NULL DEFAULT 'not_contacted'
                    CHECK (contact_status IN ('not_contacted', 'notified', 'viewed', 'interested', 'accepted', 'declined', 'expired')),
    contacted_at    TIMESTAMPTZ,
    responded_at    TIMESTAMPTZ,
    -- Metadata
    match_reason    TEXT,                                        -- human-readable explanation
    deadhead_miles  NUMERIC(8,1),
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (load_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_hclm_load ON hc_load_matches (load_id);
CREATE INDEX IF NOT EXISTS idx_hclm_entity ON hc_load_matches (entity_id);
CREATE INDEX IF NOT EXISTS idx_hclm_score ON hc_load_matches (match_score DESC);
CREATE INDEX IF NOT EXISTS idx_hclm_contact ON hc_load_matches (contact_status) WHERE contact_status = 'not_contacted';

CREATE TRIGGER hc_load_matches_updated_at BEFORE UPDATE ON hc_load_matches
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. hc_broker_surfaces — Broker-facing intelligence surfaces
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_broker_surfaces (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id       UUID NOT NULL REFERENCES hc_entities(id) ON DELETE CASCADE,
    surface_type    TEXT NOT NULL DEFAULT 'profile'
                    CHECK (surface_type IN ('profile', 'scorecard', 'rate_card', 'coverage_map', 'load_history')),
    -- Content
    title           TEXT NOT NULL,
    content         JSONB NOT NULL DEFAULT '{}',
    -- SEO
    slug            TEXT,
    meta_title      TEXT,
    meta_description TEXT,
    -- Status
    status          hc_status NOT NULL DEFAULT 'draft',
    published_at    TIMESTAMPTZ,
    -- Scoring
    quality_score   NUMERIC(3,2),
    completeness_score NUMERIC(3,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcbs_entity ON hc_broker_surfaces (entity_id);
CREATE INDEX IF NOT EXISTS idx_hcbs_type ON hc_broker_surfaces (surface_type);
CREATE INDEX IF NOT EXISTS idx_hcbs_status ON hc_broker_surfaces (status);
CREATE INDEX IF NOT EXISTS idx_hcbs_slug ON hc_broker_surfaces (slug) WHERE slug IS NOT NULL;

CREATE TRIGGER hc_broker_surfaces_updated_at BEFORE UPDATE ON hc_broker_surfaces
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. RLS
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE hc_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_load_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_load_dedupe_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_load_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_broker_surfaces ENABLE ROW LEVEL SECURITY;

-- Service role: full access
CREATE POLICY hc_loads_service ON hc_loads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_load_observations_service ON hc_load_observations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_load_dedupe_clusters_service ON hc_load_dedupe_clusters FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_load_matches_service ON hc_load_matches FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_broker_surfaces_service ON hc_broker_surfaces FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Load matches: providers see their own matches
CREATE POLICY hc_load_matches_provider_read ON hc_load_matches FOR SELECT TO authenticated
    USING (
        entity_id IN (
            SELECT id FROM hc_entities WHERE claimed_by = auth.uid()
        )
    );

-- Broker surfaces: brokers see their own
CREATE POLICY hc_broker_surfaces_broker_read ON hc_broker_surfaces FOR SELECT TO authenticated
    USING (
        entity_id IN (
            SELECT id FROM hc_entities WHERE claimed_by = auth.uid()
        )
    );

-- Loads: no direct anon/authenticated access to base table
-- Public access via views (created in bonus migration)
-- Admin: full read
CREATE POLICY hc_loads_admin_read ON hc_loads FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY hc_load_observations_admin_read ON hc_load_observations FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. PUBLIC VIEWS (Bonus 1 from V3 spec)
-- ══════════════════════════════════════════════════════════════════════════════

-- Public loads view: only open loads with basic info, no internal scoring
CREATE OR REPLACE VIEW public_live_loads_v AS
SELECT
    l.id AS load_id,
    l.origin_city,
    l.origin_region,
    l.origin_country,
    l.destination_city,
    l.destination_region,
    l.destination_country,
    l.load_type,
    l.commodity,
    l.escort_count_required,
    l.rate_amount,
    l.rate_type,
    l.currency_code,
    l.corridor_key,
    l.estimated_miles,
    l.pickup_date,
    l.delivery_date,
    l.posted_at,
    l.quality_score
FROM hc_loads l
WHERE l.status = 'open'
  AND l.parse_confidence >= 0.4
ORDER BY l.posted_at DESC;

GRANT SELECT ON public_live_loads_v TO anon, authenticated;

-- Public entity profiles view: only active, verified entities with public-safe fields
CREATE OR REPLACE VIEW public_profiles_v AS
SELECT
    e.id AS entity_id,
    e.entity_type,
    e.canonical_name,
    e.slug,
    e.country_code,
    e.region_code,
    e.city_name,
    e.status,
    e.claim_status,
    e.trust_score,
    e.completeness_score,
    e.tags,
    e.created_at
FROM hc_entities e
WHERE e.status = 'active'
ORDER BY e.trust_score DESC NULLS LAST;

GRANT SELECT ON public_profiles_v TO anon, authenticated;
