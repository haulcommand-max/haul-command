-- Migration: 20260220_chamber_seo_engine.sql
-- Subagent: Launch Dominance Setup
-- Provides the schema for the Topical Authority Engine (Local SEO via Chambers of Commerce)

-- 1. Raw Ingestion Table
CREATE TABLE IF NOT EXISTS public.chambers_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  source_url text NOT NULL,
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  raw_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  name text,
  website text,
  phone text,
  email text,
  address_line1 text,
  city text,
  region text,
  postal_code text,
  country text,
  confidence numeric,
  parse_version text
);

CREATE INDEX IF NOT EXISTS idx_chambers_raw_website ON public.chambers_raw (website);
CREATE INDEX IF NOT EXISTS idx_chambers_raw_loc ON public.chambers_raw (city, region, country);

-- 2. Canonical Chambers Table (Deduped & Enriched)
CREATE TABLE IF NOT EXISTS public.chambers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  website text,
  domain text,
  phone text,
  email text,
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal_code text,
  country text,
  lat numeric,
  lng numeric,
  metro text,
  county text,
  tags text[] DEFAULT '{}'::text[],
  confidence numeric DEFAULT 0.5,
  data_freshness_score numeric DEFAULT 0.5,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chambers_domain ON public.chambers (domain);
CREATE INDEX IF NOT EXISTS idx_chambers_loc ON public.chambers (city, region, country);

-- 3. Chamber Aliases
CREATE TABLE IF NOT EXISTS public.chamber_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamber_id uuid NOT NULL REFERENCES public.chambers(id) ON DELETE CASCADE,
  alias_name text NOT NULL,
  alias_domain text,
  source_url text,
  created_at timestamptz DEFAULT now()
);

-- 4. Chamber Sources (Provenance)
CREATE TABLE IF NOT EXISTS public.chamber_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamber_id uuid NOT NULL REFERENCES public.chambers(id) ON DELETE CASCADE,
  source text NOT NULL,
  source_url text NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  source_confidence numeric DEFAULT 0.5,
  raw_id uuid REFERENCES public.chambers_raw(id) ON DELETE SET NULL
);

-- 5. Ingestion Jobs (Job Control)
CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL CHECK (job_type IN ('seed', 'expand', 'refresh', 'enrich')),
  status text NOT NULL CHECK (status IN ('queued', 'running', 'done', 'failed')),
  cursor jsonb DEFAULT '{}'::jsonb,
  attempts int DEFAULT 0,
  last_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON public.ingestion_jobs(job_type, status);

-- RLS Policies
ALTER TABLE public.chambers_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chambers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamber_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamber_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;

-- Public read access to canonical chambers for SEO pages
CREATE POLICY "public_read_chambers" ON public.chambers FOR SELECT USING (true);

-- Service role full access for ingestion edge functions
CREATE POLICY "service_role_all_chambers_raw" ON public.chambers_raw FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_chambers" ON public.chambers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_chamber_aliases" ON public.chamber_aliases FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_chamber_sources" ON public.chamber_sources FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_ingestion_jobs" ON public.ingestion_jobs FOR ALL USING (auth.role() = 'service_role');

-- 6. Extension for Fuzzy Matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 7. Deduplication & Upsert RPC (3-Pass Algorithm)
CREATE OR REPLACE FUNCTION public.dedupe_and_upsert_chamber_raw(p_raw_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_raw public.chambers_raw%ROWTYPE;
    v_canonical_id uuid;
    v_domain text;
    v_normalized_phone text;
    v_normalized_name text;
BEGIN
    -- 1. Get the raw record
    SELECT * INTO v_raw FROM public.chambers_raw WHERE id = p_raw_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Raw chamber record not found';
    END IF;

    -- Extract eTLD+1 domain (simplified here, best handled strictly in edge function before inserting to raw)
    v_domain := COALESCE(substring(v_raw.website from '^(?:https?:\/\/)?(?:www\.)?([^\/]+)'), '');
    v_normalized_phone := regexp_replace(v_raw.phone, '\D', '', 'g'); -- Strip non-digits
    
    -- Normalize name for fuzzy match (strip punctuation, lower, remove typical stops)
    v_normalized_name := lower(regexp_replace(v_raw.name, '[^\w\s]', '', 'g'));
    v_normalized_name := replace(v_normalized_name, 'chamber of commerce', '');
    v_normalized_name := replace(v_normalized_name, 'board of trade', '');
    v_normalized_name := trim(v_normalized_name);

    -- PASS 1: Exact Domain Match (Highest Confidence)
    IF v_domain != '' THEN
        SELECT id INTO v_canonical_id FROM public.chambers 
        WHERE domain = v_domain AND country = v_raw.country LIMIT 1;
    END IF;

    -- PASS 2: Phone Match within same region
    IF v_canonical_id IS NULL AND v_normalized_phone != '' THEN
        SELECT id INTO v_canonical_id FROM public.chambers 
        WHERE regexp_replace(phone, '\D', '', 'g') = v_normalized_phone 
          AND region = v_raw.region AND country = v_raw.country LIMIT 1;
    END IF;

    -- PASS 3: Fuzzy Name Match + Same City/Region
    IF v_canonical_id IS NULL AND v_normalized_name != '' THEN
        SELECT id INTO v_canonical_id FROM public.chambers 
        WHERE city = v_raw.city AND region = v_raw.region AND country = v_raw.country
          AND similarity(
              replace(replace(lower(regexp_replace(canonical_name, '[^\w\s]', '', 'g')), 'chamber of commerce', ''), 'board of trade', ''),
              v_normalized_name
          ) >= 0.88 LIMIT 1;
    END IF;

    -- Upsert Logic
    IF v_canonical_id IS NOT NULL THEN
        -- Merge: Update missing fields only (coalesce preserves existing data if raw is null)
        UPDATE public.chambers SET
            phone = COALESCE(phone, v_raw.phone),
            email = COALESCE(email, v_raw.email),
            address_line1 = COALESCE(address_line1, v_raw.address_line1),
            postal_code = COALESCE(postal_code, v_raw.postal_code),
            updated_at = now()
        WHERE id = v_canonical_id;
    ELSE
        -- Insert new canonical record
        INSERT INTO public.chambers (
            canonical_name, slug, website, domain, phone, email, 
            address_line1, city, region, postal_code, country, confidence
        ) VALUES (
            v_raw.name, 
            lower(regexp_replace(v_raw.name || '-' || v_raw.city || '-' || v_raw.region, '[^a-z0-9]+', '-', 'g')),
            v_raw.website, v_domain, v_raw.phone, v_raw.email,
            v_raw.address_line1, v_raw.city, v_raw.region, v_raw.postal_code, v_raw.country, v_raw.confidence
        ) RETURNING id INTO v_canonical_id;
    END IF;

    -- Record Provenance
    INSERT INTO public.chamber_sources (chamber_id, source, source_url, source_confidence, raw_id)
    VALUES (v_canonical_id, v_raw.source, v_raw.source_url, v_raw.confidence, v_raw.id)
    ON CONFLICT DO NOTHING;

    RETURN v_canonical_id;
END;
$$;
