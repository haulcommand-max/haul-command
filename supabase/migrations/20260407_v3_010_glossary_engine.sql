-- ============================================================================
-- HAUL COMMAND V3 — Migration Block 010: Glossary Engine
-- ============================================================================
-- Prerequisites: block 001 (enums)
-- FK order: terms → localizations → aliases → examples → related_terms
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. glo_terms — Canonical glossary terms
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS glo_terms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_key        TEXT NOT NULL UNIQUE,                        -- URL-safe key e.g. 'oversize-load'
    canonical_term  TEXT NOT NULL,                               -- 'Oversize Load'
    term_type       TEXT NOT NULL DEFAULT 'definition'
                    CHECK (term_type IN ('definition', 'acronym', 'regulation_term', 'role', 'equipment', 'process')),
    base_definition TEXT NOT NULL,
    extended_definition TEXT,
    -- Categorization
    category        TEXT,                                        -- 'permits', 'equipment', 'roles', 'safety', 'regulations'
    subcategory     TEXT,
    industry_vertical TEXT NOT NULL DEFAULT 'heavy_haul'
                    CHECK (industry_vertical IN ('heavy_haul', 'general_freight', 'utility', 'construction', 'energy', 'cross_industry')),
    -- SEO
    seo_title       TEXT,
    seo_description TEXT,
    structured_data JSONB NOT NULL DEFAULT '{}',                 -- DefinedTerm schema
    -- Status
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('draft', 'active', 'deprecated', 'merged')),
    merged_into_id  UUID REFERENCES glo_terms(id) ON DELETE SET NULL,
    -- Usage
    usage_count     INTEGER NOT NULL DEFAULT 0,
    search_volume_estimate INTEGER,
    -- Metadata
    source          TEXT,                                        -- 'fmcsa', 'dot', 'industry', 'community'
    tags            TEXT[] NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_glot_key ON glo_terms (term_key);
CREATE INDEX IF NOT EXISTS idx_glot_type ON glo_terms (term_type);
CREATE INDEX IF NOT EXISTS idx_glot_category ON glo_terms (category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_glot_status ON glo_terms (status);
CREATE INDEX IF NOT EXISTS idx_glot_name_trgm ON glo_terms USING gin (canonical_term gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_glot_tags ON glo_terms USING gin (tags);

CREATE TRIGGER glo_terms_updated_at BEFORE UPDATE ON glo_terms
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. glo_term_localizations — Per-country/language translations
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS glo_term_localizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id         UUID NOT NULL REFERENCES glo_terms(id) ON DELETE CASCADE,
    country_code    TEXT NOT NULL,
    language_code   TEXT NOT NULL,
    localized_term  TEXT NOT NULL,
    localized_definition TEXT NOT NULL,
    regulatory_context TEXT,                                    -- country-specific regulatory notes
    local_usage_notes TEXT,
    -- Quality
    translation_quality TEXT NOT NULL DEFAULT 'machine'
                    CHECK (translation_quality IN ('machine', 'human_reviewed', 'expert_verified', 'official')),
    translator_notes TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (term_id, country_code, language_code)
);

CREATE INDEX IF NOT EXISTS idx_glotl_term ON glo_term_localizations (term_id);
CREATE INDEX IF NOT EXISTS idx_glotl_locale ON glo_term_localizations (country_code, language_code);

CREATE TRIGGER glo_term_localizations_updated_at BEFORE UPDATE ON glo_term_localizations
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. glo_term_aliases — Alternative spellings, abbreviations, slang
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS glo_term_aliases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id         UUID NOT NULL REFERENCES glo_terms(id) ON DELETE CASCADE,
    alias           TEXT NOT NULL,
    alias_type      TEXT NOT NULL DEFAULT 'synonym'
                    CHECK (alias_type IN ('synonym', 'abbreviation', 'acronym', 'slang', 'misspelling', 'former_term')),
    language_code   TEXT NOT NULL DEFAULT 'en',
    country_code    TEXT,                                        -- null = universal
    is_preferred    BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (term_id, alias, language_code)
);

