-- ============================================================================
-- HAUL COMMAND V3 — Migration Block 009: SEO Manufacturing
-- ============================================================================
-- Prerequisites: block 001 (enums)
-- FK order: blueprints → runs → internal_links/faq/evidence/freshness/variants
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. seo_surface_blueprints — Templates for SEO page generation
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS seo_surface_blueprints (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_key   TEXT NOT NULL UNIQUE,                        -- e.g. 'corridor_page', 'state_requirements', 'port_guide'
    surface_family  TEXT NOT NULL,                               -- 'corridors', 'requirements', 'directory', 'glossary', 'training'
    display_name    TEXT NOT NULL,
    description     TEXT,
    -- Template config
    title_template  TEXT NOT NULL,                               -- 'Oversize Load Escort Services: {origin} to {destination}'
    meta_desc_template TEXT,
    h1_template     TEXT,
    content_sections JSONB NOT NULL DEFAULT '[]',                -- ordered section definitions
    structured_data_types TEXT[] NOT NULL DEFAULT '{}',          -- 'LocalBusiness', 'FAQPage', 'BreadcrumbList', 'Course'
    -- Schema
    required_variables TEXT[] NOT NULL DEFAULT '{}',             -- variables the template needs
    optional_variables TEXT[] NOT NULL DEFAULT '{}',
    -- Config
    target_word_count INTEGER NOT NULL DEFAULT 1500,
    internal_link_budget INTEGER NOT NULL DEFAULT 10,
    faq_count       INTEGER NOT NULL DEFAULT 5,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    version         INTEGER NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seobp_family ON seo_surface_blueprints (surface_family);
CREATE INDEX IF NOT EXISTS idx_seobp_active ON seo_surface_blueprints (is_active) WHERE is_active = true;

CREATE TRIGGER seo_surface_blueprints_updated_at BEFORE UPDATE ON seo_surface_blueprints
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. seo_surface_runs — Individual page generation runs
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS seo_surface_runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id    UUID REFERENCES seo_surface_blueprints(id) ON DELETE SET NULL,
    blueprint_key   TEXT NOT NULL,
    surface_entity_id UUID,                                     -- entity this page is about
    -- URL/routing
    slug            TEXT NOT NULL,
    url_path        TEXT NOT NULL,
    country_code    TEXT NOT NULL,
    language_code   TEXT NOT NULL DEFAULT 'en',
    -- Generated content
    title           TEXT,
    meta_description TEXT,
    h1              TEXT,
    content_html    TEXT,
    content_hash    TEXT,                                        -- for change detection
    word_count      INTEGER NOT NULL DEFAULT 0,
    -- Structured data
    structured_data JSONB NOT NULL DEFAULT '{}',
    -- Quality
    quality_score   NUMERIC(3,2),                               -- 0-1
    readability_score NUMERIC(3,2),
    uniqueness_score NUMERIC(3,2),
    -- Status
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'generated', 'reviewed', 'published', 'archived')),
    published_at    TIMESTAMPTZ,
    last_indexed_at TIMESTAMPTZ,
    -- Model
    model_used      TEXT,
    generation_cost_usd NUMERIC(8,6),
    -- Metadata
    variables_used  JSONB NOT NULL DEFAULT '{}',
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seosr_blueprint ON seo_surface_runs (blueprint_key);
CREATE INDEX IF NOT EXISTS idx_seosr_country ON seo_surface_runs (country_code, language_code);
CREATE INDEX IF NOT EXISTS idx_seosr_status ON seo_surface_runs (status);
CREATE INDEX IF NOT EXISTS idx_seosr_slug ON seo_surface_runs (slug);
CREATE INDEX IF NOT EXISTS idx_seosr_url ON seo_surface_runs (url_path);
CREATE INDEX IF NOT EXISTS idx_seosr_entity ON seo_surface_runs (surface_entity_id) WHERE surface_entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_seosr_published ON seo_surface_runs (published_at DESC) WHERE status = 'published';

