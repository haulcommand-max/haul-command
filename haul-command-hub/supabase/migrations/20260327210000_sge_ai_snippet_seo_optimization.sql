-- Migration: AI Snippet & SGE (Search Generative Experience) SEO Overhaul
-- Goal: Hardcode the absolute maximum SEO leverage to win Google Snippets, People Also Ask (PAA), and AI Overviews.

-- 1. UPGRADING THE DICTIONARY FOR SGE & SNIPPETS
ALTER TABLE public.hc_dictionary 
  ADD COLUMN IF NOT EXISTS snippet_target_query TEXT,            -- e.g. "What is an Ice Bridge Engineer?"
  ADD COLUMN IF NOT EXISTS ai_overview_summary TEXT,             -- A 45-word optimized block specifically for Perplexity/Google SGE
  ADD COLUMN IF NOT EXISTS faq_schema_markup JSONB,              -- Injected straight into the <head>
  ADD COLUMN IF NOT EXISTS priority_score DECIMAL DEFAULT 1.0;   -- Ranking authority

-- 2. UPGRADING PROFILES FOR HYPER-LOCAL DOMINATION (LONG TAIL)
ALTER TABLE public.directory_listings
  ADD COLUMN IF NOT EXISTS local_business_schema JSONB,          -- Strict LocalBusiness JSON-LD
  ADD COLUMN IF NOT EXISTS long_tail_keywords TEXT[],            -- e.g. ["emergency heavy towing near dubai", "night time pilot car uae"]
  ADD COLUMN IF NOT EXISTS distance_radius_km INTEGER DEFAULT 250;

-- 3. UPGRADING TOOLS & STATIC PAGES FOR RANKING
ALTER TABLE public.hc_page_seo_contracts
  ADD COLUMN IF NOT EXISTS tool_schema_markup JSONB,             -- WebApplication / SoftwareApplication schema
  ADD COLUMN IF NOT EXISTS main_entity_of_page TEXT,             -- Schema.org mapping
  ADD COLUMN IF NOT EXISTS snippet_preview_text TEXT;            -- The exact 160 char preview we force Google to show

-- 4. CREATE A VIEW TO FEED NEXT.JS APP ROUTER DIRECTLY
CREATE OR REPLACE VIEW public.sge_optimized_sitemap AS 
  SELECT 
    slug,
    category,
    snippet_target_query as primary_query,
    ai_overview_summary as ai_summary,
    faq_schema_markup as json_ld
  FROM hc_dictionary
  WHERE is_published = true;

-- 5. COMMENT THE STRUCTURES
COMMENT ON COLUMN hc_dictionary.ai_overview_summary IS 'Written specifically to be scraped by LLMs for zero-click search domination.';
COMMENT ON COLUMN directory_listings.long_tail_keywords IS 'Used by the Next.js router to dynamically generate localized landing pages.';
