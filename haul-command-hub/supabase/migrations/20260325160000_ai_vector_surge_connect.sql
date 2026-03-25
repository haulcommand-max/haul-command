-- Phase 18: Multi-Agent AI & Stripe Financial Architecture
-- 1. Enables pgvector for Semantic Search over Regulations/Glossary
-- 2. Initializes the Haul Command Market Surge matrix (Dynamic Pricing)

-- Enable PostgreSQL Vector Extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Inject 768-dimensional embeddings (tuned for Gemini 1.5 Text Encoders)
ALTER TABLE public.hc_dictionary ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE public.hc_regulations_global ADD COLUMN IF NOT EXISTS embedding vector(768);

-- The Surge Engine State Table
CREATE TABLE IF NOT EXISTS public.hc_market_surge (
    region_code TEXT PRIMARY KEY,
    active_pilot_count INTEGER DEFAULT 0,
    surge_multiplier NUMERIC(3,2) DEFAULT 1.00,
    last_calculated_at TIMESTAMPTZ DEFAULT now()
);

-- Search Function: Cosine Similarity for Dictionary
CREATE OR REPLACE FUNCTION match_dictionary_terms (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  term_id text,
  term text,
  definition text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    term_id,
    term,
    definition,
    1 - (embedding <=> query_embedding) AS similarity
  FROM public.hc_dictionary
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- RLS
ALTER TABLE public.hc_market_surge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public surge viewing" ON public.hc_market_surge FOR SELECT USING (true);
CREATE POLICY "API Backend Override" ON public.hc_market_surge FOR ALL USING (auth.role() = 'service_role');
