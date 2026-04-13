-- HC-W1-05: SEO Data Source Hardening
-- Hardening the critical SEO views and tables that dictate canonicals and metadata.

CREATE TABLE IF NOT EXISTS public.seo_schema_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_family VARCHAR(50) NOT NULL UNIQUE,
    jsonld_template JSONB NOT NULL,
    required_variables TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.seo_taxonomies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(3) NOT NULL,
    state_code VARCHAR(3),
    city_slug VARCHAR(100),
    entity_type VARCHAR(50) NOT NULL, -- 'city', 'state', 'corridor', 'role'
    canonical_url VARCHAR(255) NOT NULL UNIQUE,
    parent_url VARCHAR(255),
    discovery_priority INT DEFAULT 50, -- 1-100, 100 is highest
    is_crawlable BOOLEAN DEFAULT true,
    last_crawled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.slug_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_slug VARCHAR(255) NOT NULL,
    canonical_slug VARCHAR(255) NOT NULL,
    resolved_action VARCHAR(50) NOT NULL, -- 'redirect', 'rewrite', '404'
    caught_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Secure the views that power the SEO engine
CREATE OR REPLACE VIEW public.v_hreflang_sets AS
SELECT 
    canonical_url AS primary_url,
    country_code,
    'en-' || country_code AS hreflang_code,
    updated_at
FROM public.seo_taxonomies
WHERE is_crawlable = true;

CREATE OR REPLACE VIEW public.v_public_corridor_pages AS
SELECT 
    id,
    origin_city,
    destination_city,
    slug AS canonical_slug,
    '/corridor/' || slug AS url_path,
    demand_heat_score
FROM public.h3_corridor_intelligence
WHERE is_active = true and demand_heat_score > 0.1;

CREATE OR REPLACE VIEW public.v_page_cannibalization_score AS
SELECT 
    t1.canonical_url,
    t1.entity_type,
    count(t2.id) AS duplicate_intent_count
FROM public.seo_taxonomies t1
LEFT JOIN public.seo_taxonomies t2 ON t1.entity_type = t2.entity_type AND t1.canonical_url != t2.canonical_url AND t1.state_code = t2.state_code
GROUP BY t1.canonical_url, t1.entity_type;

-- Allow read access for website renderer
GRANT SELECT ON public.seo_schema_templates TO authenticated, anon;
GRANT SELECT ON public.seo_taxonomies TO authenticated, anon;
GRANT SELECT ON public.v_hreflang_sets TO authenticated, anon;
GRANT SELECT ON public.v_public_corridor_pages TO authenticated, anon;
GRANT SELECT ON public.v_page_cannibalization_score TO authenticated, anon;