CREATE INDEX IF NOT EXISTS idx_glota_term ON glo_term_aliases (term_id);
CREATE INDEX IF NOT EXISTS idx_glota_alias_trgm ON glo_term_aliases USING gin (alias gin_trgm_ops);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. glo_term_examples — Usage examples per term
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS glo_term_examples (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id         UUID NOT NULL REFERENCES glo_terms(id) ON DELETE CASCADE,
    example_text    TEXT NOT NULL,
    context         TEXT,                                        -- 'regulatory', 'operational', 'conversational'
    country_code    TEXT,
    language_code   TEXT NOT NULL DEFAULT 'en',
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_glote_term ON glo_term_examples (term_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. glo_related_terms — Term-to-term relationships
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS glo_related_terms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_term_id    UUID NOT NULL REFERENCES glo_terms(id) ON DELETE CASCADE,
    to_term_id      UUID NOT NULL REFERENCES glo_terms(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL DEFAULT 'related'
                    CHECK (relationship_type IN ('related', 'broader', 'narrower', 'opposite', 'see_also', 'prerequisite')),
    relevance_score NUMERIC(3,2) NOT NULL DEFAULT 0.5,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT no_self_relation CHECK (from_term_id != to_term_id),
    UNIQUE (from_term_id, to_term_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_glort_from ON glo_related_terms (from_term_id);
CREATE INDEX IF NOT EXISTS idx_glort_to ON glo_related_terms (to_term_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. RLS
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE glo_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE glo_term_localizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE glo_term_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE glo_term_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE glo_related_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY glo_terms_service ON glo_terms FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY glo_term_localizations_service ON glo_term_localizations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY glo_term_aliases_service ON glo_term_aliases FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY glo_term_examples_service ON glo_term_examples FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY glo_related_terms_service ON glo_related_terms FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public: read active published glossary content
CREATE POLICY glo_terms_public_read ON glo_terms FOR SELECT TO anon, authenticated
    USING (status = 'active');
CREATE POLICY glo_term_localizations_public_read ON glo_term_localizations FOR SELECT TO anon, authenticated
    USING (
        term_id IN (SELECT id FROM glo_terms WHERE status = 'active')
    );
CREATE POLICY glo_term_aliases_public_read ON glo_term_aliases FOR SELECT TO anon, authenticated
    USING (
        term_id IN (SELECT id FROM glo_terms WHERE status = 'active')
    );
CREATE POLICY glo_term_examples_public_read ON glo_term_examples FOR SELECT TO anon, authenticated
    USING (
        term_id IN (SELECT id FROM glo_terms WHERE status = 'active')
    );
CREATE POLICY glo_related_terms_public_read ON glo_related_terms FOR SELECT TO anon, authenticated
    USING (
        from_term_id IN (SELECT id FROM glo_terms WHERE status = 'active')
    );

-- Moderator/admin: write
CREATE POLICY glo_terms_mod_write ON glo_terms FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' IN ('moderator', 'admin'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('moderator', 'admin'));

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. PUBLIC VIEW: Glossary
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public_glossary_v AS
SELECT
    t.id AS term_id,
    t.term_key,
    t.canonical_term,
    t.term_type,
    t.base_definition,
    t.category,
    t.industry_vertical,
    t.seo_title,
    t.seo_description,
    t.usage_count,
    t.tags,
    (SELECT count(*) FROM glo_term_localizations l WHERE l.term_id = t.id) AS localization_count,
    (SELECT count(*) FROM glo_term_aliases a WHERE a.term_id = t.id) AS alias_count,
    (SELECT count(*) FROM glo_related_terms r WHERE r.from_term_id = t.id) AS related_count
FROM glo_terms t
WHERE t.status = 'active'
ORDER BY t.canonical_term;

GRANT SELECT ON public_glossary_v TO anon, authenticated;
