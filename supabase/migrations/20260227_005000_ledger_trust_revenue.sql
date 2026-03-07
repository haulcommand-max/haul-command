-- ============================================================
-- HAUL COMMAND — Verified Job Ledger + Trust/Leaderboard + Revenue Tables
-- Spec: Load Board v1.1.0 + Revenue Hardening v1.0.0
-- Date: 2026-02-27
-- ============================================================
-- Verified Job Ledger: verified_jobs, verified_job_events,
--                      evidence_packs, attestation_edges
-- Trust & Leaderboard: trust_score_snapshots, leaderboard_snapshots
-- Revenue Engines: corridor_urgency_metrics, corridor_scarcity_metrics
-- Trust Graph: trust_graph_edges
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. VERIFIED JOBS — Canonical job record once created/claimed
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS verified_jobs (
    verified_job_id     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id              UUID REFERENCES job_posts(job_id),
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,

    country             TEXT,
    admin1              TEXT,
    escort_type         TEXT,

    pickup_time         TIMESTAMPTZ,
    completion_time     TIMESTAMPTZ,

    status              TEXT DEFAULT 'open'
                        CHECK (status IN ('open','in_progress','completed','cancelled','disputed')),

    payout_minor        BIGINT,
    currency            TEXT DEFAULT 'USD',

    operator_id         UUID,
    poster_account_id   UUID,

    reliability_grade   TEXT DEFAULT 'unknown'
                        CHECK (reliability_grade IN ('unknown','ok','good','excellent'))
);

CREATE INDEX idx_verified_jobs_status ON verified_jobs(status, completion_time);
CREATE INDEX idx_verified_jobs_operator ON verified_jobs(operator_id);
CREATE INDEX idx_verified_jobs_poster ON verified_jobs(poster_account_id);
CREATE INDEX idx_verified_jobs_country ON verified_jobs(country);

-- ────────────────────────────────────────────────────────────
-- 2. VERIFIED JOB EVENTS — Append-only event log
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS verified_job_events (
    ledger_event_id     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    verified_job_id     UUID NOT NULL REFERENCES verified_jobs(verified_job_id),
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,

    actor_account_id    UUID NOT NULL,
    actor_role          TEXT NOT NULL
                        CHECK (actor_role IN ('operator','shipper','broker','admin')),

    event_type          TEXT NOT NULL
                        CHECK (event_type IN (
                            'attest_completed','attest_cancelled','attest_paid',
                            'attest_disputed','attest_resolved','evidence_added'
                        )),

    event_payload       JSONB DEFAULT '{}',
    evidence_pack_id    UUID,
    event_hash          TEXT
);

CREATE INDEX idx_vj_events_job ON verified_job_events(verified_job_id, created_at);
CREATE INDEX idx_vj_events_actor ON verified_job_events(actor_account_id);

-- ────────────────────────────────────────────────────────────
-- 3. EVIDENCE PACKS — Structured evidence container
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS evidence_packs (
    evidence_pack_id    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,

    owner_account_id    UUID NOT NULL,

    kind                TEXT NOT NULL
                        CHECK (kind IN ('ratecon','messages','call_logs','gps','photo','pdf','other')),

    storage_refs        JSONB NOT NULL DEFAULT '[]',

    redaction_status    TEXT DEFAULT 'raw'
                        CHECK (redaction_status IN ('raw','redacted','verified_redacted')),

    pii_risk_score      NUMERIC(3,2) DEFAULT 0
);

CREATE INDEX idx_evidence_owner ON evidence_packs(owner_account_id);

