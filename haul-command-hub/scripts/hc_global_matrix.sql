-- =========================================================================
-- HAUL COMMAND - GLOBAL MATRIX CONSOLIDATION DDL
-- Execute this directly in the Supabase SQL Editor
-- =========================================================================

-- 1. Create the Global Operators canonical table
CREATE TABLE IF NOT EXISTS public.hc_global_operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_table TEXT DEFAULT 'internal',
    source_id TEXT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    entity_type TEXT DEFAULT 'pilot-car',
    country_code TEXT DEFAULT 'US',
    admin1_code TEXT,
    city TEXT,
    phone_normalized TEXT,
    email TEXT,
    website_url TEXT,
    is_claimed BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    sync_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_global_operator_slug UNIQUE (slug)
);

-- 2. Enable Row Level Security
ALTER TABLE public.hc_global_operators ENABLE ROW LEVEL SECURITY;

-- 3. Create Public Read Policy
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Global Operators are publicly readable" ON hc_global_operators;
    CREATE POLICY "Global Operators are publicly readable" 
    ON public.hc_global_operators FOR SELECT 
    USING (true);
END $$;

-- 4. Create Indexes for High-Velocity Queries
CREATE INDEX IF NOT EXISTS idx_hc_global_geo ON public.hc_global_operators (country_code, admin1_code);
CREATE INDEX IF NOT EXISTS idx_hc_global_entity ON public.hc_global_operators (entity_type);

-- 5. Helper Function: Normalize Slugs
CREATE OR REPLACE FUNCTION public.normalize_slug(name TEXT, city TEXT, state TEXT)
RETURNS TEXT AS $$
DECLARE
    raw_slug TEXT;
BEGIN
    raw_slug := lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'));
    raw_slug := trim(both '-' from raw_slug);
    
    IF city IS NOT NULL AND state IS NOT NULL THEN
        raw_slug := raw_slug || '-' || lower(regexp_replace(city, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || lower(state);
    END IF;
    
    RETURN substring(raw_slug, 1, 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =========================================================================
-- DATA CONSOLIDATION EXECUTION
-- =========================================================================

-- Step A: Port 'hc_public_operators' (Top Tier/Currently Live)
INSERT INTO public.hc_global_operators 
    (source_table, name, slug, entity_type, country_code, admin1_code, city, phone_normalized, is_verified)
SELECT 
    'hc_public_operators',
    name,
    slug,
    entity_type,
    country_code,
    state_code,
    city,
    phone_normalized,
    true
FROM public.hc_public_operators
ON CONFLICT (slug) DO NOTHING;

-- Step B: Port 'hc_source_tsas' (Verified Scrape Payload)
INSERT INTO public.hc_global_operators 
    (source_table, source_id, name, slug, entity_type, country_code, admin1_code, city, phone_normalized, email, website_url)
SELECT 
    'hc_source_tsas',
    source_id::TEXT,
    COALESCE(name_normalized, name),
    public.normalize_slug(COALESCE(name_normalized, name), city, admin1_code),
    CASE 
        WHEN hc_entity_type ILIKE '%heavy%' THEN 'heavy-haul'
        WHEN hc_entity_type ILIKE '%pole%' THEN 'pole-car'
        ELSE 'pilot-car' 
    END,
    country_code,
    admin1_code,
    city,
    regexp_replace(phone_primary, '\D', '', 'g'),
    email,
    website_url
FROM public.hc_source_tsas
ON CONFLICT (slug) DO NOTHING;

-- Step C: Inject Missing Column for TSAS Table (if missing) 
-- This fixes the failed migration script attempt
ALTER TABLE IF EXISTS public.hc_source_tsas 
ADD COLUMN IF NOT EXISTS promoted_to_public BOOLEAN DEFAULT true;

-- Update TSAS table since they are now all consolidated
UPDATE public.hc_source_tsas SET promoted_to_public = true;

-- =========================================================================
-- END MIGRATION
-- =========================================================================
