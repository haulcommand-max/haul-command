-- ============================================================================
-- HAUL COMMAND V3 — Migration Block 004: Browser Grid
-- ============================================================================
-- Prerequisites: block 001 (enums), block 002 (hc_workflow_runs)
-- FK order: targets → adapters → sessions → actions/extractions/failures/evidence
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. bg_targets — Registered scraping/interaction targets
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bg_targets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_key      TEXT NOT NULL UNIQUE,                        -- e.g. 'permit_portal_tx', 'load_board_dat'
    display_name    TEXT NOT NULL,
    base_url        TEXT NOT NULL,
    target_type     TEXT NOT NULL DEFAULT 'scraper'
                    CHECK (target_type IN ('scraper', 'api', 'form_submit', 'monitor', 'hybrid')),
    -- Scheduling
    crawl_frequency TEXT NOT NULL DEFAULT 'manual'
                    CHECK (crawl_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')),
    priority        INTEGER NOT NULL DEFAULT 50                  -- 1-100
                    CHECK (priority BETWEEN 1 AND 100),
    -- Health
    is_enabled      BOOLEAN NOT NULL DEFAULT true,
    health_status   TEXT NOT NULL DEFAULT 'unknown'
                    CHECK (health_status IN ('unknown', 'healthy', 'degraded', 'down', 'blocked')),
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    -- Auth
    auth_strategy   TEXT NOT NULL DEFAULT 'none'
                    CHECK (auth_strategy IN ('none', 'cookie', 'token', 'oauth', 'session')),
    auth_config     JSONB NOT NULL DEFAULT '{}',                -- encrypted credentials ref
    -- Config
    rate_limit_ms   INTEGER NOT NULL DEFAULT 2000,
    max_concurrent  INTEGER NOT NULL DEFAULT 1,
    user_agent_pool TEXT[] NOT NULL DEFAULT '{}',
    country_code    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bgt_type ON bg_targets (target_type);
CREATE INDEX IF NOT EXISTS idx_bgt_freq ON bg_targets (crawl_frequency) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_bgt_health ON bg_targets (health_status);

CREATE TRIGGER bg_targets_updated_at BEFORE UPDATE ON bg_targets
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. bg_target_adapters — Page-specific extraction adapters
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bg_target_adapters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id       UUID NOT NULL REFERENCES bg_targets(id) ON DELETE CASCADE,
    adapter_key     TEXT NOT NULL,                               -- e.g. 'search_results_parser', 'detail_page_extractor'
    adapter_type    TEXT NOT NULL DEFAULT 'css'
                    CHECK (adapter_type IN ('css', 'xpath', 'regex', 'llm', 'hybrid')),
    selectors       JSONB NOT NULL DEFAULT '{}',                -- CSS/XPath selectors
    output_schema   JSONB NOT NULL DEFAULT '{}',                -- expected output shape
    version         INTEGER NOT NULL DEFAULT 1,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (target_id, adapter_key)
);

CREATE TRIGGER bg_target_adapters_updated_at BEFORE UPDATE ON bg_target_adapters
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. bg_sessions — Individual browser sessions
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bg_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id       UUID NOT NULL REFERENCES bg_targets(id) ON DELETE RESTRICT,
    workflow_run_id UUID REFERENCES hc_workflow_runs(id) ON DELETE SET NULL,
    recipe_name     TEXT,                                        -- which replay recipe was used
    status          hc_run_status NOT NULL DEFAULT 'queued',
    -- Execution context
    fly_machine_id  TEXT,                                        -- Fly.io machine that ran this
    proxy_used      TEXT,
    viewport        JSONB NOT NULL DEFAULT '{"width": 1280, "height": 720}',
    -- Metrics
    actions_count   INTEGER NOT NULL DEFAULT 0,
    extractions_count INTEGER NOT NULL DEFAULT 0,
    pages_visited   INTEGER NOT NULL DEFAULT 0,
    bytes_downloaded BIGINT NOT NULL DEFAULT 0,
    -- Timing
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    duration_ms     INTEGER,
    -- Error
    error_type      TEXT,
    error_message   TEXT,
    error_screenshot_url TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bgs_target ON bg_sessions (target_id);
CREATE INDEX IF NOT EXISTS idx_bgs_status ON bg_sessions (status) WHERE status IN ('queued', 'running');
CREATE INDEX IF NOT EXISTS idx_bgs_created ON bg_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bgs_workflow ON bg_sessions (workflow_run_id) WHERE workflow_run_id IS NOT NULL;