CREATE TRIGGER seo_surface_runs_updated_at BEFORE UPDATE ON seo_surface_runs
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. seo_internal_links — Programmatic internal link graph
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS seo_internal_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_surface_run_id UUID NOT NULL REFERENCES seo_surface_runs(id) ON DELETE CASCADE,
    to_surface_run_id UUID REFERENCES seo_surface_runs(id) ON DELETE SET NULL,
    to_url_path     TEXT NOT NULL,
    anchor_text     TEXT NOT NULL,
    link_type       TEXT NOT NULL DEFAULT 'contextual'
                    CHECK (link_type IN ('contextual', 'related', 'breadcrumb', 'navigation', 'see_also', 'cross_country')),
    relevance_score NUMERIC(3,2) NOT NULL DEFAULT 0.5,
    position_in_content TEXT,                                   -- 'intro', 'body', 'sidebar', 'footer', 'faq'
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seoil_from ON seo_internal_links (from_surface_run_id);
CREATE INDEX IF NOT EXISTS idx_seoil_to ON seo_internal_links (to_surface_run_id) WHERE to_surface_run_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_seoil_type ON seo_internal_links (link_type);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. seo_faq_blocks — FAQ sections within SEO pages
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS seo_faq_blocks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    surface_run_id  UUID NOT NULL REFERENCES seo_surface_runs(id) ON DELETE CASCADE,
    question        TEXT NOT NULL,
    answer_html     TEXT NOT NULL,
    display_order   INTEGER NOT NULL DEFAULT 0,
    source_type     TEXT NOT NULL DEFAULT 'generated'
                    CHECK (source_type IN ('generated', 'community', 'support', 'manual')),
    engagement_score NUMERIC(3,2) NOT NULL DEFAULT 0,           -- CTR/interaction data
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seofaq_run ON seo_faq_blocks (surface_run_id, display_order);

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. seo_source_evidence — Sources backing generated content
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS seo_source_evidence (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    surface_run_id  UUID NOT NULL REFERENCES seo_surface_runs(id) ON DELETE CASCADE,
    source_type     TEXT NOT NULL,                               -- 'regulation', 'api', 'browser_grid', 'community', 'manual'
    source_url      TEXT,
    source_content_hash TEXT,
    excerpt         TEXT,
    confidence      NUMERIC(3,2) NOT NULL DEFAULT 0.5,
    last_verified_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seose_run ON seo_source_evidence (surface_run_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. seo_content_freshness — Staleness tracking per surface
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS seo_content_freshness (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    surface_run_id  UUID NOT NULL REFERENCES seo_surface_runs(id) ON DELETE CASCADE,
    last_content_update TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_data_change_detected TIMESTAMPTZ,
    staleness_score NUMERIC(3,2) NOT NULL DEFAULT 0,            -- 0=fresh, 1=stale
    refresh_priority INTEGER NOT NULL DEFAULT 50,
    needs_refresh   BOOLEAN NOT NULL DEFAULT false,
    refresh_reason  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (surface_run_id)
);

CREATE INDEX IF NOT EXISTS idx_seocf_needs ON seo_content_freshness (needs_refresh) WHERE needs_refresh = true;
CREATE INDEX IF NOT EXISTS idx_seocf_staleness ON seo_content_freshness (staleness_score DESC);

CREATE TRIGGER seo_content_freshness_updated_at BEFORE UPDATE ON seo_content_freshness
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. seo_country_variants — Cross-country page variants
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS seo_country_variants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    surface_run_id  UUID NOT NULL REFERENCES seo_surface_runs(id) ON DELETE CASCADE,
    variant_country_code TEXT NOT NULL,
    variant_language_code TEXT NOT NULL DEFAULT 'en',
    variant_surface_run_id UUID REFERENCES seo_surface_runs(id) ON DELETE SET NULL,
    hreflang_tag    TEXT NOT NULL,                               -- e.g. 'en-AU', 'fr-CA'
    is_canonical    BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (surface_run_id, variant_country_code, variant_language_code)
);

CREATE INDEX IF NOT EXISTS idx_seocv_run ON seo_country_variants (surface_run_id);
CREATE INDEX IF NOT EXISTS idx_seocv_variant ON seo_country_variants (variant_surface_run_id) WHERE variant_surface_run_id IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. RLS
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE seo_surface_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_surface_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_internal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_faq_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_source_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_content_freshness ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_country_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY seo_surface_blueprints_service ON seo_surface_blueprints FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY seo_surface_runs_service ON seo_surface_runs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY seo_internal_links_service ON seo_internal_links FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY seo_faq_blocks_service ON seo_faq_blocks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY seo_source_evidence_service ON seo_source_evidence FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY seo_content_freshness_service ON seo_content_freshness FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY seo_country_variants_service ON seo_country_variants FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admin read access
CREATE POLICY seo_surface_runs_admin ON seo_surface_runs FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY seo_content_freshness_admin ON seo_content_freshness FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');
