-- ============================================================
-- HAUL COMMAND — Map-First Load Board Schema
-- Spec: Map-First Load Board + Coverage Confidence v1.0.0
-- Date: 2026-02-27
-- ============================================================
-- Tables: job_posts, coverage_cells, contact_logs, role_events
-- (operator_profiles already exists — we add missing columns)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS postgis;

-- ────────────────────────────────────────────────────────────
-- 1. JOB POSTS — Loads needing escort service
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS job_posts (
    job_id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at          TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Status + source
    status              TEXT NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open','paused','filled','expired','cancelled')),
    source              TEXT NOT NULL DEFAULT 'direct_shipper'
                        CHECK (source IN ('direct_shipper','broker','partner_feed','manual_import')),

    -- Core info
    title               TEXT NOT NULL,
    description         TEXT,
    escort_type         TEXT NOT NULL DEFAULT 'chase_only'
                        CHECK (escort_type IN ('chase_only','lead','rear','both','police_coordination','route_scout')),

    -- Geography (PostGIS points)
    origin_point        geography(Point, 4326),
    origin_label        TEXT,                      -- "Dallas, TX" human-readable
    destination_point   geography(Point, 4326),
    destination_label   TEXT,

    -- Time window
    pickup_earliest     TIMESTAMPTZ,
    pickup_latest       TIMESTAMPTZ,

    -- Payout
    payout_min          NUMERIC(10,2),
    payout_max          NUMERIC(10,2),
    payout_currency     TEXT DEFAULT 'USD',

    -- Distance
    distance_miles      NUMERIC(8,1),

    -- Verification
    is_verified         BOOLEAN DEFAULT FALSE,
    verification_level  TEXT DEFAULT 'unverified'
                        CHECK (verification_level IN ('unverified','basic','verified','verified_elite')),

    -- Poster
    poster_account_id   UUID,
    poster_reputation   NUMERIC(3,2) DEFAULT 0.50,  -- 0-1

    -- Geo keys
    region_key          TEXT,                        -- admin1 or corridor key
    origin_geohash      TEXT,                        -- for cell aggregation
    destination_geohash TEXT,

    -- Expiry
    expires_at          TIMESTAMPTZ,
    grace_hours         INTEGER DEFAULT 6
);

-- Indexes per spec
CREATE INDEX idx_jobs_status_updated ON job_posts(status, updated_at);
CREATE INDEX idx_jobs_origin_geo ON job_posts USING GIST(origin_point);
CREATE INDEX idx_jobs_dest_geo ON job_posts USING GIST(destination_point);
CREATE INDEX idx_jobs_escort_type ON job_posts(escort_type);
CREATE INDEX idx_jobs_pickup ON job_posts(pickup_earliest, pickup_latest);
CREATE INDEX idx_jobs_verification ON job_posts(verification_level);
CREATE INDEX idx_jobs_poster ON job_posts(poster_account_id);
CREATE INDEX idx_jobs_origin_geohash ON job_posts(origin_geohash);
CREATE INDEX idx_jobs_status ON job_posts(status) WHERE status = 'open';
CREATE INDEX idx_jobs_created ON job_posts(created_at);

-- ────────────────────────────────────────────────────────────
-- 2. COVERAGE CELLS — Pre-aggregated geo grid
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS coverage_cells (
    cell_id             TEXT PRIMARY KEY,
    geohash             TEXT NOT NULL,
    centroid_point      geography(Point, 4326) NOT NULL,
    admin_country       TEXT,
    admin1              TEXT,

    -- Timestamps
    updated_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Raw counts
    active_jobs_raw     INTEGER DEFAULT 0,
    active_operators_raw INTEGER DEFAULT 0,

    -- Effective (freshness-weighted) counts
    active_jobs_effective   NUMERIC(8,2) DEFAULT 0,
    active_operators_effective NUMERIC(8,2) DEFAULT 0,

    -- Coverage confidence model output
    coverage_confidence NUMERIC(4,3) DEFAULT 0,      -- 0.000 to 1.000
    coverage_band       TEXT DEFAULT 'dead'
                        CHECK (coverage_band IN ('dead','thin','emerging','strong','dominant')),

    -- Signal components (for tooltip breakdown)
    demand_norm         NUMERIC(4,3) DEFAULT 0,
    supply_norm         NUMERIC(4,3) DEFAULT 0,
    balance_score       NUMERIC(4,3) DEFAULT 0,
    matchability_score  NUMERIC(4,3) DEFAULT 0,
    reliability_score   NUMERIC(4,3) DEFAULT 0,
    volatility_penalty  NUMERIC(4,3) DEFAULT 0,

    -- Trailing volumes (stability guard)
    trailing_7d_volume  INTEGER DEFAULT 0,
    trailing_30d_volume INTEGER DEFAULT 0
);

