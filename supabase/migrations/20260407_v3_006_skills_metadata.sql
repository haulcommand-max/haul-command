-- ============================================================================
-- HAUL COMMAND V3 — Migration Block 006: Skills Metadata & Surface Effects
-- ============================================================================
-- Prerequisites: block 002 (hc_skills)
-- FK order: all child tables → hc_skills, then surface_effects standalone
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. hc_skill_input_contracts — Expected input schema per skill
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_skill_input_contracts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id        UUID NOT NULL REFERENCES hc_skills(id) ON DELETE CASCADE,
    contract        JSONB NOT NULL DEFAULT '{}',                 -- JSON Schema for input
    required_fields TEXT[] NOT NULL DEFAULT '{}',
    optional_fields TEXT[] NOT NULL DEFAULT '{}',
    version         INTEGER NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (skill_id, version)
);

CREATE TRIGGER hc_skill_input_contracts_updated_at BEFORE UPDATE ON hc_skill_input_contracts
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. hc_skill_output_contracts — Expected output schema per skill
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_skill_output_contracts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id        UUID NOT NULL REFERENCES hc_skills(id) ON DELETE CASCADE,
    contract        JSONB NOT NULL DEFAULT '{}',
    creates         TEXT[] NOT NULL DEFAULT '{}',                 -- resource types this skill creates
    updates         TEXT[] NOT NULL DEFAULT '{}',                 -- resource types this skill updates
    version         INTEGER NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (skill_id, version)
);

CREATE TRIGGER hc_skill_output_contracts_updated_at BEFORE UPDATE ON hc_skill_output_contracts
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. hc_skill_permissions — What resources a skill can access
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_skill_permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id        UUID NOT NULL REFERENCES hc_skills(id) ON DELETE CASCADE,
    resource_type   TEXT NOT NULL,                               -- 'hc_entities', 'hc_loads', 'bg_sessions', etc.
    permission      TEXT NOT NULL DEFAULT 'read'
                    CHECK (permission IN ('read', 'write', 'delete', 'admin')),
    conditions      JSONB NOT NULL DEFAULT '{}',                 -- e.g. {"country_code": "US"} for scoped access
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (skill_id, resource_type, permission)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. hc_skill_surface_effects — What surfaces a skill modifies
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_skill_surface_effects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id        UUID NOT NULL REFERENCES hc_skills(id) ON DELETE CASCADE,
    surface_type    TEXT NOT NULL,                               -- 'profile_page', 'load_board', 'leaderboard', 'seo_page', 'adgrid_slot'
    effect_type     TEXT NOT NULL DEFAULT 'update'
                    CHECK (effect_type IN ('create', 'update', 'enrich', 'rank', 'publish', 'archive')),
    priority        INTEGER NOT NULL DEFAULT 50,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (skill_id, surface_type, effect_type)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. hc_skill_dependencies — Skill-to-skill dependencies
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_skill_dependencies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id        UUID NOT NULL REFERENCES hc_skills(id) ON DELETE CASCADE,
    depends_on_skill_id UUID NOT NULL REFERENCES hc_skills(id) ON DELETE RESTRICT,
    dependency_type TEXT NOT NULL DEFAULT 'required'
                    CHECK (dependency_type IN ('required', 'optional', 'fallback')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT no_self_dependency CHECK (skill_id != depends_on_skill_id),
    UNIQUE (skill_id, depends_on_skill_id)
);

CREATE INDEX IF NOT EXISTS idx_hcsd_skill ON hc_skill_dependencies (skill_id);
CREATE INDEX IF NOT EXISTS idx_hcsd_depends ON hc_skill_dependencies (depends_on_skill_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. hc_skill_billing_rules — Cost tracking rules per skill
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_skill_billing_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id        UUID NOT NULL REFERENCES hc_skills(id) ON DELETE CASCADE,
    billing_model   TEXT NOT NULL DEFAULT 'per_run'
                    CHECK (billing_model IN ('per_run', 'per_token', 'per_entity', 'flat_monthly', 'free')),
    rate_usd        NUMERIC(8,6) NOT NULL DEFAULT 0,
    monthly_cap_usd NUMERIC(10,2),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (skill_id, billing_model)
);

CREATE TRIGGER hc_skill_billing_rules_updated_at BEFORE UPDATE ON hc_skill_billing_rules
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. hc_surface_effects — Log of surface mutations (standalone)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_surface_effects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type     TEXT NOT NULL,                               -- 'skill_run', 'workflow_run', 'manual', 'cron'
    source_id       UUID,
    surface_type    TEXT NOT NULL,
    surface_id      UUID,
    effect_type     TEXT NOT NULL,                               -- 'created', 'updated', 'enriched', 'ranked', 'published', 'archived'
    before_snapshot JSONB,
    after_snapshot  JSONB,
    country_code    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcse_source ON hc_surface_effects (source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_hcse_surface ON hc_surface_effects (surface_type, surface_id);
CREATE INDEX IF NOT EXISTS idx_hcse_created ON hc_surface_effects (created_at DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. RLS
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE hc_skill_input_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_skill_output_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_skill_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_skill_surface_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_skill_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_skill_billing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_surface_effects ENABLE ROW LEVEL SECURITY;

CREATE POLICY hc_skill_input_contracts_service ON hc_skill_input_contracts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_skill_output_contracts_service ON hc_skill_output_contracts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_skill_permissions_service ON hc_skill_permissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_skill_surface_effects_service ON hc_skill_surface_effects FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_skill_dependencies_service ON hc_skill_dependencies FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_skill_billing_rules_service ON hc_skill_billing_rules FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_surface_effects_service ON hc_surface_effects FOR ALL TO service_role USING (true) WITH CHECK (true);
