-- ============================================================================
-- HAUL COMMAND V3 — Migration Block 014: Monetization Intelligence
-- ============================================================================
-- Prerequisites: block 001 (enums)
-- FK order: scorecards → components → pressure_rules → offer_triggers → pressure_events
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. dom_scorecards — Market dominance scorecards
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dom_scorecards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scorecard_key   TEXT NOT NULL UNIQUE,                        -- e.g. 'us-fl-tampa-2026-q1'
    -- Scope
    country_code    TEXT NOT NULL,
    region_code     TEXT,
    market_key      TEXT,
    period_type     TEXT NOT NULL DEFAULT 'monthly'
                    CHECK (period_type IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    period_start    TIMESTAMPTZ NOT NULL,
    period_end      TIMESTAMPTZ,
    -- Scores
    overall_score   NUMERIC(5,2) NOT NULL DEFAULT 0,            -- 0-100
    supply_score    NUMERIC(5,2) NOT NULL DEFAULT 0,
    demand_score    NUMERIC(5,2) NOT NULL DEFAULT 0,
    engagement_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    monetization_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    growth_score    NUMERIC(5,2) NOT NULL DEFAULT 0,
    -- Key metrics
    active_operators INTEGER NOT NULL DEFAULT 0,
    active_loads    INTEGER NOT NULL DEFAULT 0,
    match_rate      NUMERIC(5,4) NOT NULL DEFAULT 0,
    revenue_minor_units BIGINT NOT NULL DEFAULT 0,
    currency_code   TEXT NOT NULL DEFAULT 'USD',
    -- Status
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'computed', 'reviewed', 'published')),
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doms_country ON dom_scorecards (country_code, region_code);
CREATE INDEX IF NOT EXISTS idx_doms_period ON dom_scorecards (period_start DESC);
CREATE INDEX IF NOT EXISTS idx_doms_market ON dom_scorecards (market_key) WHERE market_key IS NOT NULL;

CREATE TRIGGER dom_scorecards_updated_at BEFORE UPDATE ON dom_scorecards
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. dom_scorecard_components — Breakdown of each score component
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dom_scorecard_components (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scorecard_id    UUID NOT NULL REFERENCES dom_scorecards(id) ON DELETE CASCADE,
    component_key   TEXT NOT NULL,                               -- 'profile_completeness_avg', 'load_fill_rate', 'adgrid_revenue'
    component_category TEXT NOT NULL,                            -- 'supply', 'demand', 'engagement', 'monetization', 'growth'
    value           NUMERIC(12,4) NOT NULL,
    weight          NUMERIC(3,2) NOT NULL DEFAULT 1.0,
    trend           TEXT CHECK (trend IN ('up', 'flat', 'down')),
    benchmark       NUMERIC(12,4),                              -- industry or platform average
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (scorecard_id, component_key)
);

CREATE INDEX IF NOT EXISTS idx_domsc_scorecard ON dom_scorecard_components (scorecard_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. mon_pressure_rules — Rules for monetization pressure
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mon_pressure_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_key        TEXT NOT NULL UNIQUE,                        -- 'scarcity_boost_fl', 'urgency_load_premium'
    display_name    TEXT NOT NULL,
    description     TEXT,
    -- Conditions
    trigger_conditions JSONB NOT NULL DEFAULT '{}',             -- {"market_mode": "shortage", "fill_rate_below": 0.3}
    -- Effect
    pressure_type   TEXT NOT NULL DEFAULT 'price_boost'
                    CHECK (pressure_type IN ('price_boost', 'urgency_flag', 'scarcity_premium', 'offer_nudge', 'upsell')),
    multiplier      NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    -- Scope
    country_codes   TEXT[] NOT NULL DEFAULT '{}',
    entity_types    TEXT[] NOT NULL DEFAULT '{}',
    -- Config
    is_active       BOOLEAN NOT NULL DEFAULT true,
    priority        INTEGER NOT NULL DEFAULT 50,
    max_daily_fires INTEGER,
    cooldown_hours  INTEGER NOT NULL DEFAULT 24,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monpr_active ON mon_pressure_rules (is_active) WHERE is_active = true;

CREATE TRIGGER mon_pressure_rules_updated_at BEFORE UPDATE ON mon_pressure_rules
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. mon_offer_triggers — Automated offer generation rules
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mon_offer_triggers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_key     TEXT NOT NULL UNIQUE,
    display_name    TEXT NOT NULL,
    offer_type      TEXT NOT NULL DEFAULT 'discount'
                    CHECK (offer_type IN ('discount', 'trial', 'bundle', 'upgrade', 'bonus_credits', 'referral')),
    -- Conditions
    trigger_conditions JSONB NOT NULL DEFAULT '{}',
    -- Offer details
    offer_value     JSONB NOT NULL DEFAULT '{}',                -- {"discount_pct": 20, "valid_days": 30}
    -- Targeting
    target_entity_types TEXT[] NOT NULL DEFAULT '{}',
    target_countries TEXT[] NOT NULL DEFAULT '{}',
    -- Config
    is_active       BOOLEAN NOT NULL DEFAULT true,
    max_redemptions INTEGER,
    current_redemptions INTEGER NOT NULL DEFAULT 0,
    starts_at       TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monot_active ON mon_offer_triggers (is_active) WHERE is_active = true;

CREATE TRIGGER mon_offer_triggers_updated_at BEFORE UPDATE ON mon_offer_triggers
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. mon_pressure_events — Log of pressure rule firings
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mon_pressure_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id         UUID REFERENCES mon_pressure_rules(id) ON DELETE SET NULL,
    rule_key        TEXT NOT NULL,
    entity_id       UUID,
    -- Context
    market_key      TEXT,
    country_code    TEXT,
    pressure_type   TEXT NOT NULL,
    multiplier_applied NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    -- Outcome
    outcome         TEXT CHECK (outcome IN ('triggered', 'converted', 'dismissed', 'expired', 'cooled_down')),
    revenue_impact_minor_units BIGINT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monpe_rule ON mon_pressure_events (rule_key);
CREATE INDEX IF NOT EXISTS idx_monpe_entity ON mon_pressure_events (entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_monpe_created ON mon_pressure_events (created_at DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. RLS
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE dom_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dom_scorecard_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE mon_pressure_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE mon_offer_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mon_pressure_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY dom_scorecards_service ON dom_scorecards FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY dom_scorecard_components_service ON dom_scorecard_components FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY mon_pressure_rules_service ON mon_pressure_rules FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY mon_offer_triggers_service ON mon_offer_triggers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY mon_pressure_events_service ON mon_pressure_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admin only access
CREATE POLICY dom_scorecards_admin ON dom_scorecards FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY mon_pressure_rules_admin ON mon_pressure_rules FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY mon_offer_triggers_admin ON mon_offer_triggers FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');
