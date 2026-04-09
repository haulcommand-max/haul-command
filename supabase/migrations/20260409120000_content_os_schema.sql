-- Haul Command Content OS Schema Migration
-- Defines the unified graph for Blog, Regulations, and Tools to act as a single intent system.

-- ==========================================
-- 1. ENUMS (System-Wide Truth States)
-- ==========================================
CREATE TYPE content_freshness_state AS ENUM (
    'updated_recently', 
    'review_due', 
    'stable_reference', 
    'seeded_needs_review', 
    'historical_reference_only'
);

CREATE TYPE content_confidence_state AS ENUM (
    'verified_current', 
    'verified_but_review_due', 
    'partially_verified', 
    'seeded_needs_review', 
    'historical_reference_only'
);

-- ==========================================
-- 2. BLOG SYSTEM
-- ==========================================
CREATE TABLE blog_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    deck TEXT,
    summary TEXT,
    quick_answer TEXT,
    article_type TEXT NOT NULL, -- e.g. 'regulation_update', 'corridor_intelligence'
    topic_primary_id TEXT,
    country_code TEXT,
    region_code TEXT,
    city_slug TEXT,
    corridor_slug TEXT,
    freshness_state content_freshness_state DEFAULT 'seeded_needs_review',
    confidence_state content_confidence_state DEFAULT 'seeded_needs_review',
    sponsor_eligible BOOLEAN DEFAULT true,
    cta_primary_intent TEXT,
    is_indexable BOOLEAN DEFAULT true,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    next_review_due TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days',
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE TABLE blog_article_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES blog_articles(id) ON DELETE CASCADE,
    block_type TEXT NOT NULL, -- e.g. 'h2', 'paragraph', 'faq'
    sort_order INTEGER NOT NULL,
    body_json JSONB NOT NULL
);

CREATE TABLE blog_article_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES blog_articles(id) ON DELETE CASCADE,
    link_type TEXT NOT NULL, -- 'regulation', 'tool', 'glossary', 'local'
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    anchor_text TEXT,
    priority INTEGER DEFAULT 1
);

-- ==========================================
-- 3. REGULATIONS COMMAND ENGINE
-- ==========================================
CREATE TABLE reg_jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL,
    region_code TEXT, -- Null means Federal/Country level
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    tier_label TEXT, -- e.g. 'Platinum', 'Gold', 'Bronze (Seed)'
    confidence_state content_confidence_state DEFAULT 'seeded_needs_review',
    freshness_state content_freshness_state DEFAULT 'seeded_needs_review',
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    next_review_due TIMESTAMPTZ DEFAULT NOW() + INTERVAL '180 days',
    is_indexable BOOLEAN DEFAULT true
);

CREATE TABLE reg_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_id UUID REFERENCES reg_jurisdictions(id) ON DELETE CASCADE,
    requirement_type TEXT NOT NULL, -- 'escort_threshold', 'curfew', 'equipment'
    requirement_label TEXT NOT NULL,
    requirement_value TEXT NOT NULL,
    notes TEXT,
    source_url TEXT
);

CREATE TABLE reg_authorities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_id UUID REFERENCES reg_jurisdictions(id) ON DELETE CASCADE,
    authority_name TEXT NOT NULL, -- 'TXDOT'
    authority_type TEXT NOT NULL, -- 'Permit Office'
    official_url TEXT,
    contact_phone TEXT,
    contact_hours TEXT
);

CREATE TABLE reg_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_id UUID REFERENCES reg_jurisdictions(id) ON DELETE CASCADE,
    link_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    anchor_text TEXT,
    priority INTEGER DEFAULT 1
);

-- ==========================================
-- 4. TOOLS (UTILITY ENGINE)
-- ==========================================
CREATE TABLE tool_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category_primary_id TEXT,
    problem_primary TEXT,
    summary TEXT,
    quick_answer TEXT,
    what_it_solves TEXT,
    when_to_use TEXT,
    no_login_required BOOLEAN DEFAULT true,
    pricing_mode TEXT DEFAULT 'free',
    sponsor_eligible BOOLEAN DEFAULT true,
    freshness_state content_freshness_state DEFAULT 'stable_reference',
    trust_state content_confidence_state DEFAULT 'verified_current',
    is_indexable BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE TABLE tool_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id UUID REFERENCES tool_catalog(id) ON DELETE CASCADE,
    link_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    anchor_text TEXT,
    priority INTEGER DEFAULT 1
);

-- ==========================================
-- 5. THE GRAPH RPCs (Unified Fetchers)
-- ==========================================
-- These RPCs ensure that when we load a page, we fetch the entity + all its required structural adacencies in one trip.

CREATE OR REPLACE FUNCTION get_blog_article_structured(p_slug TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'article', row_to_json(a),
        'blocks', (SELECT json_agg(b ORDER BY b.sort_order) FROM blog_article_blocks b WHERE b.article_id = a.id),
        'links', (SELECT json_agg(l ORDER BY l.priority) FROM blog_article_links l WHERE l.article_id = a.id)
    ) INTO result
    FROM blog_articles a
    WHERE a.slug = p_slug;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_reg_jurisdiction_structured(p_country_code TEXT, p_region_code TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'jurisdiction', row_to_json(j),
        'requirements', (SELECT json_agg(req) FROM reg_requirements req WHERE req.jurisdiction_id = j.id),
        'authorities', (SELECT json_agg(auth) FROM reg_authorities auth WHERE auth.jurisdiction_id = j.id),
        'links', (SELECT json_agg(l ORDER BY l.priority) FROM reg_links l WHERE l.jurisdiction_id = j.id)
    ) INTO result
    FROM reg_jurisdictions j
    WHERE j.country_code = p_country_code 
      AND (p_region_code IS NULL OR j.region_code = p_region_code);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_tool_structured(p_slug TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'tool', row_to_json(t),
        'links', (SELECT json_agg(l ORDER BY l.priority) FROM tool_links l WHERE l.tool_id = t.id)
    ) INTO result
    FROM tool_catalog t
    WHERE t.slug = p_slug;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Set up Realtime Triggers for edge cache invalidations
ALTER PUBLICATION supabase_realtime ADD TABLE blog_articles;
ALTER PUBLICATION supabase_realtime ADD TABLE reg_jurisdictions;
ALTER PUBLICATION supabase_realtime ADD TABLE tool_catalog;
