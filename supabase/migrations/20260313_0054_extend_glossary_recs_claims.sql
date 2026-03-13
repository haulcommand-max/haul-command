-- 20260313_0054_extend_glossary_recs_claims.sql
-- Extends existing stronger systems instead of creating duplicates:
--   1. glossary_terms — add SEO/linking/snippet columns
--   2. recommendations — generalize to entity-level
--   3. claim_audit_log — add funnel analytics columns

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. glossary_terms — extend for inline modules, snippet capture, query families
--    Existing: slug, term, short_definition, long_definition, category,
--              synonyms, related_slugs, acronyms, tags, jurisdiction,
--              example_usage, common_mistakes, sources, priority, noindex, published
--    Adding: why_it_matters, related_rules, related_services, related_problems,
--            related_corridors, related_entities, source_confidence,
--            snippet_priority, last_reviewed_at
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.glossary_terms
  ADD COLUMN IF NOT EXISTS why_it_matters text,
  ADD COLUMN IF NOT EXISTS related_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_services jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_problems jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_corridors jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_entities jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_confidence numeric(6,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS snippet_priority numeric(6,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_glossary_terms_snippet_priority
  ON public.glossary_terms(snippet_priority DESC);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_source_confidence
  ON public.glossary_terms(source_confidence DESC);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_reviewed
  ON public.glossary_terms(last_reviewed_at DESC NULLS LAST);


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. recommendations — generalize from user→user to entity→entity
--    Existing: id, recommender_user_id, recommended_user_id, context, created_at
--    Adding: entity_type, entity_id, recommendation_type, geo_context,
--            problem_context, corridor_context
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id uuid,
  ADD COLUMN IF NOT EXISTS recommendation_type text,
  ADD COLUMN IF NOT EXISTS geo_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS problem_context text,
  ADD COLUMN IF NOT EXISTS corridor_context uuid;

-- FK for corridor_context (idempotent)
DO $$ BEGIN
  ALTER TABLE public.recommendations
    ADD CONSTRAINT fk_rec_corridor FOREIGN KEY (corridor_context)
    REFERENCES public.corridors(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_recommendations_entity
  ON public.recommendations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_type
  ON public.recommendations(recommendation_type);


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. claim_audit_log — add funnel analytics columns
--    Existing: id, surface_id, claim_id, actor, action, payload, created_at
--    Adding: claim_stage, success_flag, verification_flag, plan_selected
--    Purpose: mv_hc_claim_funnel reads from this extended table
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.claim_audit_log
  ADD COLUMN IF NOT EXISTS claim_stage text,
  ADD COLUMN IF NOT EXISTS success_flag boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_flag boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_selected text;

CREATE INDEX IF NOT EXISTS idx_claim_audit_stage
  ON public.claim_audit_log(claim_stage);
CREATE INDEX IF NOT EXISTS idx_claim_audit_success
  ON public.claim_audit_log(success_flag) WHERE success_flag = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECURITY FIX: claim_audit_log has existing policy "audit_log_read"
-- defined as FOR SELECT USING (true) — blanket anonymous read.
-- This exposes claim_stage, plan_selected, success_flag to public.
-- Replace with service_role-only read.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS audit_log_read ON public.claim_audit_log;
CREATE POLICY claim_audit_service_read ON public.claim_audit_log
  FOR SELECT USING (auth.role() = 'service_role');

-- Revoke any existing grants
REVOKE SELECT ON public.claim_audit_log FROM anon;

COMMIT;
