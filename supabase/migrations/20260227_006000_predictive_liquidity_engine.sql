-- ============================================================
-- HAUL COMMAND — Predictive Liquidity Engine Schema
-- Spec: Predictive Liquidity Engine v1.0.0
-- Date: 2026-02-27
-- ============================================================
-- Tables: corridor_liquidity_forecasts, corridor_feature_store_daily,
--         pre_activation_recommendations, pre_activation_executions,
--         forecast_model_registry, pre_activation_playbooks
-- Purpose: 7/14/21-day corridor forecasting + pre-activation automation
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. CORRIDOR LIQUIDITY FORECASTS — predicted CLS + metrics
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS corridor_liquidity_forecasts (
    id                  BIGSERIAL PRIMARY KEY,
    corridor_id         UUID NOT NULL,
    forecast_date       DATE NOT NULL,
    horizon_days        SMALLINT NOT NULL,          -- 7 | 14 | 21
    target_date         DATE NOT NULL,              -- forecast_date + horizon_days

    cls_pred            NUMERIC,                    -- predicted CLS 0-100
    match_rate_pred     NUMERIC,                    -- predicted match %
    participation_pred  NUMERIC,                    -- predicted supply participation %
    demand_posts_pred   NUMERIC,                    -- predicted demand posts count
    supply_active_pred  NUMERIC,                    -- predicted active supply count
    time_to_match_minutes_pred NUMERIC,             -- predicted median minutes

    risk_band           TEXT CHECK (risk_band IN ('green','yellow','red')),
    risk_score          NUMERIC,                    -- 0-100

    model_version       TEXT DEFAULT 'v1',
    confidence          NUMERIC,                    -- 0-1
    created_at          TIMESTAMPTZ DEFAULT now(),

    UNIQUE(corridor_id, forecast_date, horizon_days)
);

CREATE INDEX idx_forecasts_corridor ON corridor_liquidity_forecasts(corridor_id, target_date);
CREATE INDEX idx_forecasts_risk ON corridor_liquidity_forecasts(risk_band, horizon_days);

-- ────────────────────────────────────────────────────────────
-- 2. CORRIDOR FEATURE STORE (DAILY) — training/forecast signals
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS corridor_feature_store_daily (
    id                  BIGSERIAL PRIMARY KEY,
    corridor_id         UUID NOT NULL,
    snapshot_date       DATE NOT NULL,

    -- Core metrics
    cls                 NUMERIC,
    stage               TEXT,
    match_rate          NUMERIC,
    participation_rate  NUMERIC,
    verified_supply_count INTEGER,
    activated_supply_count INTEGER,
    demand_accounts_count INTEGER,
    demand_posts_count  INTEGER,
    repeat_poster_rate  NUMERIC,
    verification_rate   NUMERIC,
    median_time_to_match_minutes NUMERIC,

    -- Trend features (7d deltas)
    cls_delta_7d        NUMERIC,
    match_rate_delta_7d NUMERIC,
    participation_delta_7d NUMERIC,
    demand_posts_delta_7d NUMERIC,
    supply_active_delta_7d NUMERIC,
    time_to_match_delta_7d NUMERIC,

    -- Moving averages
    cls_ma_7d           NUMERIC,
    cls_ma_14d          NUMERIC,
    match_rate_ma_7d    NUMERIC,
    participation_ma_7d NUMERIC,
    demand_posts_ma_7d  NUMERIC,
    time_to_match_ma_7d NUMERIC,

    -- Health signals
    phantom_supply_flag BOOLEAN DEFAULT FALSE,
    backlog_flag        BOOLEAN DEFAULT FALSE,
    warning_count_7d    INTEGER DEFAULT 0,
    critical_count_7d   INTEGER DEFAULT 0,

    -- VAPI engagement signals
    vapi_connected_rate_7d NUMERIC,
    vapi_engaged_rate_7d NUMERIC,
    claim_start_rate_7d NUMERIC,
    verify_rate_7d      NUMERIC,
    activation_rate_7d  NUMERIC,

    -- Compliance constraints
    country_code        TEXT,
    calling_risk_tier   TEXT,
    quiet_hours_block_rate_7d NUMERIC,
    consent_block_rate_7d NUMERIC,

    created_at          TIMESTAMPTZ DEFAULT now(),

    UNIQUE(corridor_id, snapshot_date)
);

CREATE INDEX idx_features_corridor ON corridor_feature_store_daily(corridor_id, snapshot_date);

