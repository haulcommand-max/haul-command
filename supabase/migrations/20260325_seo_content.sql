-- Claude SEO Content Architecture
CREATE TABLE IF NOT EXISTS seo_content_city_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_node_id UUID REFERENCES city_nodes(id),
    url_slug TEXT UNIQUE,
    meta_title TEXT,
    meta_description TEXT,
    hero_h1 TEXT,
    intro_paragraph TEXT,
    local_requirements TEXT,
    faq_items JSONB DEFAULT '[]'::jsonb,
    cta_operator TEXT,
    cta_broker TEXT,
    quality_score NUMERIC(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_content_regulatory_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2),
    local_term_definition TEXT,
    escort_thresholds TEXT,
    operator_certification TEXT,
    permit_process TEXT,
    penalties TEXT,
    country_specific_rules TEXT,
    last_verified DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_content_ai_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2),
    query_type VARCHAR(100),
    exact_question TEXT,
    direct_answer TEXT,
    call_to_action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_content_corridor_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_city TEXT,
    destination_city TEXT,
    page_title TEXT,
    hero_sentence TEXT,
    distance_route TEXT,
    states_crossed TEXT,
    transit_time TEXT,
    faq_items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_content_vertical_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry_vertical TEXT UNIQUE,
    page_title TEXT,
    unique_challenges TEXT,
    required_capabilities TEXT,
    top_regions TEXT,
    permit_complexity TEXT,
    case_study TEXT,
    faq_items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_content_acquisition_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code VARCHAR(10),
    job_description TEXT,
    certification_reqs TEXT,
    equipment_reqs TEXT,
    average_earnings TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_content_entity_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT UNIQUE,
    content_body TEXT,
    data_tables JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_content_multilingual_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) UNIQUE,
    keyword_localization_score NUMERIC(3,2),
    content_authenticity_score NUMERIC(3,2),
    regulatory_accuracy_score NUMERIC(3,2),
    cultural_adaptation_score NUMERIC(3,2),
    hreflang_implementation_score NUMERIC(3,2),
    content_fixes_required JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_content_strategy_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_addressable_opportunity TEXT,
    quick_win_list JSONB DEFAULT '[]'::jsonb,
    ai_search_dominance_plan TEXT,
    competitor_displacement_strategy TEXT,
    international_rollout_sequence TEXT,
    revenue_bridge TEXT,
    highest_roi_actions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
