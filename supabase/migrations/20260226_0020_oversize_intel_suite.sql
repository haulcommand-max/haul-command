-- ============================================================================
-- OVERSIZE INTEL SUITE v1 — Four Intelligence Engines
-- (1) Escort License Cross-Match
-- (2) Review Keyword Mining Signals
-- (3) Photo AI Escort Detection Signals
-- (4) Broker↔Escort Relationship Graph
-- + Unified Trust Features + Hidden Escort Discovery Queue
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════
-- 1. ESCORT LICENSE CROSS-MATCH ENGINE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.escort_licenses_raw (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction        TEXT NOT NULL,        -- e.g. 'US:TX', 'AU:NSW', 'CA:AB'
    license_id          TEXT NOT NULL,
    holder_name         TEXT,
    business_name       TEXT,
    status              TEXT DEFAULT 'active', -- active | expired | suspended | revoked
    issue_date          DATE,
    expiry_date         DATE,
    contact             TEXT,                 -- phone or email (minimized)
    source_url          TEXT,
    fetched_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(jurisdiction, license_id)
);

CREATE INDEX IF NOT EXISTS elr_jurisdiction_idx ON public.escort_licenses_raw (jurisdiction);
CREATE INDEX IF NOT EXISTS elr_holder_idx ON public.escort_licenses_raw (holder_name);
CREATE INDEX IF NOT EXISTS elr_business_idx ON public.escort_licenses_raw (business_name);
CREATE INDEX IF NOT EXISTS elr_status_idx ON public.escort_licenses_raw (status) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS public.escort_license_matches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id         UUID NOT NULL,        -- FK to profiles.id
    jurisdiction        TEXT NOT NULL,
    license_id          TEXT NOT NULL,
    match_score         NUMERIC(5,4) NOT NULL DEFAULT 0.0,
    matched_on          TEXT NOT NULL,         -- license_id_exact | business_fuzzy | holder_fuzzy | phone | domain
    status              TEXT DEFAULT 'matched', -- matched | verified | disputed | revoked
    verified_at         TIMESTAMPTZ,
    evidence_json       JSONB DEFAULT '{}'::JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(operator_id, jurisdiction)
);

CREATE INDEX IF NOT EXISTS elm_operator_idx ON public.escort_license_matches (operator_id);
CREATE INDEX IF NOT EXISTS elm_score_idx ON public.escort_license_matches (match_score DESC);