-- ────────────────────────────────────────────────────────────
-- 3. PRE-ACTIVATION RECOMMENDATIONS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pre_activation_recommendations (
    id                  BIGSERIAL PRIMARY KEY,
    corridor_id         UUID NOT NULL,
    forecast_date       DATE NOT NULL,
    horizon_days        SMALLINT NOT NULL,
    target_date         DATE NOT NULL,

    recommendation_type TEXT NOT NULL
                        CHECK (recommendation_type IN ('supply','demand','both')),
    playbook_key        TEXT NOT NULL,
    priority            TEXT DEFAULT 'medium'
                        CHECK (priority IN ('low','medium','high','critical')),

    recommended_actions JSONB NOT NULL,
    expected_impact     JSONB,
    safety_constraints  JSONB,

    status              TEXT DEFAULT 'queued'
                        CHECK (status IN ('queued','running','completed','skipped','blocked')),
    blocked_reason      TEXT,

    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_recs_corridor ON pre_activation_recommendations(corridor_id, forecast_date);
CREATE INDEX idx_recs_status ON pre_activation_recommendations(status, priority);

-- ────────────────────────────────────────────────────────────
-- 4. PRE-ACTIVATION EXECUTIONS — what we actually did
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pre_activation_executions (
    id                  BIGSERIAL PRIMARY KEY,
    recommendation_id   BIGINT REFERENCES pre_activation_recommendations(id) ON DELETE CASCADE,
    corridor_id         UUID NOT NULL,
    executed_at         TIMESTAMPTZ DEFAULT now(),

    channel             TEXT
                        CHECK (channel IN ('vapi_call','email','sms','in_app','ads_retarget','manual_queue')),
    entity_type         TEXT
                        CHECK (entity_type IN ('operator','broker','place','account')),
    entity_id           UUID,

    execution_payload   JSONB,
    outcome             TEXT
                        CHECK (outcome IN ('success','fail','blocked','skipped')),
    outcome_detail      TEXT
);

CREATE INDEX idx_exec_rec ON pre_activation_executions(recommendation_id);
CREATE INDEX idx_exec_corridor ON pre_activation_executions(corridor_id, executed_at);
CREATE INDEX idx_exec_entity ON pre_activation_executions(entity_id);

-- ────────────────────────────────────────────────────────────
-- 5. FORECAST MODEL REGISTRY — versioned + governance
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forecast_model_registry (
    model_key           TEXT PRIMARY KEY,
    model_version       TEXT NOT NULL,
    method              TEXT NOT NULL
                        CHECK (method IN ('ewma','linear','prophet_like','xgb_like','hybrid')),
    enabled             BOOLEAN DEFAULT TRUE,
    calibration         JSONB,
    guardrails          JSONB,
    last_trained_at     TIMESTAMPTZ,
    notes               TEXT
);

-- Seed default model
INSERT INTO forecast_model_registry(model_key, model_version, method, enabled, guardrails)
VALUES (
    'cls_forecaster_v1', 'v1', 'hybrid', TRUE,
    '{"max_daily_cls_delta":18,"min_history_days":21,"min_corridor_records":14,"disable_if_data_quality_low":true}'
) ON CONFLICT (model_key) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 6. PRE-ACTIVATION PLAYBOOKS — structured, localizable
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pre_activation_playbooks (
    playbook_key        TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    applies_to          TEXT NOT NULL
                        CHECK (applies_to IN ('supply','demand','both')),
    min_risk_band       TEXT DEFAULT 'yellow'
                        CHECK (min_risk_band IN ('green','yellow','red')),
    action_bundle       JSONB NOT NULL,
    default_caps        JSONB NOT NULL,
    localization_pack_key TEXT,
    enabled             BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- Seed playbooks
INSERT INTO pre_activation_playbooks(playbook_key, name, applies_to, min_risk_band, action_bundle, default_caps)
VALUES
    ('supply_pre_activation_v1', 'Supply Pre-Activation (7-21d)', 'supply', 'yellow',
     '{"steps":["select_verified_activated_idle","outreach_in_app_email_vapi","reactivation_48h_followup"]}',
     '{"max_entities_per_day":250,"max_calls_per_entity_30d":2,"max_sms_per_entity_30d":2,"max_emails_per_entity_30d":3}'),

    ('demand_pre_activation_v1', 'Demand Pre-Activation (7-21d)', 'demand', 'yellow',
     '{"steps":["select_active_brokers_carriers","outreach_email_in_app_vapi","pre_schedule_load_intent"]}',
     '{"max_accounts_per_day":120,"max_calls_per_entity_30d":2}'),

    ('emergency_stabilize_v1', 'Emergency Stabilize', 'both', 'red',
     '{"steps":["freeze_paid","increase_supply_outreach_1.6x","manual_ops_queue","pin_high_trust","lower_claim_friction","backlog_surge"]}',
     '{"max_entities_per_day":400,"max_calls_per_entity_30d":3}'),

    ('dominance_accelerator_v1', 'Dominance Accelerator', 'both', 'green',
     '{"steps":["supply_referral_loop","badge_unlocks","availability_toggle","priority_routing_trial","repeat_posting_nudge","contract_lane_setup"]}',
     '{"max_entities_per_day":220,"max_calls_per_entity_30d":2}')
ON CONFLICT (playbook_key) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- RLS — service_role only (internal ops)
-- ────────────────────────────────────────────────────────────

ALTER TABLE corridor_liquidity_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE corridor_feature_store_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_activation_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_activation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_model_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_activation_playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_forecasts" ON corridor_liquidity_forecasts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_features" ON corridor_feature_store_daily FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_recs" ON pre_activation_recommendations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_executions" ON pre_activation_executions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_models" ON forecast_model_registry FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_playbooks" ON pre_activation_playbooks FOR ALL USING (auth.role() = 'service_role');
