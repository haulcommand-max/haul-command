-- ============================================================================
-- HAUL COMMAND V3 — Migration Block 013: Leaderboard & Trust
-- ============================================================================
-- Prerequisites: block 003 (hc_entities)
-- FK order: boards → badges → scores → events → entity_badges → unlocks → visibility
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. lbd_boards — Defined leaderboards
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lbd_boards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_key       TEXT NOT NULL UNIQUE,                        -- e.g. 'us-fl-operator-monthly'
    display_name    TEXT NOT NULL,
    description     TEXT,
    board_type      TEXT NOT NULL DEFAULT 'competitive'
                    CHECK (board_type IN ('competitive', 'collaborative', 'achievement', 'contributor')),
    -- Scope
    scope_type      TEXT NOT NULL DEFAULT 'global'
                    CHECK (scope_type IN ('global', 'country', 'region', 'market', 'corridor')),
    country_code    TEXT,
    region_code     TEXT,
    entity_types_eligible TEXT[] NOT NULL DEFAULT '{}',
    -- Period
    period_type     TEXT NOT NULL DEFAULT 'monthly'
                    CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all_time')),
    current_period_start TIMESTAMPTZ,
    -- Scoring algorithm
    scoring_formula JSONB NOT NULL DEFAULT '{}',
    max_entries     INTEGER NOT NULL DEFAULT 100,
    min_activity_threshold INTEGER NOT NULL DEFAULT 5,
    -- Display
    is_public       BOOLEAN NOT NULL DEFAULT true,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lbdb_scope ON lbd_boards (scope_type, country_code);
CREATE INDEX IF NOT EXISTS idx_lbdb_active ON lbd_boards (is_active) WHERE is_active = true;

