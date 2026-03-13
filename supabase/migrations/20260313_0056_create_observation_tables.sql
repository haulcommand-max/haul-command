-- 20260313_0056_create_observation_tables.sql
-- New observation (append-only) tables:
--   1. hc_availability_snapshots
--   2. hc_correction_events
--   3. hc_route_friction_observations
--   4. hc_map_pack_signal_snapshots
--   5. hc_ranking_signal_snapshots
--
-- NOT CREATED (merged into existing stronger systems):
--   - hc_review_events → hc_reputation_events + escort_reviews + broker_reviews
--   - hc_recommendation_events → recommendations (extended in 0054)
--   - hc_claim_events → claim_audit_log (extended in 0054)
--   - hc_rfq_events → load_requests (extended in 0055)
--   - hc_quote_events → quote_requests (extended in 0055)

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. hc_availability_snapshots — append-only observation log
--    Complements operator_availability (current-state) with history
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_availability_snapshots (
  availability_snapshot_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id              uuid NOT NULL REFERENCES public.surfaces(id) ON DELETE CASCADE,
  captured_at             timestamptz NOT NULL DEFAULT now(),
  source_type             text NOT NULL,              -- api, manual, ping, scrape, vapi
  source_ref              text,                       -- reference ID from source system
  available_from          timestamptz,
  available_until         timestamptz,
  geographies_available   jsonb NOT NULL DEFAULT '[]'::jsonb,
  corridors_available     uuid[] NOT NULL DEFAULT '{}'::uuid[],
  service_types           text[] NOT NULL DEFAULT '{}'::text[],
  equipment_types         text[] NOT NULL DEFAULT '{}'::text[],
  urgent_ready            boolean NOT NULL DEFAULT false,
  after_hours_ready       boolean NOT NULL DEFAULT false,
  contact_preference      text                        -- phone, text, app, email
);

