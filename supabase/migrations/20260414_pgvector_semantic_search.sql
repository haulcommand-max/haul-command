-- ════════════════════════════════════════════════════════════════════════════
-- Migration: pgvector semantic search + operator alerts
-- Run in: Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Enable pgvector extension ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 2. Add embedding columns to searchable content tables ───────────────────

-- SEO pages (76K+ pages — primary semantic index)
ALTER TABLE hc_seo_pages
  ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Training courses
ALTER TABLE hc_training_courses
  ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Glossary terms
ALTER TABLE hc_glossary_terms
  ADD COLUMN IF NOT EXISTS embedding vector(384);

-- ── 3. Create IVFFlat indexes for fast ANN search ───────────────────────────
-- Note: IVFFlat must be built AFTER data is loaded (need at least 5K rows for
-- meaningful lists count). If table is empty, skip indexes and add later.

CREATE INDEX IF NOT EXISTS idx_seo_pages_embedding
  ON hc_seo_pages
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_training_courses_embedding
  ON hc_training_courses
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- ── 4. Semantic similarity search function ───────────────────────────────────
CREATE OR REPLACE FUNCTION search_content(
  query_embedding vector(384),
  match_threshold float  DEFAULT 0.65,
  match_count     int    DEFAULT 10,
  table_filter    text   DEFAULT 'all' -- 'seo_pages', 'training', 'glossary', 'all'
)
RETURNS TABLE (
  id         uuid,
  title      text,
  content    text,
  url        text,
  source     text,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF table_filter = 'training' OR table_filter = 'all' THEN
    RETURN QUERY
    SELECT
      tc.id,
      tc.title,
      tc.description::text  AS content,
      ('/training/' || tc.slug)::text AS url,
      'training'::text      AS source,
      (1 - (tc.embedding <=> query_embedding))::float AS similarity
    FROM hc_training_courses tc
    WHERE tc.embedding IS NOT NULL
      AND (1 - (tc.embedding <=> query_embedding)) > match_threshold
    ORDER BY tc.embedding <=> query_embedding
    LIMIT match_count;
  END IF;

  IF table_filter = 'seo_pages' OR table_filter = 'all' THEN
    RETURN QUERY
    SELECT
      p.id,
      p.title,
      p.meta_description::text AS content,
      p.canonical_url::text    AS url,
      'seo_page'::text         AS source,
      (1 - (p.embedding <=> query_embedding))::float AS similarity
    FROM hc_seo_pages p
    WHERE p.embedding IS NOT NULL
      AND (1 - (p.embedding <=> query_embedding)) > match_threshold
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count;
  END IF;
END;
$$;

-- ── 5. Operator alerts table (for negative sentiment flagging) ───────────────
CREATE TABLE IF NOT EXISTS hc_operator_alerts (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type      text        NOT NULL, -- 'negative_sentiment', 'churn_risk', 'compliance_issue'
  severity        text        DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  context         text,                 -- Truncated message text (max 500 chars)
  sentiment_score float,
  context_id      text,                 -- Optional: message_id, conversation_id, etc.
  resolved        boolean     DEFAULT false,
  resolved_by     uuid        REFERENCES auth.users(id),
  resolved_at     timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- Fast index for unresolved high-severity alerts (admin dashboard query)
CREATE INDEX IF NOT EXISTS idx_operator_alerts_unresolved
  ON hc_operator_alerts (resolved, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_operator_alerts_operator
  ON hc_operator_alerts (operator_id, created_at DESC);

-- ── 6. Add AI classification columns to loads table ─────────────────────────
ALTER TABLE loads
  ADD COLUMN IF NOT EXISTS ai_load_type     text,
  ADD COLUMN IF NOT EXISTS ai_urgency       text,
  ADD COLUMN IF NOT EXISTS ai_classified_at timestamptz;

-- ── 7. Row Level Security for alerts table ──────────────────────────────────
ALTER TABLE hc_operator_alerts ENABLE ROW LEVEL SECURITY;

-- Admins can see all alerts
CREATE POLICY "Admins can view all alerts"
  ON hc_operator_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Operators can see their own alerts
CREATE POLICY "Operators can view own alerts"
  ON hc_operator_alerts FOR SELECT
  USING (operator_id = auth.uid());
