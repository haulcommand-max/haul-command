-- 20260313_0058_create_materialized_views.sql
-- 7 materialized views with UNIQUE indexes for CONCURRENT refresh.
-- All queries target actual existing/created tables (no references to skipped tables).
--
-- Critical changes from original spec:
--   - mv_hc_reviews_rollup reads from hc_reputation_events + escort_reviews + broker_reviews
--     (NOT from deleted hc_review_events)
--   - mv_hc_claim_funnel reads from claim_audit_log (NOT from deleted hc_claim_events)

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. mv_hc_availability_current — latest availability per listing
-- ═══════════════════════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_hc_availability_current AS
SELECT DISTINCT ON (listing_id)
  listing_id,
  captured_at AS latest_captured_at,
  CASE WHEN available_until IS NULL OR available_until > now()
    THEN 'available' ELSE 'expired'
  END AS availability_state,
  urgent_ready,
  after_hours_ready,
  service_types,
  equipment_types,
  corridors_available
FROM public.hc_availability_snapshots
ORDER BY listing_id, captured_at DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_avail_listing
  ON public.mv_hc_availability_current(listing_id);
CREATE INDEX IF NOT EXISTS idx_mv_avail_urgent
  ON public.mv_hc_availability_current(urgent_ready) WHERE urgent_ready = true;
CREATE INDEX IF NOT EXISTS idx_mv_avail_state
  ON public.mv_hc_availability_current(availability_state);

GRANT SELECT ON public.mv_hc_availability_current TO anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. mv_hc_reviews_rollup — unified reviews/reputation rollup per entity
--    Sources: hc_reputation_events (weighted rep graph) +
--             escort_reviews + broker_reviews (structured 5-axis) +
--             recommendations (entity-level recs, extended in 0054)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_hc_reviews_rollup AS
WITH rep_counts AS (
  SELECT
    subject_type AS entity_type,
    subject_id   AS entity_id,
    COUNT(*) AS reputation_event_count,
    COUNT(*) FILTER (WHERE event_type IN ('upvote','endorsement','thanks')) AS positive_events,
    COUNT(*) FILTER (WHERE event_type IN ('downvote','warning')) AS negative_events,
    COUNT(*) FILTER (WHERE evidence_ref_id IS NOT NULL) AS evidence_backed_count,
    MAX(created_at) AS last_reputation_at
  FROM public.hc_reputation_events
  WHERE status = 'active'
  GROUP BY subject_type, subject_id
),
escort_rev AS (
  SELECT
    'operator'::text AS entity_type,
    escort_id::text AS entity_id,
    COUNT(*) AS review_count,
    ROUND(AVG(
      on_time_rating * 0.30 +
      communication_rating * 0.20 +
      professionalism_rating * 0.15 +
      equipment_ready_rating * 0.10 +
      route_awareness_rating * 0.10
    )::numeric / 5.0 * 100, 1) AS review_trust_score,
    COUNT(*) FILTER (WHERE verified_job) AS verified_review_count,
    MAX(created_at) AS last_reviewed_at
  FROM public.escort_reviews
  GROUP BY escort_id
),
broker_rev AS (
  SELECT
    'broker'::text AS entity_type,
    broker_id::text AS entity_id,
    COUNT(*) AS review_count,
    ROUND(AVG(
      paid_on_time_rating * 0.45 +
      rate_accuracy_rating * 0.20 +
      communication_rating * 0.15 +
      load_clarity_rating * 0.10 +
      detention_fairness_rating * 0.10
    )::numeric / 5.0 * 100, 1) AS review_trust_score,
    COUNT(*) FILTER (WHERE verified_job) AS verified_review_count,
    MAX(created_at) AS last_reviewed_at
  FROM public.broker_reviews
  GROUP BY broker_id
),
all_reviews AS (
  SELECT * FROM escort_rev
  UNION ALL
  SELECT * FROM broker_rev
),
rec_counts AS (
  SELECT
    entity_type,
    entity_id::text AS entity_id,
    COUNT(*) AS recommendation_count
  FROM public.recommendations
  WHERE entity_type IS NOT NULL AND entity_id IS NOT NULL
  GROUP BY entity_type, entity_id
)
SELECT
  COALESCE(r.entity_type, ar.entity_type, rc2.entity_type) AS entity_type,
  COALESCE(r.entity_id, ar.entity_id, rc2.entity_id) AS entity_id,
  COALESCE(ar.review_count, 0) AS review_count,
  ar.review_trust_score,
  COALESCE(ar.verified_review_count, 0) AS verified_review_count,
  COALESCE(r.reputation_event_count, 0) AS reputation_event_count,
  COALESCE(r.positive_events, 0) AS positive_events,
  COALESCE(r.negative_events, 0) AS negative_events,
  COALESCE(r.evidence_backed_count, 0) AS evidence_backed_count,
  COALESCE(rc2.recommendation_count, 0) AS recommendation_count,
  GREATEST(r.last_reputation_at, ar.last_reviewed_at) AS last_activity_at
FROM rep_counts r
FULL OUTER JOIN all_reviews ar ON r.entity_type = ar.entity_type AND r.entity_id = ar.entity_id
FULL OUTER JOIN rec_counts rc2 ON
  COALESCE(r.entity_type, ar.entity_type) = rc2.entity_type AND
  COALESCE(r.entity_id, ar.entity_id) = rc2.entity_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_reviews_entity
  ON public.mv_hc_reviews_rollup(entity_type, entity_id);

