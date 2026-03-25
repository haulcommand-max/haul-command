-- SEO Engine Architecture
CREATE TABLE IF NOT EXISTS seo_regulatory_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL,
    tier VARCHAR(10),
    regulatory_score NUMERIC(3,2),
    status VARCHAR(50),
    missing_dimensions JSONB DEFAULT '[]'::jsonb,
    launch_blocker BOOLEAN DEFAULT false,
    estimated_research_hours_to_fix INT,
    priority_rank INT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS city_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2),
    city_name text,
    city_name_local text,
    region_code VARCHAR(10),
    lat NUMERIC(9,6),
    lng NUMERIC(9,6),
    demand_category VARCHAR(100),
    demand_score NUMERIC(3,2),
    primary_industries JSONB DEFAULT '[]'::jsonb,
    key_routes_from JSONB DEFAULT '[]'::jsonb,
    is_port_city BOOLEAN DEFAULT false,
    port_name text,
    seo_slug text UNIQUE,
    page_title_en text,
    h1_en text,
    search_volume_estimate VARCHAR(50),
    local_search_terms JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_taxonomies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL UNIQUE,
    tier_1_keywords JSONB DEFAULT '[]'::jsonb,
    tier_2_keywords JSONB DEFAULT '[]'::jsonb,
    tier_3_keywords JSONB DEFAULT '[]'::jsonb,
    tier_4_keywords JSONB DEFAULT '[]'::jsonb,
    ai_search_keywords JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_city_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_slug text UNIQUE,
    canonical_url text,
    hreflang_tags JSONB DEFAULT '[]'::jsonb,
    page_meta JSONB DEFAULT '{}'::jsonb,
    schema_org JSONB DEFAULT '{}'::jsonb,
    faq_schema JSONB DEFAULT '[]'::jsonb,
    breadcrumb_schema JSONB DEFAULT '[]'::jsonb,
    internal_links JSONB DEFAULT '[]'::jsonb,
    content_sections JSONB DEFAULT '[]'::jsonb,
    dynamic_data_required JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_ai_search_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL UNIQUE,
    ai_search_readiness_score NUMERIC(3,2),
    entity_clarity NUMERIC(3,2),
    structured_data NUMERIC(3,2),
    question_coverage NUMERIC(3,2),
    freshness_signals NUMERIC(3,2),
    authority_signals NUMERIC(3,2),
    hreflang_correct NUMERIC(3,2),
    gaps JSONB DEFAULT '[]'::jsonb,
    quick_wins JSONB DEFAULT '[]'::jsonb,
    strategic_improvements JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_money_left_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gap_category text,
    estimated_pages_missing INT,
    estimated_monthly_searches_uncaptured INT,
    estimated_conversion_rate NUMERIC(4,3),
    estimated_monthly_revenue_opportunity INT,
    effort_to_capture VARCHAR(50),
    priority INT,
    action text,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_schema_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_type text UNIQUE,
    schema_jsonld JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    future_proof_score NUMERIC(3,2),
    hyper_local_score NUMERIC(3,2),
    seo_readiness_score NUMERIC(3,2),
    ai_search_readiness_score NUMERIC(3,2),
    revenue_capture_score NUMERIC(3,2),
    overall_score NUMERIC(3,2),
    top_3_fixes_this_week JSONB DEFAULT '[]'::jsonb,
    top_3_fixes_this_month JSONB DEFAULT '[]'::jsonb,
    estimated_revenue_unlocked_if_all_fixed INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
