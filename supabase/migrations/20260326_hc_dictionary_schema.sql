-- ============================================================================
-- HAUL COMMAND: GLOBAL DICTIONARY SCHEMA (57 COUNTRIES)
-- ============================================================================
-- Creates the canonical public.hc_dictionary table and pgvector search 
-- to support the Next.js /api/admin/sync-dictionary route.
-- ============================================================================

-- 1. Ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the canonical hc_dictionary table
CREATE TABLE IF NOT EXISTS public.hc_dictionary (
  term_id text PRIMARY KEY,
  term text NOT NULL,
  category text NOT NULL,
  definition text NOT NULL,
  hc_brand_term text,
  countries text[] DEFAULT '{}'::text[],
  aliases text[] DEFAULT '{}'::text[],
  seo_keywords text[] DEFAULT '{}'::text[],
  regulatory_ref text,
  is_pro_locked boolean NOT NULL DEFAULT false,
  embedding vector(1536),           -- For OpenAI embeddings during AI search
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create performance and AI vector indices 
CREATE INDEX IF NOT EXISTS idx_hc_dict_category ON public.hc_dictionary(category);
CREATE INDEX IF NOT EXISTS idx_hc_dict_countries ON public.hc_dictionary USING GIN (countries);
CREATE INDEX IF NOT EXISTS idx_hc_dict_embedding ON public.hc_dictionary USING hnsw (embedding vector_cosine_ops);

-- 4. Set up the auto-timestamp trigger
CREATE OR REPLACE FUNCTION update_hc_dict_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hc_dictionary_updated_at ON public.hc_dictionary;
CREATE TRIGGER hc_dictionary_updated_at
  BEFORE UPDATE ON public.hc_dictionary
  FOR EACH ROW EXECUTE FUNCTION update_hc_dict_timestamp();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.hc_dictionary ENABLE ROW LEVEL SECURITY;

-- 6. Define Security Policies
-- Allow public (anon/authenticated) to read non-premium terms for the SEO dictionary page
DROP POLICY IF EXISTS "hc_dictionary: public read" ON public.hc_dictionary;
CREATE POLICY "hc_dictionary: public read"
  ON public.hc_dictionary FOR SELECT
  USING (is_pro_locked = false);

-- Allow authenticated users fully unlocked read access
DROP POLICY IF EXISTS "hc_dictionary: pro user read" ON public.hc_dictionary;
CREATE POLICY "hc_dictionary: pro user read"
  ON public.hc_dictionary FOR SELECT
  TO authenticated
  USING (true);

-- Allow service_role to do EVERYTHING (used by API sync to upsert)
DROP POLICY IF EXISTS "hc_dictionary: service_role all" ON public.hc_dictionary;
CREATE POLICY "hc_dictionary: service_role all"
  ON public.hc_dictionary FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 7. Fix the match_dictionary RPC signature (term_id must be TEXT, not BIGINT)
CREATE OR REPLACE FUNCTION public.match_dictionary(
  query_embedding vector,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  term_id text,
  term text,
  definition text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.term_id,
    d.term,
    d.definition,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM public.hc_dictionary d
  WHERE 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
