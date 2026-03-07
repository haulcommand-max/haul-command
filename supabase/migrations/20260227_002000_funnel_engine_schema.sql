-- ============================================================
-- HAUL COMMAND — Autonomous Funnel Engine Schema
-- Spec: Funnel Blueprint v1.0.0
-- Date: 2026-02-27
-- ============================================================
-- Tracks dual funnel (supply + demand), corridor liquidity,
-- VAPI conversation outcomes, ad autopilot state, and
-- early warning signals across all 52 countries.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. SUPPLY FUNNEL — Operator Pipeline
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS funnel_supply_records (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_iso2    TEXT NOT NULL,
    corridor_id     TEXT,
    -- Contact info (hashed for privacy)
    entity_name     TEXT,
    phone_hash      TEXT,
    email_hash      TEXT,
    source          TEXT NOT NULL DEFAULT 'scrape',  -- scrape, referral, organic, import, vapi_inbound
    -- Funnel stage tracking
    stage           TEXT NOT NULL DEFAULT 'raw',     -- raw, contactable, contacted, conversation, claim_started, verified, activated, load_participating
    stage_updated_at TIMESTAMPTZ DEFAULT now(),
    -- Stage timestamps
    scraped_at      TIMESTAMPTZ DEFAULT now(),
    contactable_at  TIMESTAMPTZ,
    contacted_at    TIMESTAMPTZ,
    conversation_at TIMESTAMPTZ,
    claim_started_at TIMESTAMPTZ,
    verified_at     TIMESTAMPTZ,
    activated_at    TIMESTAMPTZ,
    first_load_at   TIMESTAMPTZ,
    -- Quality signals
    phone_valid     BOOLEAN DEFAULT FALSE,
    language_detected TEXT,
    vapi_call_id    TEXT,
    claim_id        UUID,
    operator_id     UUID,
    -- Metadata
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_supply_country ON funnel_supply_records(country_iso2);
CREATE INDEX idx_supply_stage ON funnel_supply_records(stage);
CREATE INDEX idx_supply_corridor ON funnel_supply_records(corridor_id);
CREATE INDEX idx_supply_source ON funnel_supply_records(source);
CREATE INDEX idx_supply_created ON funnel_supply_records(created_at);

-- ────────────────────────────────────────────────────────────
-- 2. DEMAND FUNNEL — Broker/Carrier Pipeline
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS funnel_demand_records (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_iso2    TEXT NOT NULL,
    corridor_id     TEXT,
    -- Contact info
    company_name    TEXT,
    contact_name    TEXT,
    phone_hash      TEXT,
    email_hash      TEXT,
    source          TEXT NOT NULL DEFAULT 'scrape',  -- scrape, referral, organic, import, vapi_inbound, inbound_web
    company_type    TEXT DEFAULT 'broker',           -- broker, carrier, shipper, agency
    -- Funnel stage
    stage           TEXT NOT NULL DEFAULT 'identified', -- identified, contactable, contacted, conversation, account_created, first_load, repeat_poster
    stage_updated_at TIMESTAMPTZ DEFAULT now(),
    -- Stage timestamps
    identified_at   TIMESTAMPTZ DEFAULT now(),
    contactable_at  TIMESTAMPTZ,
    contacted_at    TIMESTAMPTZ,
    conversation_at TIMESTAMPTZ,
    account_created_at TIMESTAMPTZ,
    first_load_at   TIMESTAMPTZ,
    repeat_load_at  TIMESTAMPTZ,
    -- Quality signals
    phone_valid     BOOLEAN DEFAULT FALSE,
    language_detected TEXT,
    vapi_call_id    TEXT,
    account_id      UUID,
    -- Metadata
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_demand_country ON funnel_demand_records(country_iso2);
CREATE INDEX idx_demand_stage ON funnel_demand_records(stage);
CREATE INDEX idx_demand_corridor ON funnel_demand_records(corridor_id);
CREATE INDEX idx_demand_type ON funnel_demand_records(company_type);

-- ────────────────────────────────────────────────────────────
-- 3. VAPI CALL LOG — Every conversation tracked
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vapi_call_log (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    call_id         TEXT UNIQUE NOT NULL,            -- VAPI's call identifier
    country_iso2    TEXT NOT NULL,
    corridor_id     TEXT,
    direction       TEXT NOT NULL DEFAULT 'outbound', -- outbound, inbound
    funnel_side     TEXT NOT NULL DEFAULT 'supply',   -- supply, demand
    record_id       UUID,                            -- FK to supply or demand record
    -- Call metrics
    connected       BOOLEAN DEFAULT FALSE,
    duration_seconds INTEGER DEFAULT 0,
    engaged_past_20s BOOLEAN DEFAULT FALSE,
    -- Intent signals
    intent_positive BOOLEAN DEFAULT FALSE,
    intent_negative BOOLEAN DEFAULT FALSE,
    intent_neutral  BOOLEAN DEFAULT FALSE,
    claim_prompt_accepted BOOLEAN DEFAULT FALSE,
    claim_link_sent BOOLEAN DEFAULT FALSE,
    -- Language
    language_target TEXT,                            -- language we tried
    language_detected TEXT,                          -- language user spoke
    language_match  BOOLEAN DEFAULT TRUE,
    -- Outcome
    outcome         TEXT DEFAULT 'no_answer',        -- no_answer, voicemail, connected_positive, connected_negative, connected_neutral, callback_requested, wrong_number, do_not_call
    -- Script tracking
    script_variant  TEXT,
    voice_model     TEXT,
    -- Timestamps
    started_at      TIMESTAMPTZ DEFAULT now(),
    ended_at        TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vapi_country ON vapi_call_log(country_iso2);
CREATE INDEX idx_vapi_outcome ON vapi_call_log(outcome);
CREATE INDEX idx_vapi_funnel ON vapi_call_log(funnel_side);
CREATE INDEX idx_vapi_connected ON vapi_call_log(connected);
CREATE INDEX idx_vapi_started ON vapi_call_log(started_at);
CREATE INDEX idx_vapi_intent ON vapi_call_log(intent_positive);

-- ────────────────────────────────────────────────────────────
-- 4. CORRIDOR LIQUIDITY SNAPSHOTS — Daily scoring
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS corridor_liquidity_snapshots (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    corridor_id     TEXT NOT NULL,
    country_iso2    TEXT NOT NULL,
    snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Supply metrics
    raw_records             INTEGER DEFAULT 0,
    contactable_records     INTEGER DEFAULT 0,
    contacted               INTEGER DEFAULT 0,
    conversations_started   INTEGER DEFAULT 0,
    claims_started          INTEGER DEFAULT 0,
    verified_operators      INTEGER DEFAULT 0,
    activated_operators     INTEGER DEFAULT 0,
    load_participating      INTEGER DEFAULT 0,
    -- Demand metrics
    prospects_identified    INTEGER DEFAULT 0,
    prospects_contactable   INTEGER DEFAULT 0,
    demand_conversations    INTEGER DEFAULT 0,
    accounts_created        INTEGER DEFAULT 0,
    loads_posted            INTEGER DEFAULT 0,
    loads_matched           INTEGER DEFAULT 0,
    repeat_posters          INTEGER DEFAULT 0,
    -- Computed rates
    record_coverage_pct     NUMERIC(5,2) DEFAULT 0,
    outreach_penetration_pct NUMERIC(5,2) DEFAULT 0,
    conversation_rate_pct   NUMERIC(5,2) DEFAULT 0,
    claim_start_rate_pct    NUMERIC(5,2) DEFAULT 0,
    verification_rate_pct   NUMERIC(5,2) DEFAULT 0,
    activation_rate_pct     NUMERIC(5,2) DEFAULT 0,
    load_participation_pct  NUMERIC(5,2) DEFAULT 0,
    match_rate_pct          NUMERIC(5,2) DEFAULT 0,
    repeat_poster_rate_pct  NUMERIC(5,2) DEFAULT 0,
    -- Corridor Liquidity Score (CLS)
    cls_score               INTEGER DEFAULT 0,       -- 0-100
    -- Stage classification
    stage                   TEXT DEFAULT 'seeding',  -- seeding, early_liquidity, market_formation, corridor_dominance
    -- Velocity metrics
    median_time_to_claim_hours   NUMERIC(8,2),
    median_time_to_load_hours    NUMERIC(8,2),
    median_time_to_match_hours   NUMERIC(8,2),
    activation_cost              NUMERIC(10,2),
    operator_density_per_100km   NUMERIC(8,2),
    -- Metadata
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(corridor_id, snapshot_date)
);

CREATE INDEX idx_cls_corridor ON corridor_liquidity_snapshots(corridor_id);
CREATE INDEX idx_cls_country ON corridor_liquidity_snapshots(country_iso2);
CREATE INDEX idx_cls_date ON corridor_liquidity_snapshots(snapshot_date);
CREATE INDEX idx_cls_stage ON corridor_liquidity_snapshots(stage);
CREATE INDEX idx_cls_score ON corridor_liquidity_snapshots(cls_score);

-- ────────────────────────────────────────────────────────────
-- 5. ADS DECISION LOG — Budget allocation + campaign state
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ads_decision_log (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    decision_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    corridor_id     TEXT NOT NULL,
    country_iso2    TEXT NOT NULL,
    -- Input signals
    cls_score       INTEGER,
    load_participation_pct NUMERIC(5,2),
    match_rate_pct  NUMERIC(5,2),
    vapi_engagement_pct NUMERIC(5,2),
    activation_cost_trend TEXT,         -- declining_14d, stable_14d, rising_14d
    -- Decision outputs
    plai_decision   TEXT NOT NULL DEFAULT 'disabled', -- disabled, test_mode, enabled, force_disabled, emergency_kill
    daily_budget    NUMERIC(10,2) DEFAULT 0,
    budget_share_pct NUMERIC(5,2) DEFAULT 0,
    opportunity_score NUMERIC(5,3) DEFAULT 0,
    -- Campaign state
    campaign_type   TEXT,                -- operator_acquisition, broker_acquisition, affiliate_growth
    bid_strategy    TEXT,
    optimization_event TEXT,
    -- Reasoning
    decision_reason TEXT,
    warnings        TEXT[],
    -- Metadata
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(corridor_id, decision_date, campaign_type)
);

CREATE INDEX idx_ads_corridor ON ads_decision_log(corridor_id);
CREATE INDEX idx_ads_date ON ads_decision_log(decision_date);
CREATE INDEX idx_ads_decision ON ads_decision_log(plai_decision);

-- ────────────────────────────────────────────────────────────
-- 6. EARLY WARNING SIGNALS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS funnel_warnings (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_iso2    TEXT NOT NULL,
    corridor_id     TEXT,
    warning_type    TEXT NOT NULL,       -- high_conv_low_claim, high_claim_low_verify, activated_no_loads, loads_no_match, phantom_supply, demand_backlog, cpa_spike, corridor_regression
    severity        TEXT NOT NULL DEFAULT 'warning', -- info, warning, critical
    -- Signal values
    signal_values   JSONB DEFAULT '{}',
    -- Recommended actions
    recommended_actions TEXT[],
    -- Resolution
    resolved        BOOLEAN DEFAULT FALSE,
    resolved_at     TIMESTAMPTZ,
    resolved_by     TEXT,
    resolution_notes TEXT,
    -- Metadata
    detected_at     TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_warnings_country ON funnel_warnings(country_iso2);
CREATE INDEX idx_warnings_type ON funnel_warnings(warning_type);
CREATE INDEX idx_warnings_severity ON funnel_warnings(severity);
CREATE INDEX idx_warnings_resolved ON funnel_warnings(resolved);

-- ────────────────────────────────────────────────────────────
-- 7. RETARGET AUDIENCES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS retarget_audiences (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audience_key    TEXT NOT NULL,        -- vapi_positive_no_claim, claim_started_not_verified, activated_no_loads, broker_viewed_not_posted
    country_iso2    TEXT NOT NULL,
    corridor_id     TEXT,
    record_id       UUID NOT NULL,
    funnel_side     TEXT NOT NULL,        -- supply, demand
    priority        TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    -- State
    added_at        TIMESTAMPTZ DEFAULT now(),
    impressions     INTEGER DEFAULT 0,
    last_impression_at TIMESTAMPTZ,
    voice_touches   INTEGER DEFAULT 0,
    last_voice_at   TIMESTAMPTZ,
    -- Caps
    impression_cap_reached BOOLEAN DEFAULT FALSE,
    voice_cap_reached BOOLEAN DEFAULT FALSE,
    -- Resolution
    converted       BOOLEAN DEFAULT FALSE,
    converted_at    TIMESTAMPTZ,
    expired         BOOLEAN DEFAULT FALSE,
    expired_at      TIMESTAMPTZ,
    -- Metadata
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(audience_key, record_id)
);

CREATE INDEX idx_retarget_audience ON retarget_audiences(audience_key);
CREATE INDEX idx_retarget_country ON retarget_audiences(country_iso2);
CREATE INDEX idx_retarget_priority ON retarget_audiences(priority);
CREATE INDEX idx_retarget_converted ON retarget_audiences(converted);

-- ────────────────────────────────────────────────────────────
-- 8. EXPANSION GOVERNOR STATE
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expansion_governor (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_iso2    TEXT NOT NULL UNIQUE,
    -- Current state
    expansion_state TEXT NOT NULL DEFAULT 'paused', -- paused, cautious, push_hard
    -- Aggregate metrics
    green_corridors INTEGER DEFAULT 0,
    blue_corridors  INTEGER DEFAULT 0,
    avg_load_participation_pct NUMERIC(5,2) DEFAULT 0,
    avg_match_rate_pct NUMERIC(5,2) DEFAULT 0,
    avg_repeat_poster_pct NUMERIC(5,2) DEFAULT 0,
    vapi_engagement_stable BOOLEAN DEFAULT FALSE,
    activation_cost_declining BOOLEAN DEFAULT FALSE,
    -- Budget
    daily_budget_cap NUMERIC(10,2) DEFAULT 0,
    total_spend_mtd NUMERIC(10,2) DEFAULT 0,
    cost_of_liquidity NUMERIC(10,2) DEFAULT 0,
    -- Timestamps
    last_evaluated_at TIMESTAMPTZ DEFAULT now(),
    state_changed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_governor_state ON expansion_governor(expansion_state);

-- ────────────────────────────────────────────────────────────
-- RLS POLICIES
-- ────────────────────────────────────────────────────────────

ALTER TABLE funnel_supply_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_demand_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vapi_call_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE corridor_liquidity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_decision_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE retarget_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE expansion_governor ENABLE ROW LEVEL SECURITY;

-- Service role access only (these are internal operational tables)
CREATE POLICY "service_role_supply" ON funnel_supply_records FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_demand" ON funnel_demand_records FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_vapi" ON vapi_call_log FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_cls" ON corridor_liquidity_snapshots FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_ads" ON ads_decision_log FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_warnings" ON funnel_warnings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_retarget" ON retarget_audiences FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_governor" ON expansion_governor FOR ALL USING (auth.role() = 'service_role');