GRANT SELECT ON public.mv_hc_reviews_rollup TO anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. mv_hc_map_pack_readiness_current — latest map-pack readiness per entity
-- ═══════════════════════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_hc_map_pack_readiness_current AS
SELECT DISTINCT ON (entity_type, entity_id)
  entity_type,
  entity_id,
  overall_readiness_score AS map_pack_readiness_score,
  nap_consistency_score,
  category_completeness_score,
  photo_completeness_score,
  review_volume_score,
  review_quality_score,
  hours_completeness_score,
  services_completeness_score,
  website_linkage_score,
  maps_presence_score,
  captured_at AS last_evaluated_at
FROM public.hc_map_pack_signal_snapshots
ORDER BY entity_type, entity_id, captured_at DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_mappack_entity
  ON public.mv_hc_map_pack_readiness_current(entity_type, entity_id);

-- INTERNAL-ONLY: competitive SEO intelligence. No public grant.
REVOKE ALL ON public.mv_hc_map_pack_readiness_current FROM anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. mv_hc_claim_funnel — claim funnel per surface
--    Reads from claim_audit_log (extended in 0054), NOT hc_claim_events
-- ═══════════════════════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_hc_claim_funnel AS
SELECT
  surface_id,
  MIN(claim_stage) AS first_claim_stage,
  (array_agg(claim_stage ORDER BY created_at DESC))[1] AS latest_claim_stage,
  bool_or(success_flag) AS claim_success_flag,
  bool_or(verification_flag) AS verification_flag,
  (array_agg(plan_selected ORDER BY created_at DESC NULLS LAST))[1] AS plan_selected,
  COUNT(*) AS claim_depth
FROM public.claim_audit_log
WHERE claim_stage IS NOT NULL
GROUP BY surface_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_claim_surface
  ON public.mv_hc_claim_funnel(surface_id);

-- INTERNAL-ONLY: claim workflow analytics. No public grant.
REVOKE ALL ON public.mv_hc_claim_funnel FROM anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. mv_hc_city_operating_scores — city health by listing density + claims
-- ═══════════════════════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_hc_city_operating_scores AS
SELECT
  c.city_id,
  c.city_name,
  c.country_code,
  c.market_mode,
  c.indexable,
  COUNT(s.id) AS listing_density,
  COUNT(s.id) FILTER (WHERE s.claim_status = 'claimed') AS claimed_count,
  CASE WHEN COUNT(s.id) > 0
    THEN COUNT(s.id) FILTER (WHERE s.claim_status = 'claimed')::numeric / COUNT(s.id)
    ELSE 0
  END AS claim_rate,
  COALESCE(AVG(s.data_confidence_score), 0) AS avg_confidence,
  c.city_operating_score
FROM public.hc_cities c
LEFT JOIN public.surfaces s ON s.city_id = c.city_id
GROUP BY c.city_id, c.city_name, c.country_code, c.market_mode, c.indexable, c.city_operating_score;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_city_ops_id
  ON public.mv_hc_city_operating_scores(city_id);
CREATE INDEX IF NOT EXISTS idx_mv_city_ops_mode
  ON public.mv_hc_city_operating_scores(market_mode);
CREATE INDEX IF NOT EXISTS idx_mv_city_ops_country
  ON public.mv_hc_city_operating_scores(country_code);

GRANT SELECT ON public.mv_hc_city_operating_scores TO authenticated;
-- AUTHENTICATED-ONLY: aggregate city stats. SSR uses service_role. No anon grant.


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. mv_hc_market_scoreboards_current — latest market scoreboard per scope
-- ═══════════════════════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_hc_market_scoreboards_current AS
SELECT DISTINCT ON (scope_type, scope_id)
  scope_type,
  scope_id,
  country_code,
  listing_density,
  verified_density,
  availability_density,
  claim_rate,
  response_health,
  recommendation_volume,
  route_support_completeness,
  infrastructure_completeness,
  enterprise_readiness,
  monetization_readiness,
  overall_market_score,
  captured_at AS last_computed_at
FROM public.hc_market_scoreboard_snapshots
ORDER BY scope_type, scope_id, captured_at DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_scoreboards_scope
  ON public.mv_hc_market_scoreboards_current(scope_type, scope_id);

-- INTERNAL-ONLY: market intelligence. No public grant.
REVOKE ALL ON public.mv_hc_market_scoreboards_current FROM anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 7. mv_hc_programmatic_page_eligibility — page indexability evaluation
--    Includes 57-country guardrail via JOIN to global_countries
-- ═══════════════════════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_hc_programmatic_page_eligibility AS
SELECT
  ppr.page_registry_id,
  ppr.canonical_url,
  ppr.page_type,
  ppr.render_mode,
  ppr.unique_data_score,
  ppr.cross_surface_value_score,
  ppr.no_dead_end_score,
  -- Indexable only if scores pass thresholds AND country is target-enabled
  (ppr.unique_data_score >= 0.45
   AND ppr.no_dead_end_score >= 1.0
   AND ppr.cross_surface_value_score >= 0.40
   AND (ppr.country_code IS NULL OR gc.target_country_enabled = true)
  ) AS indexable
FROM public.hc_programmatic_page_registry ppr
LEFT JOIN public.global_countries gc ON gc.iso2 = ppr.country_code;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_pageelig_url
  ON public.mv_hc_programmatic_page_eligibility(canonical_url);
CREATE INDEX IF NOT EXISTS idx_mv_pageelig_indexable
  ON public.mv_hc_programmatic_page_eligibility(indexable) WHERE indexable = true;
CREATE INDEX IF NOT EXISTS idx_mv_pageelig_type
  ON public.mv_hc_programmatic_page_eligibility(page_type);

-- INTERNAL-ONLY: SEO strategy (defensibility scores, indexability decisions). No public grant.
REVOKE ALL ON public.mv_hc_programmatic_page_eligibility FROM anon, authenticated;

COMMIT;
