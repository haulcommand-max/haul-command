-- Phase 16: Automated SEO Dictionary & Glossary Paywall
-- Mirrors the 500+ term TypeScript data structure into the Supabase cluster
-- Forms the final bridge for mobile app data-layer syncing

CREATE TABLE IF NOT EXISTS public.hc_dictionary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id TEXT UNIQUE NOT NULL,
    term TEXT NOT NULL,
    category TEXT NOT NULL,
    definition TEXT NOT NULL,
    hc_brand_term TEXT,
    countries TEXT[] DEFAULT '{}',
    aliases TEXT[] DEFAULT '{}',
    seo_keywords TEXT[] DEFAULT '{}',
    regulatory_ref TEXT,
    is_pro_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Optimize for dynamic term search (for future fast-lookup from Mobile App)
CREATE INDEX IF NOT EXISTS idx_hc_dict_category ON public.hc_dictionary(category);
CREATE INDEX IF NOT EXISTS idx_hc_dict_countries ON public.hc_dictionary USING GIN (countries);

-- RLS Hardening Check
ALTER TABLE public.hc_dictionary ENABLE ROW LEVEL SECURITY;

-- Dictionary definitions are freely viewable by public (UI limits exposure via React state)
CREATE POLICY "Dictionary allows public selection"
ON public.hc_dictionary FOR SELECT
USING (true);

-- Ensure only server roles/system can modify terms
CREATE POLICY "Dictionary updates locked to system"
ON public.hc_dictionary FOR ALL
USING (auth.role() = 'service_role');