-- ═══════════════════════════════════════════════════════════════
-- 2. REVIEW KEYWORD MINING SIGNALS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.operator_review_signals (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id                 UUID NOT NULL UNIQUE,
    escort_review_signal_score  NUMERIC(5,4) DEFAULT 0.0,
    escort_keyword_hits_json    JSONB DEFAULT '{}'::JSONB,
    -- e.g. {"pilot_car":3,"wide_load":2,"heavy_haul":1}
    heavy_haul_keyword_hits     INT DEFAULT 0,
    credibility_keyword_hits    INT DEFAULT 0,
    total_reviews_mined         INT DEFAULT 0,
    reviewer_diversity_score    NUMERIC(5,4) DEFAULT 0.0,
    anti_spam_score             NUMERIC(5,4) DEFAULT 1.0,
    recency_weight              NUMERIC(5,4) DEFAULT 1.0,
    languages_json              JSONB DEFAULT '["en"]'::JSONB,
    last_mined_at               TIMESTAMPTZ,
    provenance_json             JSONB DEFAULT '{}'::JSONB,
    -- e.g. {"sources":["google_api","claimed_reviews"],"review_count":12}
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ors_signal_idx ON public.operator_review_signals (escort_review_signal_score DESC);

-- Operator flags (spam, suspicious patterns, hidden-escort candidates)
CREATE TABLE IF NOT EXISTS public.operator_flags (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id     UUID NOT NULL,
    flag_type       TEXT NOT NULL,     -- spam_reviews | fake_reviews | hidden_escort_candidate | suspicious_pattern
    severity        TEXT DEFAULT 'low', -- low | medium | high | critical
    evidence_json   JSONB DEFAULT '{}'::JSONB,
    resolved        BOOLEAN DEFAULT false,
    resolved_at     TIMESTAMPTZ,
    resolved_by     UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(operator_id, flag_type)
);

CREATE INDEX IF NOT EXISTS of_operator_idx ON public.operator_flags (operator_id);
CREATE INDEX IF NOT EXISTS of_unresolved_idx ON public.operator_flags (resolved) WHERE resolved = false;

-- ═══════════════════════════════════════════════════════════════
-- 3. PHOTO AI ESCORT DETECTION SIGNALS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.operator_photo_signals (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id             UUID NOT NULL UNIQUE,
    photo_signal_score      NUMERIC(5,4) DEFAULT 0.0,
    evidence_top_labels_json JSONB DEFAULT '[]'::JSONB,
    -- e.g. [{"label":"amber_lightbar","confidence":0.92},{"label":"pickup_truck","confidence":0.88}]
    ocr_hits_json           JSONB DEFAULT '{}'::JSONB,
    -- e.g. {"OVERSIZE LOAD":0.95,"PILOT":0.82}
    sample_image_refs_json  JSONB DEFAULT '[]'::JSONB,
    -- e.g. ["uploads/op_123/photo1.jpg","uploads/op_123/photo2.jpg"]
    images_scanned          INT DEFAULT 0,
    last_scanned_at         TIMESTAMPTZ,
    provenance_json         JSONB DEFAULT '{}'::JSONB,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ops_score_idx ON public.operator_photo_signals (photo_signal_score DESC);

-- ═══════════════════════════════════════════════════════════════
-- 4. BROKER ↔ ESCORT RELATIONSHIP GRAPH
-- ═══════════════════════════════════════════════════════════════

CREATE TYPE public.graph_node_type AS ENUM (
    'broker',
    'carrier',
    'escort_operator',
    'port_terminal',
    'corridor',
    'metro',
    'permit_agency'
);

CREATE TYPE public.graph_edge_type AS ENUM (
    'broker_to_escort',
    'escort_to_corridor',
    'broker_to_corridor',
    'carrier_to_escort',
    'escort_to_port',
    'broker_to_carrier'
);

CREATE TABLE IF NOT EXISTS public.graph_nodes (
    node_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_type       public.graph_node_type NOT NULL,
    entity_id       UUID NOT NULL,                    -- FK to profiles/places/corridors
    country_code    VARCHAR(2),
    labels_json     JSONB DEFAULT '[]'::JSONB,        -- ["verified","top_performer"]
    metadata_json   JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(node_type, entity_id)
);

CREATE INDEX IF NOT EXISTS gn_type_idx ON public.graph_nodes (node_type);
CREATE INDEX IF NOT EXISTS gn_entity_idx ON public.graph_nodes (entity_id);
CREATE INDEX IF NOT EXISTS gn_country_idx ON public.graph_nodes (country_code);

CREATE TABLE IF NOT EXISTS public.graph_edges (
    edge_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_node_id    UUID NOT NULL REFERENCES public.graph_nodes(node_id) ON DELETE CASCADE,
    to_node_id      UUID NOT NULL REFERENCES public.graph_nodes(node_id) ON DELETE CASCADE,
    edge_type       public.graph_edge_type NOT NULL,
    weight          NUMERIC(8,4) DEFAULT 0.0,
    evidence_json   JSONB DEFAULT '{}'::JSONB,
    -- e.g. {"jobs_completed":5,"repeat_rate":0.8,"avg_payment_days":3.2}
    first_seen_at   TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_node_id, to_node_id, edge_type)
);

CREATE INDEX IF NOT EXISTS ge_from_idx ON public.graph_edges (from_node_id);
CREATE INDEX IF NOT EXISTS ge_to_idx ON public.graph_edges (to_node_id);
CREATE INDEX IF NOT EXISTS ge_type_idx ON public.graph_edges (edge_type);
CREATE INDEX IF NOT EXISTS ge_weight_idx ON public.graph_edges (weight DESC);

CREATE TABLE IF NOT EXISTS public.graph_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id       UUID NOT NULL,
    score_type      TEXT NOT NULL,     -- broker_trust | escort_reliability | corridor_supply_strength
    score_value     NUMERIC(8,4) DEFAULT 0.0,
    computed_at     TIMESTAMPTZ DEFAULT NOW(),
    metadata_json   JSONB DEFAULT '{}'::JSONB,
    UNIQUE(entity_id, score_type)
);

CREATE INDEX IF NOT EXISTS gs_type_idx ON public.graph_scores (score_type, score_value DESC);

