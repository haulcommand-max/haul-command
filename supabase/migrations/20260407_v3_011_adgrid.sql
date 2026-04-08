-- ============================================================================
-- HAUL COMMAND V3 — Migration Block 011: AdGrid Intelligence
-- ============================================================================
-- Prerequisites: block 003 (hc_entities)
-- FK order: campaigns → slots → targets → creatives → bid_rules → rollups → recommendations
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. adg_campaigns
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS adg_campaigns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_entity_id UUID NOT NULL REFERENCES hc_entities(id) ON DELETE RESTRICT,
    campaign_name   TEXT NOT NULL,
    campaign_type   TEXT NOT NULL DEFAULT 'standard'
                    CHECK (campaign_type IN ('standard', 'featured', 'sponsored', 'takeover', 'retarget')),
    objective_type  TEXT NOT NULL DEFAULT 'visibility'
                    CHECK (objective_type IN ('visibility', 'lead_gen', 'booking', 'brand')),
    -- Budget
    budget_minor_units BIGINT NOT NULL DEFAULT 0,               -- cents/centavos
    spent_minor_units BIGINT NOT NULL DEFAULT 0,
    daily_cap_minor_units BIGINT,
    currency_code   TEXT NOT NULL DEFAULT 'USD',
    -- Targeting
    target_countries TEXT[] NOT NULL DEFAULT '{}',
    target_regions  TEXT[] NOT NULL DEFAULT '{}',
    target_corridors TEXT[] NOT NULL DEFAULT '{}',
    target_entity_types TEXT[] NOT NULL DEFAULT '{}',
    -- Schedule
    starts_at       TIMESTAMPTZ,
    ends_at         TIMESTAMPTZ,
    -- Status
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'pending_review', 'active', 'paused', 'exhausted', 'completed', 'rejected')),
    review_notes    TEXT,
    approved_by     UUID,
    -- Metrics
    impressions     BIGINT NOT NULL DEFAULT 0,
    clicks          BIGINT NOT NULL DEFAULT 0,
    conversions     INTEGER NOT NULL DEFAULT 0,
    ctr             NUMERIC(7,4) NOT NULL DEFAULT 0,
    cpa_minor_units BIGINT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adgc_advertiser ON adg_campaigns (advertiser_entity_id);
CREATE INDEX IF NOT EXISTS idx_adgc_status ON adg_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_adgc_countries ON adg_campaigns USING gin (target_countries);
CREATE INDEX IF NOT EXISTS idx_adgc_active ON adg_campaigns (starts_at, ends_at) WHERE status = 'active';

CREATE TRIGGER adg_campaigns_updated_at BEFORE UPDATE ON adg_campaigns
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. adg_slots — Inventory positions across surfaces
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS adg_slots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_key        TEXT NOT NULL UNIQUE,                        -- e.g. 'directory_sidebar_us', 'load_board_banner'
    display_name    TEXT NOT NULL,
    surface_type    TEXT NOT NULL,                               -- 'directory', 'load_board', 'corridor_page', 'search_results', 'homepage'
    position        TEXT NOT NULL DEFAULT 'sidebar'
                    CHECK (position IN ('header', 'sidebar', 'inline', 'footer', 'interstitial', 'featured')),
    format          TEXT NOT NULL DEFAULT 'banner'
                    CHECK (format IN ('banner', 'card', 'text', 'video', 'native', 'sponsored_listing')),
    dimensions      JSONB NOT NULL DEFAULT '{}',                -- width/height
    -- Pricing
    floor_price_minor_units BIGINT NOT NULL DEFAULT 0,
    pricing_model   TEXT NOT NULL DEFAULT 'cpm'
                    CHECK (pricing_model IN ('cpm', 'cpc', 'cpa', 'flat_rate')),
    -- Inventory
    fill_rate       NUMERIC(5,4) NOT NULL DEFAULT 0,
    daily_impressions_avg INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    country_code    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adgs_surface ON adg_slots (surface_type);
CREATE INDEX IF NOT EXISTS idx_adgs_active ON adg_slots (is_active) WHERE is_active = true;

CREATE TRIGGER adg_slots_updated_at BEFORE UPDATE ON adg_slots
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. adg_targets — Campaign targeting rules
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS adg_targets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID NOT NULL REFERENCES adg_campaigns(id) ON DELETE CASCADE,
    target_type     TEXT NOT NULL,                               -- 'geo', 'entity_type', 'corridor', 'behavior', 'keyword'
    target_value    JSONB NOT NULL DEFAULT '{}',
    is_exclusion    BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adgt_campaign ON adg_targets (campaign_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. adg_creatives — Ad creative assets
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS adg_creatives (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID NOT NULL REFERENCES adg_campaigns(id) ON DELETE CASCADE,
    creative_type   TEXT NOT NULL DEFAULT 'image'
                    CHECK (creative_type IN ('image', 'text', 'video', 'html', 'native')),
    headline        TEXT,
    body_text       TEXT,
    cta_text        TEXT,
    cta_url         TEXT,
    asset_url       TEXT,
    -- Performance
    impressions     BIGINT NOT NULL DEFAULT 0,
    clicks          BIGINT NOT NULL DEFAULT 0,
    ctr             NUMERIC(7,4) NOT NULL DEFAULT 0,
    -- Status
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'paused')),
    review_notes    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adgcr_campaign ON adg_creatives (campaign_id);
CREATE INDEX IF NOT EXISTS idx_adgcr_status ON adg_creatives (status);