CREATE INDEX IF NOT EXISTS idx_hc_avail_listing_time
  ON public.hc_availability_snapshots(listing_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_hc_avail_corridors_gin
  ON public.hc_availability_snapshots USING GIN(corridors_available);
CREATE INDEX IF NOT EXISTS idx_hc_avail_services_gin
  ON public.hc_availability_snapshots USING GIN(service_types);
CREATE INDEX IF NOT EXISTS idx_hc_avail_captured
  ON public.hc_availability_snapshots(captured_at DESC);

ALTER TABLE public.hc_availability_snapshots ENABLE ROW LEVEL SECURITY;
-- INTERNAL-ONLY: contains contact_preference. Use mv_hc_availability_current for display.
CREATE POLICY hc_avail_service ON public.hc_availability_snapshots
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
-- NO public read. NO GRANT.


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. hc_correction_events — data quality correction queue
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_correction_events (
  correction_event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type      text NOT NULL,                     -- surface, profile, corridor, metro, city
  entity_id        uuid NOT NULL,
  captured_at      timestamptz NOT NULL DEFAULT now(),
  field_name       text NOT NULL,                     -- which field is being corrected
  old_value        jsonb,
  new_value        jsonb,
  correction_type  text NOT NULL,                     -- user_reported, automated, admin, scrape_conflict
  source_type      text,                              -- who/what submitted the correction
  resolved_flag    boolean NOT NULL DEFAULT false,
  resolution_notes text,
  resolved_at      timestamptz,
  resolved_by      uuid                               -- admin/moderator user_id
);

DO $$ BEGIN
  ALTER TABLE public.hc_correction_events ADD CONSTRAINT chk_corr_type
    CHECK (correction_type IN ('user_reported','automated','admin','scrape_conflict','community_vote'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_hc_corr_entity_resolved
  ON public.hc_correction_events(entity_type, entity_id, resolved_flag);
CREATE INDEX IF NOT EXISTS idx_hc_corr_unresolved
  ON public.hc_correction_events(resolved_flag, captured_at DESC) WHERE resolved_flag = false;
CREATE INDEX IF NOT EXISTS idx_hc_corr_type
  ON public.hc_correction_events(correction_type);

ALTER TABLE public.hc_correction_events ENABLE ROW LEVEL SECURITY;
-- INTERNAL-ONLY: admin workflow data (resolution_notes, resolved_by, value diffs).
CREATE POLICY hc_corr_service ON public.hc_correction_events
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
-- NO public read. NO GRANT.


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. hc_route_friction_observations — route compliance friction signals
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_route_friction_observations (
  route_friction_observation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id     uuid REFERENCES public.corridors(id) ON DELETE SET NULL,
  jurisdiction_id uuid,
  captured_at     timestamptz NOT NULL DEFAULT now(),
  source_type     text NOT NULL,                      -- regulation_scrape, manual, crowd, ai_analysis
  permit_friction_level numeric(6,3) NOT NULL DEFAULT 0,
  escort_friction_level numeric(6,3) NOT NULL DEFAULT 0,
  survey_friction_level numeric(6,3) NOT NULL DEFAULT 0,
  overnight_risk_level numeric(6,3) NOT NULL DEFAULT 0,
  holiday_restriction_level numeric(6,3) NOT NULL DEFAULT 0,
  curfew_restriction_level numeric(6,3) NOT NULL DEFAULT 0,
  bridge_clearance_risk numeric(6,3) NOT NULL DEFAULT 0,
  notes           text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_hc_friction_corridor_time
  ON public.hc_route_friction_observations(corridor_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_hc_friction_jurisdiction
  ON public.hc_route_friction_observations(jurisdiction_id, captured_at DESC);

ALTER TABLE public.hc_route_friction_observations ENABLE ROW LEVEL SECURITY;
-- INTERNAL-ONLY: operational friction data, competitive intelligence.
CREATE POLICY hc_friction_service ON public.hc_route_friction_observations
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
-- NO public read. NO GRANT.


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. hc_map_pack_signal_snapshots — map-pack readiness signals
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_map_pack_signal_snapshots (
  map_pack_signal_snapshot_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type      text NOT NULL,                     -- surface, profile, metro, city
  entity_id        uuid NOT NULL,
  captured_at      timestamptz NOT NULL DEFAULT now(),
  nap_consistency_score numeric(6,3) NOT NULL DEFAULT 0,
  category_completeness_score numeric(6,3) NOT NULL DEFAULT 0,
  photo_completeness_score numeric(6,3) NOT NULL DEFAULT 0,
  review_volume_score numeric(6,3) NOT NULL DEFAULT 0,
  review_quality_score numeric(6,3) NOT NULL DEFAULT 0,
  hours_completeness_score numeric(6,3) NOT NULL DEFAULT 0,
  services_completeness_score numeric(6,3) NOT NULL DEFAULT 0,
  website_linkage_score numeric(6,3) NOT NULL DEFAULT 0,
  maps_presence_score numeric(6,3) NOT NULL DEFAULT 0,
  overall_readiness_score numeric(6,3) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_hc_mappack_entity_time
  ON public.hc_map_pack_signal_snapshots(entity_type, entity_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_hc_mappack_readiness
  ON public.hc_map_pack_signal_snapshots(overall_readiness_score DESC);

ALTER TABLE public.hc_map_pack_signal_snapshots ENABLE ROW LEVEL SECURITY;
-- INTERNAL-ONLY: competitive SEO intelligence (readiness components).
CREATE POLICY hc_mappack_service ON public.hc_map_pack_signal_snapshots
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
-- NO public read. NO GRANT.


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. hc_ranking_signal_snapshots — explainable ranking signal history
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_ranking_signal_snapshots (
  ranking_signal_snapshot_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id       uuid NOT NULL REFERENCES public.surfaces(id) ON DELETE CASCADE,
  captured_at      timestamptz NOT NULL DEFAULT now(),
  claim_score      numeric(6,3) NOT NULL DEFAULT 0,
  verification_score numeric(6,3) NOT NULL DEFAULT 0,
  freshness_score  numeric(6,3) NOT NULL DEFAULT 0,
  review_recommendation_score numeric(6,3) NOT NULL DEFAULT 0,
  availability_score numeric(6,3) NOT NULL DEFAULT 0,
  geo_relevance_score numeric(6,3) NOT NULL DEFAULT 0,
  corridor_relevance_score numeric(6,3) NOT NULL DEFAULT 0,
  completeness_score numeric(6,3) NOT NULL DEFAULT 0,
  off_platform_proof_score numeric(6,3) NOT NULL DEFAULT 0,
  boost_score      numeric(6,3) NOT NULL DEFAULT 0,
  sponsor_score    numeric(6,3) NOT NULL DEFAULT 0,
  final_rank_score numeric(6,3) NOT NULL DEFAULT 0,
  rank_formula_version text NOT NULL DEFAULT 'v1'
);

CREATE INDEX IF NOT EXISTS idx_hc_rank_listing_time
  ON public.hc_ranking_signal_snapshots(listing_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_hc_rank_final
  ON public.hc_ranking_signal_snapshots(final_rank_score DESC);

ALTER TABLE public.hc_ranking_signal_snapshots ENABLE ROW LEVEL SECURITY;
-- INTERNAL-ONLY: ranking internals (boost_score, sponsor_score, final_rank_score).
CREATE POLICY hc_rank_service ON public.hc_ranking_signal_snapshots
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
-- NO public read. NO GRANT.

COMMIT;