-- ────────────────────────────────────────────────────────────
-- 4. ATTESTATION EDGES — Multi-party consensus tracking
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS attestation_edges (
    edge_id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    verified_job_id     UUID NOT NULL REFERENCES verified_jobs(verified_job_id),

    operator_attested   BOOLEAN DEFAULT FALSE,
    shipper_attested    BOOLEAN DEFAULT FALSE,
    broker_attested     BOOLEAN DEFAULT FALSE,

    consensus_level     TEXT DEFAULT 'none'
                        CHECK (consensus_level IN ('none','single_party','two_party','three_party')),

    last_updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attestation_job ON attestation_edges(verified_job_id);
CREATE INDEX idx_attestation_consensus ON attestation_edges(consensus_level);

-- ────────────────────────────────────────────────────────────
-- 5. TRUST SCORE SNAPSHOTS — Historical trust tracking
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trust_score_snapshots (
    id                  BIGSERIAL PRIMARY KEY,
    account_id          UUID NOT NULL,
    computed_at         TIMESTAMPTZ DEFAULT now() NOT NULL,

    trust_score         NUMERIC(5,2) NOT NULL,   -- 0-100
    trust_tier          TEXT NOT NULL
                        CHECK (trust_tier IN ('unverified','emerging','verified','verified_elite')),

    -- Component breakdown
    identity_verification   NUMERIC(4,3) DEFAULT 0,
    profile_completeness    NUMERIC(4,3) DEFAULT 0,
    responsiveness          NUMERIC(4,3) DEFAULT 0,
    completion_quality      NUMERIC(4,3) DEFAULT 0,
    ledger_reliability      NUMERIC(4,3) DEFAULT 0,
    community_signal        NUMERIC(4,3) DEFAULT 0,
    anti_gaming_health      NUMERIC(4,3) DEFAULT 0,

    country_iso2        TEXT,
    admin1              TEXT
);

CREATE INDEX idx_trust_account ON trust_score_snapshots(account_id, computed_at);
CREATE INDEX idx_trust_tier ON trust_score_snapshots(trust_tier);

-- ────────────────────────────────────────────────────────────
-- 6. LEADERBOARD SNAPSHOTS — Ranked positions by scope
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
    id                  BIGSERIAL PRIMARY KEY,
    computed_at         TIMESTAMPTZ DEFAULT now() NOT NULL,

    scope_type          TEXT NOT NULL
                        CHECK (scope_type IN ('global','country','admin1','corridor')),
    scope_key           TEXT NOT NULL,          -- e.g., 'US', 'US-TX', corridor_id

    account_id          UUID NOT NULL,
    leaderboard_score   NUMERIC(7,2) NOT NULL,  -- 0-1000
    rank                INTEGER NOT NULL,

    -- Score components
    trust_component     NUMERIC(6,2) DEFAULT 0,
    velocity_component  NUMERIC(6,2) DEFAULT 0,
    responsiveness_component NUMERIC(6,2) DEFAULT 0,
    profile_component   NUMERIC(6,2) DEFAULT 0,
    stability_component NUMERIC(6,2) DEFAULT 0,

    -- Penalties applied
    penalties_total     NUMERIC(6,2) DEFAULT 0,
    capped             BOOLEAN DEFAULT FALSE,
    cap_reason         TEXT
);

CREATE INDEX idx_lb_scope ON leaderboard_snapshots(scope_type, scope_key, rank);
CREATE INDEX idx_lb_account ON leaderboard_snapshots(account_id, computed_at);
CREATE INDEX idx_lb_computed ON leaderboard_snapshots(computed_at);

-- ────────────────────────────────────────────────────────────
-- 7. CORRIDOR URGENCY METRICS — Time-pressure monetization
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS corridor_urgency_metrics (
    id                  BIGSERIAL PRIMARY KEY,
    corridor_id         UUID NOT NULL,
    snapshot_date       DATE NOT NULL,

    median_time_to_match_minutes NUMERIC,
    demand_backlog_ratio NUMERIC,
    failed_match_rate   NUMERIC,

    urgency_score       NUMERIC(4,3),          -- 0-1
    urgency_multiplier  NUMERIC(4,2),          -- 1.00-1.65

    created_at          TIMESTAMPTZ DEFAULT now(),

    UNIQUE(corridor_id, snapshot_date)
);

-- ────────────────────────────────────────────────────────────
-- 8. CORRIDOR SCARCITY METRICS — Coverage gap monetization
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS corridor_scarcity_metrics (
    id                  BIGSERIAL PRIMARY KEY,
    corridor_id         UUID NOT NULL,
    snapshot_date       DATE NOT NULL,

    verified_supply_count INTEGER,
    active_demand_count INTEGER,
    failed_match_attempts INTEGER,

    coverage_gap_score  NUMERIC(4,3),          -- 0-1
    scarcity_tier       TEXT
                        CHECK (scarcity_tier IN ('normal','tight','constrained','critical')),
    scarcity_fee_multiplier NUMERIC(4,2),      -- 1.00-1.30

    created_at          TIMESTAMPTZ DEFAULT now(),

    UNIQUE(corridor_id, snapshot_date)
);

