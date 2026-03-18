-- ============================================================================
-- Haul Command Load Board Intelligence — Broker Surfaces & Activation Queue
--
-- Adds broker surface persistence and activation queue tables.
-- Non-destructive: IF NOT EXISTS on all objects.
-- ============================================================================

-- ── Add source_format column to lb_observations ─────────────────

ALTER TABLE lb_observations ADD COLUMN IF NOT EXISTS source_format TEXT DEFAULT 'unknown';

-- ── Broker Surfaces ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS broker_surfaces (
    broker_surface_id           TEXT PRIMARY KEY,
    canonical_display_name      TEXT NOT NULL,
    canonical_company_candidate TEXT,
    primary_phone               TEXT,
    additional_phones           TEXT[] DEFAULT '{}',
    alias_cluster_ids           TEXT[] DEFAULT '{}',
    linked_identity_id          UUID,
    verification_status         TEXT DEFAULT 'unverified',

    -- Acquisition
    acquisition_status          TEXT DEFAULT 'seeded',
    activation_priority_score   NUMERIC(5,4) DEFAULT 0,
    claim_priority_score        NUMERIC(5,4) DEFAULT 0,
    outreach_priority_score     NUMERIC(5,4) DEFAULT 0,
    growth_target_flag          BOOLEAN DEFAULT FALSE,
    first_seen_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Market
    observed_corridors          TEXT[] DEFAULT '{}',
    observed_route_families     TEXT[] DEFAULT '{}',
    observed_service_types      TEXT[] DEFAULT '{}',
    observed_price_points       NUMERIC[] DEFAULT '{}',
    observed_urgency_patterns   TEXT[] DEFAULT '{}',
    observed_payment_patterns   TEXT[] DEFAULT '{}',
    recurrence_score            NUMERIC(5,4) DEFAULT 0,
    corridor_strength_score     NUMERIC(5,4) DEFAULT 0,

    -- Trust (internal only)
    internal_risk_score         NUMERIC(5,4) DEFAULT 0,
    warning_cluster_count       INTEGER DEFAULT 0,
    internal_notes_only         BOOLEAN DEFAULT TRUE,

    -- Geography
    countries_seen              TEXT[] DEFAULT '{}',
    admin_divisions_seen        TEXT[] DEFAULT '{}',
    origin_locations_seen       TEXT[] DEFAULT '{}',
    destination_locations_seen  TEXT[] DEFAULT '{}',

    -- Surface
    profile_slug                TEXT,
    public_surface_eligibility  BOOLEAN DEFAULT FALSE,
    claimable_surface_flag      BOOLEAN DEFAULT FALSE,
    internal_seed_flag          BOOLEAN DEFAULT TRUE,
    monetization_value_score    NUMERIC(5,4) DEFAULT 0,

    -- Source batch tracking
    source_batch_id             TEXT,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broker_surfaces_phone ON broker_surfaces (primary_phone);
CREATE INDEX IF NOT EXISTS idx_broker_surfaces_status ON broker_surfaces (acquisition_status);
CREATE INDEX IF NOT EXISTS idx_broker_surfaces_activation ON broker_surfaces (activation_priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_broker_surfaces_claim ON broker_surfaces (claim_priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_broker_surfaces_slug ON broker_surfaces (profile_slug);


-- ── Broker Surface Activation Queue ─────────────────────────────

CREATE TABLE IF NOT EXISTS broker_surface_activation_queue (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_surface_id       TEXT NOT NULL REFERENCES broker_surfaces(broker_surface_id),
    bucket                  TEXT NOT NULL,   -- 'claim_ready', 'outreach_ready', 'activation_ready', 'watchlist'
    score                   NUMERIC(5,4) DEFAULT 0,
    reason                  TEXT,
    source_batch_id         TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bsaq_bucket ON broker_surface_activation_queue (bucket);
CREATE INDEX IF NOT EXISTS idx_bsaq_score ON broker_surface_activation_queue (score DESC);
CREATE INDEX IF NOT EXISTS idx_bsaq_surface ON broker_surface_activation_queue (broker_surface_id);


-- ── RLS Policies ────────────────────────────────────────────────

ALTER TABLE broker_surfaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_surface_activation_queue ENABLE ROW LEVEL SECURITY;

-- Broker surfaces: public read only if eligible
CREATE POLICY "Public read broker_surfaces"
    ON broker_surfaces FOR SELECT USING (public_surface_eligibility = TRUE);

-- Activation queue: internal only
CREATE POLICY "No public read activation_queue"
    ON broker_surface_activation_queue FOR SELECT USING (FALSE);