CREATE TRIGGER bg_sessions_updated_at BEFORE UPDATE ON bg_sessions
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. bg_actions — Individual browser actions within a session
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bg_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES bg_sessions(id) ON DELETE CASCADE,
    action_order    INTEGER NOT NULL,
    action_type     TEXT NOT NULL,                               -- 'navigate', 'click', 'type', 'wait', 'scroll', 'screenshot', 'extract'
    selector        TEXT,
    input_value     TEXT,
    url             TEXT,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'executing', 'succeeded', 'failed', 'skipped')),
    duration_ms     INTEGER,
    error_message   TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bga_session ON bg_actions (session_id, action_order);

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. bg_extractions — Data extracted during sessions
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bg_extractions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES bg_sessions(id) ON DELETE CASCADE,
    adapter_key     TEXT,
    extraction_type TEXT NOT NULL,                               -- 'entity', 'load', 'permit', 'regulation', 'price', 'contact'
    source_url      TEXT,
    raw_data        JSONB NOT NULL DEFAULT '{}',
    normalized_data JSONB,                                       -- post-processing output
    confidence      NUMERIC(3,2) NOT NULL DEFAULT 0.5,
    is_duplicate    BOOLEAN NOT NULL DEFAULT false,
    dedupe_cluster_id UUID,
    promoted_to     TEXT,                                        -- 'hc_entities', 'hc_loads', etc.
    promoted_id     UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bge_session ON bg_extractions (session_id);
CREATE INDEX IF NOT EXISTS idx_bge_type ON bg_extractions (extraction_type);
CREATE INDEX IF NOT EXISTS idx_bge_confidence ON bg_extractions (confidence DESC);
CREATE INDEX IF NOT EXISTS idx_bge_promoted ON bg_extractions (promoted_to, promoted_id) WHERE promoted_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bge_raw ON bg_extractions USING gin (raw_data);

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. bg_replay_recipes — Reusable browser automation scripts
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bg_replay_recipes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id       UUID NOT NULL REFERENCES bg_targets(id) ON DELETE CASCADE,
    recipe_name     TEXT NOT NULL,
    description     TEXT,
    steps           JSONB NOT NULL DEFAULT '[]',                 -- ordered action definitions
    variables       JSONB NOT NULL DEFAULT '{}',                 -- parameterizable inputs
    version         INTEGER NOT NULL DEFAULT 1,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    success_rate    NUMERIC(5,4) NOT NULL DEFAULT 0,
    total_runs      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (target_id, recipe_name)
);

CREATE TRIGGER bg_replay_recipes_updated_at BEFORE UPDATE ON bg_replay_recipes
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. bg_failures — Failure analysis for self-healing
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bg_failures (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES bg_sessions(id) ON DELETE CASCADE,
    failure_type    TEXT NOT NULL,                               -- 'selector_missing', 'captcha', 'rate_limited', 'auth_expired', 'timeout', 'blocked'
    severity        TEXT NOT NULL DEFAULT 'medium'
                    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    page_url        TEXT,
    screenshot_url  TEXT,
    dom_snapshot_url TEXT,
    auto_heal_attempted BOOLEAN NOT NULL DEFAULT false,
    auto_heal_succeeded BOOLEAN,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bgf_session ON bg_failures (session_id);
CREATE INDEX IF NOT EXISTS idx_bgf_type ON bg_failures (failure_type);

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. bg_evidence_packets — Proof-of-work for compliance
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bg_evidence_packets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES bg_sessions(id) ON DELETE CASCADE,
    packet_type     TEXT NOT NULL DEFAULT 'compliance'
                    CHECK (packet_type IN ('compliance', 'verification', 'audit', 'dispute_support')),
    screenshots     TEXT[] NOT NULL DEFAULT '{}',                -- storage paths
    har_file_url    TEXT,
    dom_snapshots   TEXT[] NOT NULL DEFAULT '{}',
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bgep_session ON bg_evidence_packets (session_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 9. RLS — All browser grid tables are backend/service only
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE bg_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bg_target_adapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE bg_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bg_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bg_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bg_replay_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bg_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE bg_evidence_packets ENABLE ROW LEVEL SECURITY;

CREATE POLICY bg_targets_service ON bg_targets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY bg_target_adapters_service ON bg_target_adapters FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY bg_sessions_service ON bg_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY bg_actions_service ON bg_actions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY bg_extractions_service ON bg_extractions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY bg_replay_recipes_service ON bg_replay_recipes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY bg_failures_service ON bg_failures FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY bg_evidence_packets_service ON bg_evidence_packets FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admin: diagnostic read on sessions and failures only
CREATE POLICY bg_sessions_admin_read ON bg_sessions FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY bg_failures_admin_read ON bg_failures FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');