CREATE TRIGGER lbd_boards_updated_at BEFORE UPDATE ON lbd_boards
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. lbd_badges — Defined badge types
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lbd_badges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_key       TEXT NOT NULL UNIQUE,                        -- 'road-captain', 'verified-escort', 'top-responder'
    display_name    TEXT NOT NULL,
    description     TEXT,
    icon_url        TEXT,
    badge_tier      TEXT NOT NULL DEFAULT 'bronze'
                    CHECK (badge_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    category        TEXT NOT NULL DEFAULT 'achievement'
                    CHECK (category IN ('achievement', 'certification', 'trust', 'community', 'milestone')),
    -- Unlock conditions
    unlock_conditions JSONB NOT NULL DEFAULT '{}',              -- {"trust_score_min": 80, "completed_runs_min": 50}
    is_active       BOOLEAN NOT NULL DEFAULT true,
    display_priority INTEGER NOT NULL DEFAULT 50,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lbdbg_category ON lbd_badges (category);

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. lbd_scores — Entity scores on boards
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lbd_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id        UUID NOT NULL REFERENCES lbd_boards(id) ON DELETE CASCADE,
    entity_id       UUID NOT NULL REFERENCES hc_entities(id) ON DELETE CASCADE,
    score_total     NUMERIC(10,2) NOT NULL DEFAULT 0,
    score_components JSONB NOT NULL DEFAULT '{}',               -- breakdown
    rank            INTEGER,
    rank_change     INTEGER NOT NULL DEFAULT 0,                 -- +3 means moved up 3 spots
    period_start    TIMESTAMPTZ NOT NULL,
    period_end      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (board_id, entity_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_lbds_board ON lbd_scores (board_id, rank);
CREATE INDEX IF NOT EXISTS idx_lbds_entity ON lbd_scores (entity_id);
CREATE INDEX IF NOT EXISTS idx_lbds_score ON lbd_scores (board_id, score_total DESC);

CREATE TRIGGER lbd_scores_updated_at BEFORE UPDATE ON lbd_scores
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. lbd_events — Scoring events (what contributed to scores)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lbd_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id        UUID NOT NULL REFERENCES lbd_boards(id) ON DELETE CASCADE,
    entity_id       UUID REFERENCES hc_entities(id) ON DELETE SET NULL,
    event_type      TEXT NOT NULL,                               -- 'run_completed', 'review_positive', 'doc_verified', 'response_fast'
    points          NUMERIC(8,2) NOT NULL DEFAULT 0,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lbde_board ON lbd_events (board_id);
CREATE INDEX IF NOT EXISTS idx_lbde_entity ON lbd_events (entity_id) WHERE entity_id IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. lbd_entity_badges — Badges earned by entities
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lbd_entity_badges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_id        UUID NOT NULL REFERENCES lbd_badges(id) ON DELETE CASCADE,
    entity_id       UUID NOT NULL REFERENCES hc_entities(id) ON DELETE CASCADE,
    awarded_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    awarded_reason  TEXT,
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (badge_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_lbdeb_entity ON lbd_entity_badges (entity_id);
CREATE INDEX IF NOT EXISTS idx_lbdeb_badge ON lbd_entity_badges (badge_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. lbd_unlocks — Feature unlocks tied to leaderboard performance
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lbd_unlocks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id       UUID NOT NULL REFERENCES hc_entities(id) ON DELETE CASCADE,
    unlock_type     TEXT NOT NULL,                               -- 'priority_matching', 'featured_listing', 'analytics_pro', 'custom_profile'
    unlock_source   TEXT NOT NULL DEFAULT 'leaderboard'
                    CHECK (unlock_source IN ('leaderboard', 'badge', 'subscription', 'manual')),
    source_id       UUID,                                       -- badge_id or board_id
    is_active       BOOLEAN NOT NULL DEFAULT true,
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lbdu_entity ON lbd_unlocks (entity_id);
CREATE INDEX IF NOT EXISTS idx_lbdu_type ON lbd_unlocks (unlock_type);

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. lbd_visibility_modifiers — Adjust visibility/ranking per entity
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lbd_visibility_modifiers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id       UUID NOT NULL REFERENCES hc_entities(id) ON DELETE CASCADE,
    modifier_type   TEXT NOT NULL,                               -- 'boost', 'suppress', 'highlight'
    modifier_value  NUMERIC(3,2) NOT NULL DEFAULT 1.0,          -- multiplier
    reason          TEXT NOT NULL,
    applied_by      UUID,
    starts_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lbdvm_entity ON lbd_visibility_modifiers (entity_id);
CREATE INDEX IF NOT EXISTS idx_lbdvm_active ON lbd_visibility_modifiers (is_active, starts_at, expires_at);

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. RLS
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE lbd_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lbd_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE lbd_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE lbd_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lbd_entity_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE lbd_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lbd_visibility_modifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY lbd_boards_service ON lbd_boards FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY lbd_badges_service ON lbd_badges FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY lbd_scores_service ON lbd_scores FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY lbd_events_service ON lbd_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY lbd_entity_badges_service ON lbd_entity_badges FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY lbd_unlocks_service ON lbd_unlocks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY lbd_visibility_modifiers_service ON lbd_visibility_modifiers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public: read published boards, badges, scores
CREATE POLICY lbd_boards_public ON lbd_boards FOR SELECT TO anon, authenticated USING (is_public = true AND is_active = true);
CREATE POLICY lbd_badges_public ON lbd_badges FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY lbd_scores_public ON lbd_scores FOR SELECT TO anon, authenticated USING (true);

-- Authenticated: self entity badges and unlocks
CREATE POLICY lbd_entity_badges_self ON lbd_entity_badges FOR SELECT TO authenticated
    USING (entity_id IN (SELECT id FROM hc_entities WHERE claimed_by = auth.uid()));
CREATE POLICY lbd_unlocks_self ON lbd_unlocks FOR SELECT TO authenticated
    USING (entity_id IN (SELECT id FROM hc_entities WHERE claimed_by = auth.uid()));

-- Public leaderboard view
CREATE OR REPLACE VIEW public_leaderboards_v AS
SELECT
    b.board_key,
    b.display_name AS board_name,
    b.scope_type,
    b.country_code,
    b.period_type,
    s.entity_id,
    e.canonical_name AS entity_name,
    e.entity_type,
    s.score_total,
    s.rank,
    s.rank_change,
    s.period_start,
    (SELECT array_agg(bg.badge_key) FROM lbd_entity_badges eb JOIN lbd_badges bg ON bg.id = eb.badge_id WHERE eb.entity_id = s.entity_id AND eb.is_active = true) AS badges
FROM lbd_scores s
JOIN lbd_boards b ON b.id = s.board_id
LEFT JOIN hc_entities e ON e.id = s.entity_id
WHERE b.is_public = true AND b.is_active = true
ORDER BY b.board_key, s.rank ASC NULLS LAST;

GRANT SELECT ON public_leaderboards_v TO anon, authenticated;