CREATE TRIGGER adg_creatives_updated_at BEFORE UPDATE ON adg_creatives
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. adg_bid_rules — Programmatic bid strategies per slot
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS adg_bid_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id         UUID NOT NULL REFERENCES adg_slots(id) ON DELETE CASCADE,
    rule_type       TEXT NOT NULL DEFAULT 'auto'
                    CHECK (rule_type IN ('auto', 'manual', 'floor', 'dynamic')),
    bid_amount_minor_units BIGINT NOT NULL DEFAULT 0,
    max_bid_minor_units BIGINT,
    scarcity_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0,
    time_decay_factor NUMERIC(3,2) NOT NULL DEFAULT 1.0,
    conditions      JSONB NOT NULL DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adgbr_slot ON adg_bid_rules (slot_id);

CREATE TRIGGER adg_bid_rules_updated_at BEFORE UPDATE ON adg_bid_rules
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. adg_performance_rollups — Daily/weekly/monthly rollups
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS adg_performance_rollups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID NOT NULL REFERENCES adg_campaigns(id) ON DELETE RESTRICT,
    rollup_period   TEXT NOT NULL DEFAULT 'daily'
                    CHECK (rollup_period IN ('hourly', 'daily', 'weekly', 'monthly')),
    period_start    TIMESTAMPTZ NOT NULL,
    period_end      TIMESTAMPTZ NOT NULL,
    impressions     BIGINT NOT NULL DEFAULT 0,
    clicks          BIGINT NOT NULL DEFAULT 0,
    conversions     INTEGER NOT NULL DEFAULT 0,
    spend_minor_units BIGINT NOT NULL DEFAULT 0,
    ctr             NUMERIC(7,4) NOT NULL DEFAULT 0,
    cpa_minor_units BIGINT,
    roas            NUMERIC(8,4),
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (campaign_id, rollup_period, period_start)
);

CREATE INDEX IF NOT EXISTS idx_adgpr_campaign ON adg_performance_rollups (campaign_id, rollup_period, period_start DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. adg_recommendations — AI-generated campaign recommendations
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS adg_recommendations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID NOT NULL REFERENCES adg_campaigns(id) ON DELETE CASCADE,
    recommendation_type TEXT NOT NULL,                          -- 'increase_bid', 'add_target', 'pause_creative', 'expand_geo'
    reason          TEXT NOT NULL,
    severity        TEXT NOT NULL DEFAULT 'suggestion'
                    CHECK (severity IN ('info', 'suggestion', 'warning', 'critical')),
    estimated_impact JSONB NOT NULL DEFAULT '{}',               -- {"impressions_delta": 1500, "spend_delta": 5000}
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'dismissed', 'auto_applied')),
    applied_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adgr_campaign ON adg_recommendations (campaign_id);
CREATE INDEX IF NOT EXISTS idx_adgr_status ON adg_recommendations (status) WHERE status = 'pending';

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. RLS
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE adg_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE adg_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE adg_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE adg_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE adg_bid_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE adg_performance_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE adg_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY adg_campaigns_service ON adg_campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY adg_slots_service ON adg_slots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY adg_targets_service ON adg_targets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY adg_creatives_service ON adg_creatives FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY adg_bid_rules_service ON adg_bid_rules FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY adg_performance_rollups_service ON adg_performance_rollups FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY adg_recommendations_service ON adg_recommendations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Advertiser: own campaigns only
CREATE POLICY adg_campaigns_advertiser_read ON adg_campaigns FOR SELECT TO authenticated
    USING (advertiser_entity_id IN (SELECT id FROM hc_entities WHERE claimed_by = auth.uid()));
CREATE POLICY adg_campaigns_advertiser_insert ON adg_campaigns FOR INSERT TO authenticated
    WITH CHECK (advertiser_entity_id IN (SELECT id FROM hc_entities WHERE claimed_by = auth.uid()));
CREATE POLICY adg_campaigns_advertiser_update ON adg_campaigns FOR UPDATE TO authenticated
    USING (advertiser_entity_id IN (SELECT id FROM hc_entities WHERE claimed_by = auth.uid()));

-- Advertiser: own campaign children
CREATE POLICY adg_targets_advertiser ON adg_targets FOR SELECT TO authenticated
    USING (campaign_id IN (SELECT id FROM adg_campaigns WHERE advertiser_entity_id IN (SELECT id FROM hc_entities WHERE claimed_by = auth.uid())));
CREATE POLICY adg_creatives_advertiser ON adg_creatives FOR SELECT TO authenticated
    USING (campaign_id IN (SELECT id FROM adg_campaigns WHERE advertiser_entity_id IN (SELECT id FROM hc_entities WHERE claimed_by = auth.uid())));
CREATE POLICY adg_performance_rollups_advertiser ON adg_performance_rollups FOR SELECT TO authenticated
    USING (campaign_id IN (SELECT id FROM adg_campaigns WHERE advertiser_entity_id IN (SELECT id FROM hc_entities WHERE claimed_by = auth.uid())));
CREATE POLICY adg_recommendations_advertiser ON adg_recommendations FOR SELECT TO authenticated
    USING (campaign_id IN (SELECT id FROM adg_campaigns WHERE advertiser_entity_id IN (SELECT id FROM hc_entities WHERE claimed_by = auth.uid())));

-- Slots: advertisers can read published inventory
CREATE POLICY adg_slots_read ON adg_slots FOR SELECT TO authenticated
    USING (is_active = true);

-- Admin: full access on all
CREATE POLICY adg_campaigns_admin ON adg_campaigns FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');
