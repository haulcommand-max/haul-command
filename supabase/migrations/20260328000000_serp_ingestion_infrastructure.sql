-- ============================================================================
-- SERP INGESTION & DORK QUEUE INFRASTRUCTURE
-- Enables systematic tracking and deduplication of Google/Social search scrapes
-- ============================================================================

-- Enable pg_trgm for fuzzy matching if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1) Dork Queue Table
-- Tracks exact search operators like: "pilot car" + "cross city" + "fl"
CREATE TABLE IF NOT EXISTS public.search_dork_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dork_query text NOT NULL, 
    target_city text,
    target_region text,
    target_country text DEFAULT 'US',
    entity_type text, -- e.g. 'operator', 'broker', 'permit_agency'
    search_engine text DEFAULT 'google_search', -- google_search, google_maps, facebook, linkedin
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    page_number integer DEFAULT 1,
    results_found integer DEFAULT 0,
    last_scraped_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_dork_status ON public.search_dork_queue(status, target_region);
CREATE INDEX IF NOT EXISTS idx_search_dork_query ON public.search_dork_queue(dork_query);

-- 2) Raw SERP Results Staging
-- Holds the messy raw results before they are normalized into `public.entities`
CREATE TABLE IF NOT EXISTS public.serp_raw_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dork_id uuid REFERENCES public.search_dork_queue(id) ON DELETE CASCADE,
    title text,
    snippet text,
    url text,
    domain text,
    phone_extracted text,
    address_extracted text,
    is_social_profile boolean DEFAULT false,
    processed_to_entity boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_serp_domain ON public.serp_raw_results(domain);
CREATE INDEX IF NOT EXISTS idx_serp_processed ON public.serp_raw_results(processed_to_entity);

-- 3) Fuzzy Match RPC for Entity Resolution
-- Prevents creating duplicate records when scraping Facebook vs Google Local
CREATE OR REPLACE FUNCTION public.match_and_merge_serp_entity(
    p_name text,
    p_phone text,
    p_region text,
    p_url text
) RETURNS uuid AS $$
DECLARE
    v_entity_id uuid;
    v_normalized_name text;
BEGIN
    v_normalized_name := lower(regexp_replace(p_name, '[^a-zA-Z0-9]', '', 'g'));

    -- Strategy 1: Match by exact Phone Number
    IF p_phone IS NOT NULL AND trim(p_phone) != '' THEN
        SELECT id INTO v_entity_id FROM public.entities WHERE primary_phone = p_phone LIMIT 1;
        IF FOUND THEN RETURN v_entity_id; END IF;
    END IF;

    -- Strategy 2: Match by exact Domain/URL
    IF p_url IS NOT NULL AND trim(p_url) != '' THEN
        SELECT id INTO v_entity_id FROM public.entities WHERE website = p_url LIMIT 1;
        IF FOUND THEN RETURN v_entity_id; END IF;
    END IF;

    -- Strategy 3: Trigram Fuzzy Match on Name within the same State/Region (Similarity > 0.7)
    IF v_normalized_name IS NOT NULL AND p_region IS NOT NULL THEN
        SELECT id INTO v_entity_id 
        FROM public.entities 
        WHERE region = p_region 
        AND similarity(normalized_name, v_normalized_name) > 0.7
        ORDER BY similarity(normalized_name, v_normalized_name) DESC
        LIMIT 1;

        IF FOUND THEN RETURN v_entity_id; END IF;
    END IF;

    -- Return NULL if no match, signaling the scraper to INSERT a brand new entity
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) State Business Registry Data (e.g. Sunbiz)
CREATE TABLE IF NOT EXISTS public.entity_corporate_registrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
    state_code text NOT NULL,
    document_number text,
    ein text,
    company_name text NOT NULL,
    status text, -- e.g., 'ACTIVE', 'INACTIVE'
    principal_address text,
    registered_agent_name text,
    inc_date date,
    source_url text, -- The search.sunbiz.org URL
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(state_code, document_number)
);

CREATE INDEX IF NOT EXISTS idx_corp_reg_entity ON public.entity_corporate_registrations(entity_id);

-- RLS Setup
ALTER TABLE public.search_dork_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serp_raw_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_corporate_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sr_dorks" ON public.search_dork_queue FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "sr_serps" ON public.serp_raw_results FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "sr_corp_reg" ON public.entity_corporate_registrations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "public_read_corp_reg" ON public.entity_corporate_registrations FOR SELECT USING (true);