CREATE INDEX idx_cells_geohash ON coverage_cells(geohash);
CREATE INDEX idx_cells_updated ON coverage_cells(updated_at);
CREATE INDEX idx_cells_band ON coverage_cells(coverage_band);
CREATE INDEX idx_cells_country ON coverage_cells(admin_country);
CREATE INDEX idx_cells_centroid ON coverage_cells USING GIST(centroid_point);
CREATE INDEX idx_cells_confidence ON coverage_cells(coverage_confidence);

-- ────────────────────────────────────────────────────────────
-- 3. CONTACT LOGS — Gated actions
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contact_logs (
    contact_log_id      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Parties
    sender_id           UUID NOT NULL,
    recipient_id        UUID,
    job_id              UUID REFERENCES job_posts(job_id),

    -- Content
    message             TEXT,
    channel             TEXT NOT NULL DEFAULT 'in_app'
                        CHECK (channel IN ('in_app','email','sms')),

    -- Status
    status              TEXT DEFAULT 'sent'
                        CHECK (status IN ('sent','delivered','read','replied','spam_flagged')),

    -- Anti-spam
    sender_ip_hash      TEXT,
    rate_limit_key      TEXT,
    flagged             BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_contacts_sender ON contact_logs(sender_id);
CREATE INDEX idx_contacts_job ON contact_logs(job_id);
CREATE INDEX idx_contacts_created ON contact_logs(created_at);

-- ────────────────────────────────────────────────────────────
-- 4. ROLE EVENTS — Dual-audience tracking
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS role_events (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id             UUID,                      -- null for anonymous
    session_id          TEXT,
    event_type          TEXT NOT NULL
                        CHECK (event_type IN ('role_switch','role_detected','role_default_applied','onboarding_tooltip_shown','onboarding_tooltip_dismissed')),
    from_role           TEXT,
    to_role             TEXT NOT NULL
                        CHECK (to_role IN ('operator','shipper')),
    detection_method    TEXT,                       -- explicit_switch, authenticated_profile, cookie, utm_hint, first_click, default
    metadata            JSONB DEFAULT '{}'
);

CREATE INDEX idx_role_events_user ON role_events(user_id);
CREATE INDEX idx_role_events_type ON role_events(event_type);
CREATE INDEX idx_role_events_created ON role_events(created_at);

-- ────────────────────────────────────────────────────────────
-- RLS POLICIES
-- ────────────────────────────────────────────────────────────

ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_events ENABLE ROW LEVEL SECURITY;

-- Public can read open jobs
CREATE POLICY "public_read_open_jobs"
    ON job_posts FOR SELECT
    USING (status = 'open');

-- Poster can manage own jobs
CREATE POLICY "poster_manage_own_jobs"
    ON job_posts FOR ALL
    USING (auth.uid() = poster_account_id);

-- Public can read coverage cells (aggregated data)
CREATE POLICY "public_read_coverage"
    ON coverage_cells FOR SELECT
    USING (true);

-- Service role writes coverage cells
CREATE POLICY "service_write_coverage"
    ON coverage_cells FOR ALL
    USING (auth.role() = 'service_role');

-- Users can read own contacts
CREATE POLICY "user_read_own_contacts"
    ON contact_logs FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Auth users can create contacts
CREATE POLICY "auth_create_contacts"
    ON contact_logs FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Service role for role events
CREATE POLICY "service_role_events"
    ON role_events FOR ALL
    USING (auth.role() = 'service_role');

-- Users can read own role events
CREATE POLICY "user_read_role_events"
    ON role_events FOR SELECT
    USING (auth.uid() = user_id);
