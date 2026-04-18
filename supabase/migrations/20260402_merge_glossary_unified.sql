-- ============================================================================
-- HAUL COMMAND: MERGE 3 GLOSSARY TABLES + POPULATE EXTENDED FIELDS
-- Unifies glossary_terms, hc_dictionary, and glossary_concepts
-- ============================================================================

-- 1. Ensure all extended fields exist on glossary_terms
ALTER TABLE public.glossary_terms 
ADD COLUMN IF NOT EXISTS is_pro_locked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS regulatory_ref text,
ADD COLUMN IF NOT EXISTS schema_faq_eligible boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS snippet_eligible boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS snippet_priority int DEFAULT 0,
ADD COLUMN IF NOT EXISTS related_rules jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS related_services jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS related_problems jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS related_corridors jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS related_entities jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS related_tools jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS surface_categories text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS applicable_countries text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS source_confidence numeric(3,2) DEFAULT 0.9,
ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz DEFAULT now();

-- Add embedding vector if pgvector is enabled (assumes 1536 dim for openai)
-- We check if vector exists first
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
    ) THEN
        ALTER TABLE public.glossary_terms ADD COLUMN IF NOT EXISTS embedding vector(1536);
    END IF;
END $$;

-- 2. Migrate from hc_dictionary to glossary_terms
-- Maps term_id to slug, definition to short_definition/long_definition
INSERT INTO public.glossary_terms (
    slug, term, short_definition, long_definition, category, 
    acronyms, applicable_countries, regulatory_ref, is_pro_locked
)
SELECT 
    d.term_id as slug,
    d.term as term,
    LEFT(d.definition, 250) as short_definition,
    d.definition as long_definition,
    d.category as category,
    d.aliases as acronyms,
    d.countries as applicable_countries,
    d.regulatory_ref as regulatory_ref,
    d.is_pro_locked as is_pro_locked
FROM public.hc_dictionary d
ON CONFLICT (slug) DO UPDATE SET
    applicable_countries = EXCLUDED.applicable_countries,
    regulatory_ref = COALESCE(public.glossary_terms.regulatory_ref, EXCLUDED.regulatory_ref),
    is_pro_locked = EXCLUDED.is_pro_locked;

-- 3. Migrate from glossary_term_variants + glossary_concepts to glossary_terms
INSERT INTO public.glossary_terms (
    slug, term, short_definition, category, jurisdiction, 
    acronyms, noindex
)
SELECT 
    v.concept_slug || '-' || LOWER(v.country_code) as slug,
    v.term_local as term,
    c.concept_description as short_definition,
    c.category as category,
    v.country_code as jurisdiction,
    v.search_aliases as acronyms,
    v.noindex as noindex
FROM public.glossary_term_variants v
JOIN public.glossary_concepts c ON v.concept_slug = c.concept_slug
ON CONFLICT (slug) DO NOTHING;

-- 4. Unify the View to ensure all 120-country surfaces can query it
DROP VIEW IF EXISTS public.glossary_public;
CREATE OR REPLACE VIEW public.glossary_public AS
SELECT
    slug, term, short_definition, long_definition, category, synonyms,
    related_slugs, acronyms, tags, jurisdiction, example_usage, common_mistakes,
    source_confidence, snippet_priority, last_reviewed_at, schema_faq_eligible, snippet_eligible,
    related_rules, related_services, related_problems, related_corridors, related_entities, related_tools,
    surface_categories, applicable_countries, sources, updated_at,
    is_pro_locked, regulatory_ref
FROM public.glossary_terms
WHERE published = true and noindex = false;

-- 5. Populate some base intel into the extended fields to ensure UI components don't render empty arrays
UPDATE public.glossary_terms 
SET 
    snippet_priority = 10,
    surface_categories = ARRAY['compliance', 'pilot_car', 'general']
WHERE snippet_priority = 0 OR surface_categories = '{}'::text[];