-- ═══════════════════════════════════════════════════════════════
-- 5. OPERATOR TRUST SIGNALS (unified trust features)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.operator_trust_signals (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id             UUID NOT NULL UNIQUE,

    -- License
    license_verified_flag   BOOLEAN DEFAULT false,
    license_match_score     NUMERIC(5,4) DEFAULT 0.0,
    license_last_checked_at TIMESTAMPTZ,

    -- Review
    review_signal_score     NUMERIC(5,4) DEFAULT 0.0,

    -- Photo
    photo_signal_score      NUMERIC(5,4) DEFAULT 0.0,

    -- Graph
    graph_reliability_score NUMERIC(5,4) DEFAULT 0.0,
    graph_broker_edges      INT DEFAULT 0,

    -- Composite
    composite_trust_score   NUMERIC(5,4) DEFAULT 0.0,
    trust_tier              TEXT DEFAULT 'unscored',  -- unscored | bronze | silver | gold | platinum

    computed_at             TIMESTAMPTZ DEFAULT NOW(),
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ots_composite_idx ON public.operator_trust_signals (composite_trust_score DESC);
CREATE INDEX IF NOT EXISTS ots_tier_idx ON public.operator_trust_signals (trust_tier);

-- ═══════════════════════════════════════════════════════════════
-- 6. HIDDEN ESCORT DISCOVERY QUEUE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hidden_escort_candidates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id     UUID,
    enrichment_id   UUID,                 -- from enrichment_results if discovered via pipeline
    discovery_source TEXT NOT NULL,        -- review_miner | photo_ai | license_crossmatch | graph_analysis
    review_signal   NUMERIC(5,4) DEFAULT 0.0,
    photo_signal    NUMERIC(5,4) DEFAULT 0.0,
    license_flag    BOOLEAN DEFAULT false,
    composite_score NUMERIC(5,4) DEFAULT 0.0,
    status          TEXT DEFAULT 'pending', -- pending | confirmed | rejected | contacted
    reviewed_by     UUID,
    reviewed_at     TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hec_status_idx ON public.hidden_escort_candidates (status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS hec_score_idx ON public.hidden_escort_candidates (composite_score DESC);

-- ═══════════════════════════════════════════════════════════════
-- 7. RLS POLICIES
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.escort_licenses_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escort_license_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_review_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_photo_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_trust_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_escort_candidates ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY elr_sr ON public.escort_licenses_raw FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY elm_sr ON public.escort_license_matches FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY ors_sr ON public.operator_review_signals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY of_sr ON public.operator_flags FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY ops_sr ON public.operator_photo_signals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY gn_sr ON public.graph_nodes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY ge_sr ON public.graph_edges FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY gs_sr ON public.graph_scores FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY ots_sr ON public.operator_trust_signals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hec_sr ON public.hidden_escort_candidates FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public read: licenses (active only), graph scores, trust signals
CREATE POLICY elr_public ON public.escort_licenses_raw FOR SELECT USING (status = 'active');
CREATE POLICY gs_public ON public.graph_scores FOR SELECT USING (true);
CREATE POLICY ots_public ON public.operator_trust_signals FOR SELECT USING (true);

-- Operators can see their own matches/signals
CREATE POLICY elm_own ON public.escort_license_matches FOR SELECT TO authenticated USING (operator_id = auth.uid());
CREATE POLICY ors_own ON public.operator_review_signals FOR SELECT TO authenticated USING (operator_id = auth.uid());
CREATE POLICY ops_own ON public.operator_photo_signals FOR SELECT TO authenticated USING (operator_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- 8. UPDATED_AT TRIGGERS
-- ═══════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_elm_updated ON public.escort_license_matches;
CREATE TRIGGER trg_elm_updated BEFORE UPDATE ON public.escort_license_matches
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_ors_updated ON public.operator_review_signals;
CREATE TRIGGER trg_ors_updated BEFORE UPDATE ON public.operator_review_signals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_ops_updated ON public.operator_photo_signals;
CREATE TRIGGER trg_ops_updated BEFORE UPDATE ON public.operator_photo_signals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_ots_updated ON public.operator_trust_signals;
CREATE TRIGGER trg_ots_updated BEFORE UPDATE ON public.operator_trust_signals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
