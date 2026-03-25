-- Phase 17: Omni-Sync Schema
-- Smashes the 73 Positions, 57 Country Regulations, and 500+ Dictionary Terms 
-- into the global Supabase structure to ensure absolute state dominance.

-- Positions Matrix
CREATE TABLE IF NOT EXISTS public.hc_positions_global (
    term_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    countries TEXT[] DEFAULT '{}',
    is_autonomous BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Active Regulations Database
CREATE TABLE IF NOT EXISTS public.hc_regulations_global (
    country_code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    authority_name TEXT NOT NULL,
    authority_url TEXT,
    max_metric_width NUMERIC,
    max_metric_height NUMERIC,
    max_metric_weight NUMERIC,
    single_escort_threshold NUMERIC,
    police_escort_threshold NUMERIC,
    regulatory_citation TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure RLS is fully enforced
ALTER TABLE public.hc_positions_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_regulations_global ENABLE ROW LEVEL SECURITY;

-- Read rules (Open for Directory rendering)
CREATE POLICY "Positions public lookup" ON public.hc_positions_global FOR SELECT USING (true);
CREATE POLICY "Regulations public lookup" ON public.hc_regulations_global FOR SELECT USING (true);

-- System Override Write Laws
CREATE POLICY "Service Role Full Access Positions" ON public.hc_positions_global FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Regulations" ON public.hc_regulations_global FOR ALL USING (auth.role() = 'service_role');
