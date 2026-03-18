-- ============================================================================
-- Haul Command Load Board Intelligence v3 — Unified Migration
--
-- Merges v2 volume + v3 pricing/forecasting/route-families/tagging/seed-data.
--
-- Design principles:
--   • Global: no US/CA-only logic, all 57 target countries supported
--   • Append-only observations (duplicates = volume intelligence)
--   • Dedupe master entities only (orgs, contacts, phones)
--   • Reputation data separate, internal-only
--   • Pricing intelligence preserved per observation
--   • Route families for broader corridor clusters
--   • Bridge to existing identities table for verified entities
--   • Country-agnostic schema with ISO 3166-1 alpha-2
-- ============================================================================

-- ── 1. Ingestion Batches ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lb_ingestion_batches (
    id              TEXT PRIMARY KEY,
    raw_text        TEXT NOT NULL,
    text_hash       TEXT NOT NULL,
    source_name     TEXT,
    source_type     TEXT NOT NULL DEFAULT 'unknown',
    country_hint    TEXT,                          -- ISO 3166-1 alpha-2
    supplied_date   DATE,
    ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    line_count      INTEGER NOT NULL DEFAULT 0,
    parsed_count    INTEGER NOT NULL DEFAULT 0,
    partial_count   INTEGER NOT NULL DEFAULT 0,
    unparsed_count  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_lb_batches_hash ON lb_ingestion_batches (text_hash);
CREATE INDEX IF NOT EXISTS idx_lb_batches_ingested ON lb_ingestion_batches (ingested_at);


-- ── 2. Load Board Observations (append-only) ────────────────────

CREATE TABLE IF NOT EXISTS lb_observations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id                TEXT NOT NULL REFERENCES lb_ingestion_batches(id),
    raw_line                TEXT NOT NULL,
    observed_date           DATE,
    observed_date_uncertain BOOLEAN DEFAULT TRUE,
    source_name             TEXT,
    source_type             TEXT NOT NULL DEFAULT 'unknown',

    parsed_name_or_company  TEXT,
    raw_phone               TEXT,
    normalized_phone        TEXT,
    phone_is_placeholder    BOOLEAN DEFAULT FALSE,

    origin_raw              TEXT,
    destination_raw         TEXT,
    origin_city             TEXT,
    origin_admin_division   TEXT,
    destination_city        TEXT,
    destination_admin_division TEXT,
    country_code            TEXT,                   -- ISO 3166-1 alpha-2

    -- v3: corridor & route family keys
    corridor_key            TEXT,
    route_family_key        TEXT,

    service_type            TEXT NOT NULL DEFAULT 'unknown',
    urgency                 TEXT NOT NULL DEFAULT 'unspecified',
    payment_terms           TEXT NOT NULL DEFAULT 'unspecified',
    role_candidates         JSONB DEFAULT '[]',
    special_requirements    TEXT[] DEFAULT '{}',

    -- v3: pricing fields
    quoted_amount           NUMERIC(10,2),
    quoted_currency         TEXT DEFAULT 'USD',
    quoted_miles            INTEGER,
    derived_pay_per_mile    NUMERIC(6,2),
    pricing_confidence      NUMERIC(3,2) DEFAULT 0,

    -- v3: tagging
    tags                    JSONB DEFAULT '{}',

    truncation_flag         BOOLEAN DEFAULT FALSE,
    parse_confidence        NUMERIC(3,2) DEFAULT 0,

    board_activity_flag     BOOLEAN DEFAULT TRUE,
    availability_assumption TEXT DEFAULT 'likely_not_available',
    volume_signal_weight    NUMERIC(3,2) DEFAULT 0,

    -- v3: speed signals
    same_actor_repeat       BOOLEAN DEFAULT FALSE,
    same_route_repeat       BOOLEAN DEFAULT FALSE,
    timed_post_flag         BOOLEAN DEFAULT FALSE,
    fast_cover_signal       NUMERIC(3,2) DEFAULT 0,

    is_seed_data            BOOLEAN DEFAULT TRUE,

    ingested_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lb_obs_batch ON lb_observations (batch_id);
CREATE INDEX IF NOT EXISTS idx_lb_obs_date ON lb_observations (observed_date);
CREATE INDEX IF NOT EXISTS idx_lb_obs_phone ON lb_observations (normalized_phone);
CREATE INDEX IF NOT EXISTS idx_lb_obs_name ON lb_observations (parsed_name_or_company);
CREATE INDEX IF NOT EXISTS idx_lb_obs_origin ON lb_observations (origin_admin_division);
CREATE INDEX IF NOT EXISTS idx_lb_obs_destination ON lb_observations (destination_admin_division);
CREATE INDEX IF NOT EXISTS idx_lb_obs_service ON lb_observations (service_type);
CREATE INDEX IF NOT EXISTS idx_lb_obs_country ON lb_observations (country_code);
CREATE INDEX IF NOT EXISTS idx_lb_obs_corridor ON lb_observations (corridor_key);
CREATE INDEX IF NOT EXISTS idx_lb_obs_route_family ON lb_observations (route_family_key);
CREATE INDEX IF NOT EXISTS idx_lb_obs_corridor_pair
    ON lb_observations (origin_admin_division, destination_admin_division);
CREATE INDEX IF NOT EXISTS idx_lb_obs_price ON lb_observations (quoted_amount) WHERE quoted_amount IS NOT NULL;


-- ── 3. Organizations (upserted / deduped) ───────────────────────

CREATE TABLE IF NOT EXISTS lb_organizations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_name      TEXT NOT NULL UNIQUE,
    display_name        TEXT NOT NULL,
    aliases             TEXT[] DEFAULT '{}',
    phones              TEXT[] DEFAULT '{}',
    role_candidates     JSONB DEFAULT '[]',
    country_codes       TEXT[] DEFAULT '{}',
    corridors_seen      TEXT[] DEFAULT '{}',        -- v3
    observation_count   INTEGER DEFAULT 0,
    recurrence_score    INTEGER DEFAULT 0,

    -- Scores
    entity_confidence   NUMERIC(3,2) DEFAULT 0,
    claim_priority      NUMERIC(3,2) DEFAULT 0,
    monetization_value  NUMERIC(3,2) DEFAULT 0,
    internal_risk       NUMERIC(3,2) DEFAULT 0,
    data_completeness   NUMERIC(3,2) DEFAULT 0,
    public_display_ok   BOOLEAN DEFAULT FALSE,

    -- v3: bridge to verified identities table
    linked_identity_id  UUID REFERENCES identities(id),

    first_seen          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lb_orgs_canonical ON lb_organizations (canonical_name);
CREATE INDEX IF NOT EXISTS idx_lb_orgs_phones ON lb_organizations USING GIN (phones);
CREATE INDEX IF NOT EXISTS idx_lb_orgs_countries ON lb_organizations USING GIN (country_codes);
CREATE INDEX IF NOT EXISTS idx_lb_orgs_corridors ON lb_organizations USING GIN (corridors_seen);
CREATE INDEX IF NOT EXISTS idx_lb_orgs_recurrence ON lb_organizations (recurrence_score DESC);
CREATE INDEX IF NOT EXISTS idx_lb_orgs_identity ON lb_organizations (linked_identity_id) WHERE linked_identity_id IS NOT NULL;


-- ── 4. Contacts (upserted when confidence high) ─────────────────

CREATE TABLE IF NOT EXISTS lb_contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_name  TEXT NOT NULL,
    display_name    TEXT NOT NULL,
    aliases         TEXT[] DEFAULT '{}',
    phones          TEXT[] DEFAULT '{}',
    linked_org_id   UUID REFERENCES lb_organizations(id),
    first_seen      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lb_contacts_phone ON lb_contacts USING GIN (phones);


-- ── 5. Phone Records (deduped) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS lb_phones (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    normalized_phone    TEXT NOT NULL UNIQUE,
    raw_phone           TEXT,
    is_placeholder      BOOLEAN DEFAULT FALSE,
    linked_names        TEXT[] DEFAULT '{}',
    linked_org_ids      UUID[] DEFAULT '{}',
    observation_count   INTEGER DEFAULT 0,
    first_seen          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lb_phones_norm ON lb_phones (normalized_phone);
CREATE INDEX IF NOT EXISTS idx_lb_phones_obs ON lb_phones (observation_count DESC);


-- ── 6. Alias Records (append-friendly) ──────────────────────────

CREATE TABLE IF NOT EXISTS lb_aliases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_variant     TEXT NOT NULL,
    canonical_candidate TEXT NOT NULL,
    linked_phone        TEXT,
    linked_org_id       UUID REFERENCES lb_organizations(id),
    source_batch_id     TEXT REFERENCES lb_ingestion_batches(id),
    observed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lb_aliases_canonical ON lb_aliases (canonical_candidate);
CREATE INDEX IF NOT EXISTS idx_lb_aliases_phone ON lb_aliases (linked_phone);


-- ── 7. Corridor Records (upserted) ─────────────────────────────

CREATE TABLE IF NOT EXISTS lb_corridors (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_key                TEXT NOT NULL UNIQUE,
    origin_admin_division       TEXT NOT NULL,
    destination_admin_division  TEXT NOT NULL,
    country_code                TEXT,
    route_family_key            TEXT,               -- v3
    observation_count           INTEGER DEFAULT 0,
    service_types_seen          TEXT[] DEFAULT '{}',
    actor_count                 INTEGER DEFAULT 0,
    urgency_density             NUMERIC(3,2) DEFAULT 0,

    -- Pricing (v3)
    avg_price                   NUMERIC(10,2),
    price_observations          INTEGER DEFAULT 0,

    -- Scores
    corridor_strength           NUMERIC(3,2) DEFAULT 0,
    volume_score                NUMERIC(3,2) DEFAULT 0,
    fast_cover_score            NUMERIC(3,2) DEFAULT 0,
    board_velocity              NUMERIC(3,2) DEFAULT 0,

    -- v3: bridge to existing corridors table
    linked_corridor_id          UUID REFERENCES corridors(id),

    first_seen                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lb_corridors_key ON lb_corridors (corridor_key);
CREATE INDEX IF NOT EXISTS idx_lb_corridors_origin ON lb_corridors (origin_admin_division);
CREATE INDEX IF NOT EXISTS idx_lb_corridors_dest ON lb_corridors (destination_admin_division);
CREATE INDEX IF NOT EXISTS idx_lb_corridors_country ON lb_corridors (country_code);
CREATE INDEX IF NOT EXISTS idx_lb_corridors_family ON lb_corridors (route_family_key);
CREATE INDEX IF NOT EXISTS idx_lb_corridors_vol ON lb_corridors (observation_count DESC);
CREATE INDEX IF NOT EXISTS idx_lb_corridors_price ON lb_corridors (price_observations DESC) WHERE price_observations > 0;


-- ── 8. Reputation Observations (append-only, internal) ──────────

CREATE TABLE IF NOT EXISTS lb_reputation_observations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id            TEXT NOT NULL REFERENCES lb_ingestion_batches(id),
    raw_text            TEXT NOT NULL,
    target_name         TEXT,
    target_phone        TEXT,
    signal_type         TEXT NOT NULL DEFAULT 'caution',
    evidence_strength   TEXT NOT NULL DEFAULT 'single_mention',
    visibility          TEXT NOT NULL DEFAULT 'internal_only',
    repetition_count    INTEGER DEFAULT 1,
    corroboration_count INTEGER DEFAULT 0,
    confidence          NUMERIC(3,2) DEFAULT 0,
    source_quality      TEXT DEFAULT 'medium',
    ingested_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lb_rep_target ON lb_reputation_observations (target_name);
CREATE INDEX IF NOT EXISTS idx_lb_rep_phone ON lb_reputation_observations (target_phone);
CREATE INDEX IF NOT EXISTS idx_lb_rep_signal ON lb_reputation_observations (signal_type);


-- ── 9. Daily Volume Aggregates ──────────────────────────────────

CREATE TABLE IF NOT EXISTS lb_daily_volume (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date            DATE NOT NULL,
    country_code    TEXT,
    total_obs       INTEGER DEFAULT 0,
    by_service_type JSONB DEFAULT '{}',
    by_admin        JSONB DEFAULT '{}',
    urgent_count    INTEGER DEFAULT 0,
    price_obs_count INTEGER DEFAULT 0,              -- v3
    repeat_actors   INTEGER DEFAULT 0,
    board_velocity  NUMERIC(3,2) DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (date, country_code)
);

CREATE INDEX IF NOT EXISTS idx_lb_daily_date ON lb_daily_volume (date);
CREATE INDEX IF NOT EXISTS idx_lb_daily_country ON lb_daily_volume (country_code);


-- ── 10. Claim & Outreach Queue ──────────────────────────────────

CREATE TABLE IF NOT EXISTS lb_claim_queue (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID REFERENCES lb_organizations(id),
    org_name            TEXT NOT NULL,
    priority_score      NUMERIC(3,2) DEFAULT 0,
    reason              TEXT,
    status              TEXT DEFAULT 'pending',   -- pending, contacted, claimed, dismissed
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lb_claims_status ON lb_claim_queue (status);
CREATE INDEX IF NOT EXISTS idx_lb_claims_priority ON lb_claim_queue (priority_score DESC);


-- ── RLS Policies ────────────────────────────────────────────────

ALTER TABLE lb_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lb_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lb_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE lb_daily_volume ENABLE ROW LEVEL SECURITY;
ALTER TABLE lb_reputation_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lb_claim_queue ENABLE ROW LEVEL SECURITY;

-- Public read for non-sensitive surfaces
CREATE POLICY "Public read lb_organizations"
    ON lb_organizations FOR SELECT USING (public_display_ok = TRUE);

CREATE POLICY "Public read lb_corridors"
    ON lb_corridors FOR SELECT USING (TRUE);

CREATE POLICY "Public read lb_daily_volume"
    ON lb_daily_volume FOR SELECT USING (TRUE);

-- Reputation stays internal
CREATE POLICY "No public read lb_reputation"
    ON lb_reputation_observations FOR SELECT USING (FALSE);

-- Claim queue stays internal
CREATE POLICY "No public read lb_claims"
    ON lb_claim_queue FOR SELECT USING (FALSE);

-- Observations: public read only high-confidence non-reputation data
CREATE POLICY "Public read lb_observations"
    ON lb_observations FOR SELECT USING (parse_confidence >= 0.4);

-- ── Service-role write policies (allow API route inserts) ───────
-- These use service_role key bypass, which Supabase supports
-- by default when using service_role key. No additional policy needed.
