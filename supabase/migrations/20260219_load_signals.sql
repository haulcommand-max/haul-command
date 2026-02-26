-- Migration: 20260219_load_signals.sql
-- Description: Schema for ingesting and parsing load signals from structured algorithms or unstructured sources (like FB groups).

-- 1. Ingestion Sources (Track where data comes from and its health)
CREATE TABLE IF NOT EXISTS public.ingestion_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type text NOT NULL CHECK (source_type IN ('facebook_group', 'broker_board', 'email_list')),
    name text NOT NULL,
    url text UNIQUE,
    is_active boolean DEFAULT true,
    last_scraped_at timestamptz,
    health_score numeric DEFAULT 1.0, -- 0 to 1 based on signal quality
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Unstructured Load Signals (The raw feed)
CREATE TABLE IF NOT EXISTS public.unstructured_load_signals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id uuid REFERENCES public.ingestion_sources(id) ON DELETE CASCADE,
    external_post_id text, -- ID from FB or source
    raw_content text NOT NULL,
    posted_at timestamptz, -- When it was actually posted on the source
    scraped_at timestamptz DEFAULT now(),
    is_parsed boolean DEFAULT false,
    parse_confidence numeric DEFAULT 0.0,
    created_at timestamptz DEFAULT now()
);

-- Prevent duplicate ingests from the same external post
CREATE UNIQUE INDEX IF NOT EXISTS idx_unstructured_external ON public.unstructured_load_signals(source_id, external_post_id) WHERE external_post_id IS NOT NULL;

-- 3. Canonical Load Signals (The structured output ready for routing/intelligence)
CREATE TABLE IF NOT EXISTS public.canonical_load_signals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    unstructured_id uuid REFERENCES public.unstructured_load_signals(id) ON DELETE SET NULL,
    
    -- Operational Fields
    origin_city text,
    origin_state text,
    dest_city text,
    dest_state text,
    load_date date,
    
    -- Requirements
    positions_needed text[], -- e.g. ['high_pole', 'chase']
    max_width numeric,
    max_height numeric,
    
    -- Value
    rate_terms text,
    
    -- Contact & Meta
    contact_info text,
    notes text,
    
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.ingestion_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unstructured_load_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_load_signals ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins control ingestion sources" ON public.ingestion_sources
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins control unstructured signals" ON public.unstructured_load_signals
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins control canonical signals" ON public.canonical_load_signals
    FOR ALL USING (public.is_admin());

-- Insert Seed FB Groups from the Spec
INSERT INTO public.ingestion_sources (source_type, name, url)
VALUES
    ('facebook_group', 'Pilot Car & Oversize Load Dispatch – Jobs, Permits, Drivers, Brokers', 'https://www.facebook.com/groups/pilotcarjobs/'),
    ('facebook_group', 'PILOT CARS AND ESCORTS', 'https://www.facebook.com/groups/297152301786233/'),
    ('facebook_group', 'Oversize Trucks Needing Pilot Cars', 'https://www.facebook.com/groups/484408119132771/'),
    ('facebook_group', 'Pilot Cars and Escorts (pilotdriver)', 'https://www.facebook.com/groups/pilotdriver/'),
    ('facebook_group', 'Pilot Car Loads Available (LOADS ONLY)', 'https://www.facebook.com/groups/1449152675407092/'),
    ('facebook_group', 'PILOT CAR SERVICES', 'https://www.facebook.com/groups/527186600681462/'),
    ('facebook_group', 'Pilot Car Drivers & Companies Network', 'https://www.facebook.com/groups/pilotcardrivers/'),
    ('facebook_group', 'Professional Pilot car operators', 'https://www.facebook.com/groups/propilotcarops/'),
    ('facebook_group', 'Pilot car load board', 'https://www.facebook.com/groups/532894146786848/'),
    ('facebook_group', 'Heavy Haul Nation', 'https://www.facebook.com/groups/1076740276114216/')
ON CONFLICT DO NOTHING;
