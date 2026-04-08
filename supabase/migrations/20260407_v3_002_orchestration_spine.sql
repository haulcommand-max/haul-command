-- ============================================================================
-- HAUL COMMAND V3 — Migration Block 002: Core Orchestration Spine
-- ============================================================================
-- Prerequisites: block 001 (enums, helper functions)
-- FK order: events → workflows → skills → policies → configs → steps → runs
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. hc_events — Domain event bus (all system events land here)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      TEXT NOT NULL,                               -- e.g. 'profile.created', 'load.ingested'
    event_source    TEXT NOT NULL DEFAULT 'system',              -- 'web_app', 'api', 'browser_grid', 'cron', 'webhook'
    entity_type     hc_entity_type,
    entity_id       UUID,
    actor_type      hc_actor_type NOT NULL DEFAULT 'system',
    actor_id        UUID,
    country_code    TEXT,                                        -- ISO 3166-1 alpha-2
    region_code     TEXT,
    market_id       UUID,
    payload         JSONB NOT NULL DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued', 'processing', 'processed', 'failed', 'dead_letter')),
    idempotency_key TEXT,                                        -- Client-side dedup
    processed_at    TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hce_type_status ON hc_events (event_type, status);
CREATE INDEX IF NOT EXISTS idx_hce_entity ON hc_events (entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hce_created ON hc_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hce_country ON hc_events (country_code) WHERE country_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_hce_idempotency ON hc_events (idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TRIGGER hc_events_updated_at BEFORE UPDATE ON hc_events
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. hc_workflows — Registered workflow definitions
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_workflows (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_key    TEXT NOT NULL UNIQUE,                         -- e.g. 'profile_enrichment_v1'
    display_name    TEXT NOT NULL,
    description     TEXT,
    trigger_events  TEXT[] NOT NULL DEFAULT '{}',                 -- event types that trigger this
    is_enabled      BOOLEAN NOT NULL DEFAULT true,
    max_concurrency INTEGER NOT NULL DEFAULT 5,
    timeout_seconds INTEGER NOT NULL DEFAULT 300,
    retry_policy    JSONB NOT NULL DEFAULT '{"max_attempts": 3, "backoff_seconds": 30}',
    version         INTEGER NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER hc_workflows_updated_at BEFORE UPDATE ON hc_workflows
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. hc_skills — Registered skill catalog
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_skills (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_key       TEXT NOT NULL UNIQUE,                         -- e.g. 'broker_surface_creator'
    display_name    TEXT NOT NULL,
    description     TEXT,
    operating_group TEXT NOT NULL DEFAULT 'general',              -- 'acquisition', 'enrichment', 'monetization', 'seo', 'intelligence'
    skill_type      TEXT NOT NULL DEFAULT 'autonomous'
                    CHECK (skill_type IN ('autonomous', 'human_in_loop', 'hybrid', 'scheduled')),
    is_enabled      BOOLEAN NOT NULL DEFAULT true,
    version         INTEGER NOT NULL DEFAULT 1,
    model_preference TEXT,                                        -- 'sonnet', 'opus', 'gemini', null=default
    timeout_seconds INTEGER NOT NULL DEFAULT 120,
    cost_tier       TEXT NOT NULL DEFAULT 'standard'
                    CHECK (cost_tier IN ('free', 'standard', 'premium', 'opus')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcsk_group ON hc_skills (operating_group);
CREATE INDEX IF NOT EXISTS idx_hcsk_enabled ON hc_skills (is_enabled) WHERE is_enabled = true;

CREATE TRIGGER hc_skills_updated_at BEFORE UPDATE ON hc_skills
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. hc_model_policies — Which model to use when
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_model_policies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_key      TEXT NOT NULL UNIQUE,
    model_name      TEXT NOT NULL,                               -- 'claude-sonnet-4.6', 'gemini-3.5-pro', 'claude-opus'
    operating_group TEXT,                                        -- null = global default
    skill_key       TEXT,                                        -- null = group-level default
    cost_ceiling_usd NUMERIC(8,4),                              -- max cost per invocation
    max_tokens      INTEGER NOT NULL DEFAULT 4096,
    temperature     NUMERIC(3,2) NOT NULL DEFAULT 0.2,
    priority        INTEGER NOT NULL DEFAULT 50,                 -- higher = preferred
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER hc_model_policies_updated_at BEFORE UPDATE ON hc_model_policies
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. hc_country_configs — Per-country configuration
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_country_configs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code    TEXT NOT NULL UNIQUE,                         -- ISO 3166-1 alpha-2
    country_name    TEXT NOT NULL,
    currency_code   TEXT NOT NULL DEFAULT 'USD',
    measurement_system TEXT NOT NULL DEFAULT 'metric'
                    CHECK (measurement_system IN ('metric', 'imperial')),
    language_primary TEXT NOT NULL DEFAULT 'en',
    languages_supported TEXT[] NOT NULL DEFAULT '{en}',
    timezone_primary TEXT,
    regulatory_body TEXT,                                        -- e.g. 'FMCSA', 'NHVR', 'ESDAL'
    permit_complexity TEXT NOT NULL DEFAULT 'standard'
                    CHECK (permit_complexity IN ('simple', 'standard', 'complex', 'extreme')),
    escort_terminology JSONB NOT NULL DEFAULT '{}',              -- local terms for escort/pilot car
    market_state    TEXT NOT NULL DEFAULT 'dormant'
                    CHECK (market_state IN ('dormant', 'prepared', 'seed', 'live')),
    is_active       BOOLEAN NOT NULL DEFAULT false,
    feature_flags   JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hccc_state ON hc_country_configs (market_state);
CREATE INDEX IF NOT EXISTS idx_hccc_active ON hc_country_configs (is_active) WHERE is_active = true;

CREATE TRIGGER hc_country_configs_updated_at BEFORE UPDATE ON hc_country_configs
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. hc_market_configs — Per-market (city/region) configuration
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_market_configs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_key      TEXT NOT NULL UNIQUE,                         -- e.g. 'us-fl-tampa', 'au-qld-brisbane'
    country_code    TEXT NOT NULL REFERENCES hc_country_configs(country_code) ON DELETE RESTRICT,
    region_code     TEXT,
    city_name       TEXT,
    display_name    TEXT NOT NULL,
    market_mode     TEXT NOT NULL DEFAULT 'seeding'
                    CHECK (market_mode IN ('seeding', 'demand_capture', 'waitlist', 'live', 'shortage', 'rescue')),
    -- Telemetry
    supply_count    INTEGER NOT NULL DEFAULT 0,
    claimed_count   INTEGER NOT NULL DEFAULT 0,
    demand_signals_30d INTEGER NOT NULL DEFAULT 0,
    match_rate_30d  NUMERIC(5,4) NOT NULL DEFAULT 0,
    fill_rate_30d   NUMERIC(5,4) NOT NULL DEFAULT 0,
    avg_response_time_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
    sponsor_inventory_filled NUMERIC(5,4) NOT NULL DEFAULT 0,
    -- Config
    adgrid_enabled  BOOLEAN NOT NULL DEFAULT false,
    feature_flags   JSONB NOT NULL DEFAULT '{}',
    last_evaluated  TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcmc_country ON hc_market_configs (country_code);
CREATE INDEX IF NOT EXISTS idx_hcmc_mode ON hc_market_configs (market_mode);

CREATE TRIGGER hc_market_configs_updated_at BEFORE UPDATE ON hc_market_configs
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. hc_workflow_steps — Steps within a workflow (child of hc_workflows)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_workflow_steps (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id     UUID NOT NULL REFERENCES hc_workflows(id) ON DELETE CASCADE,
    step_order      INTEGER NOT NULL,
    skill_key       TEXT NOT NULL,                               -- references hc_skills.skill_key
    condition_expr  TEXT,                                        -- JSONPath or simple boolean expression
    on_failure      TEXT NOT NULL DEFAULT 'fail_workflow'
                    CHECK (on_failure IN ('fail_workflow', 'skip', 'retry', 'fallback')),
    fallback_skill_key TEXT,
    timeout_override_seconds INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workflow_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_hcws_workflow ON hc_workflow_steps (workflow_id, step_order);

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. hc_workflow_runs — Execution instances of workflows
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_workflow_runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id     UUID NOT NULL REFERENCES hc_workflows(id) ON DELETE RESTRICT,
    trigger_event_id UUID REFERENCES hc_events(id) ON DELETE SET NULL,
    status          hc_run_status NOT NULL DEFAULT 'queued',
    current_step    INTEGER NOT NULL DEFAULT 0,
    context         JSONB NOT NULL DEFAULT '{}',                 -- accumulated context from steps
    error_message   TEXT,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcwr_workflow ON hc_workflow_runs (workflow_id);
CREATE INDEX IF NOT EXISTS idx_hcwr_status ON hc_workflow_runs (status) WHERE status IN ('queued', 'running');
CREATE INDEX IF NOT EXISTS idx_hcwr_created ON hc_workflow_runs (created_at DESC);

CREATE TRIGGER hc_workflow_runs_updated_at BEFORE UPDATE ON hc_workflow_runs
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 9. hc_skill_runs — Execution instances of individual skills
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_skill_runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id        UUID NOT NULL REFERENCES hc_skills(id) ON DELETE RESTRICT,
    workflow_run_id UUID REFERENCES hc_workflow_runs(id) ON DELETE SET NULL,
    status          hc_run_status NOT NULL DEFAULT 'queued',
    input           JSONB NOT NULL DEFAULT '{}',
    output          JSONB,
    model_used      TEXT,
    tokens_in       INTEGER,
    tokens_out      INTEGER,
    cost_usd        NUMERIC(8,6),
    duration_ms     INTEGER,
    error_message   TEXT,
    retry_count     INTEGER NOT NULL DEFAULT 0,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcsr_skill ON hc_skill_runs (skill_id);
CREATE INDEX IF NOT EXISTS idx_hcsr_workflow_run ON hc_skill_runs (workflow_run_id) WHERE workflow_run_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hcsr_status ON hc_skill_runs (status) WHERE status IN ('queued', 'running');

CREATE TRIGGER hc_skill_runs_updated_at BEFORE UPDATE ON hc_skill_runs
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 10. hc_audit_logs — Immutable audit trail (standalone, no FKs)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type      hc_actor_type NOT NULL,
    actor_id        UUID,
    action          TEXT NOT NULL,                               -- 'create', 'update', 'delete', 'access', 'escalate'
    resource_type   TEXT NOT NULL,                               -- table or resource name
    resource_id     UUID,
    country_code    TEXT,
    changes         JSONB,                                       -- {field: {old, new}} for updates
    metadata        JSONB NOT NULL DEFAULT '{}',
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Append-only: no updated_at, no UPDATE trigger
CREATE INDEX IF NOT EXISTS idx_hcal_actor ON hc_audit_logs (actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_hcal_resource ON hc_audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_hcal_created ON hc_audit_logs (created_at DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- 11. RLS ENABLEMENT
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE hc_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_model_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_country_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_market_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_skill_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_audit_logs ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════════════════════
-- 12. SERVICE ROLE POLICIES (backend full access)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY hc_events_service ON hc_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_workflows_service ON hc_workflows FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_skills_service ON hc_skills FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_model_policies_service ON hc_model_policies FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_country_configs_service ON hc_country_configs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_market_configs_service ON hc_market_configs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_workflow_steps_service ON hc_workflow_steps FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_workflow_runs_service ON hc_workflow_runs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_skill_runs_service ON hc_skill_runs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_audit_logs_service ON hc_audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admin read access for orchestration internals
CREATE POLICY hc_workflows_admin_read ON hc_workflows FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY hc_skills_admin_read ON hc_skills FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY hc_workflow_runs_admin_read ON hc_workflow_runs FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY hc_audit_logs_admin_read ON hc_audit_logs FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');