-- ────────────────────────────────────────────────────────────
-- 9. TRUST GRAPH EDGES — Broker ↔ Operator relationship memory
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trust_graph_edges (
    edge_id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at          TIMESTAMPTZ DEFAULT now() NOT NULL,

    broker_account_id   UUID NOT NULL,
    operator_account_id UUID NOT NULL,

    -- Relationship signals
    completed_jobs      INTEGER DEFAULT 0,
    positive_feedback   INTEGER DEFAULT 0,
    negative_feedback   INTEGER DEFAULT 0,
    total_interactions  INTEGER DEFAULT 0,

    -- Computed
    relationship_strength NUMERIC(4,3) DEFAULT 0,  -- 0-1
    is_preferred_pair   BOOLEAN DEFAULT FALSE,

    -- Anti-gaming
    collusion_risk_score NUMERIC(4,3) DEFAULT 0,

    UNIQUE(broker_account_id, operator_account_id)
);

CREATE INDEX idx_trust_graph_broker ON trust_graph_edges(broker_account_id);
CREATE INDEX idx_trust_graph_operator ON trust_graph_edges(operator_account_id);
CREATE INDEX idx_trust_graph_preferred ON trust_graph_edges(is_preferred_pair) WHERE is_preferred_pair = TRUE;

-- ────────────────────────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────────────────────────

ALTER TABLE verified_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_job_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attestation_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE corridor_urgency_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE corridor_scarcity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_graph_edges ENABLE ROW LEVEL SECURITY;

-- Verified jobs: participants can view
CREATE POLICY "participants_read_verified_jobs"
    ON verified_jobs FOR SELECT
    USING (auth.uid() = operator_id OR auth.uid() = poster_account_id);

CREATE POLICY "service_write_verified_jobs"
    ON verified_jobs FOR ALL
    USING (auth.role() = 'service_role');

-- Events: participants can view
CREATE POLICY "participants_read_vj_events"
    ON verified_job_events FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM verified_jobs vj
        WHERE vj.verified_job_id = verified_job_events.verified_job_id
        AND (vj.operator_id = auth.uid() OR vj.poster_account_id = auth.uid())
    ));

CREATE POLICY "service_write_vj_events"
    ON verified_job_events FOR ALL
    USING (auth.role() = 'service_role');

-- Evidence: owner only
CREATE POLICY "owner_read_evidence"
    ON evidence_packs FOR SELECT
    USING (auth.uid() = owner_account_id);

CREATE POLICY "owner_manage_evidence"
    ON evidence_packs FOR ALL
    USING (auth.uid() = owner_account_id OR auth.role() = 'service_role');

-- Attestation: service role
CREATE POLICY "service_attestation"
    ON attestation_edges FOR ALL
    USING (auth.role() = 'service_role');

-- Trust/leaderboard: public read
CREATE POLICY "public_read_trust"
    ON trust_score_snapshots FOR SELECT USING (true);

CREATE POLICY "service_write_trust"
    ON trust_score_snapshots FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "public_read_leaderboard"
    ON leaderboard_snapshots FOR SELECT USING (true);

CREATE POLICY "service_write_leaderboard"
    ON leaderboard_snapshots FOR ALL
    USING (auth.role() = 'service_role');

-- Revenue metrics: service role
CREATE POLICY "service_urgency"
    ON corridor_urgency_metrics FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "service_scarcity"
    ON corridor_scarcity_metrics FOR ALL
    USING (auth.role() = 'service_role');

-- Trust graph: service role + participant read
CREATE POLICY "service_trust_graph"
    ON trust_graph_edges FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "participant_read_trust_graph"
    ON trust_graph_edges FOR SELECT
    USING (auth.uid() = broker_account_id OR auth.uid() = operator_account_id);
