-- ============================================================================
-- Social Gravity Scoring Engine — Nightly Computation
-- Migration: 20260303000004
-- ============================================================================
-- Implements the scoring formula from Social Gravity Engine YAML v4.0:
--   recency:        0.22 × exp(-days_since_last_active/14)
--   verification:   0.18 × min(1, claim_verified_level/3)
--   evidence:       0.12 × min(1, evidence_events_30d/10)
--   responsiveness: 0.10 × clamp(1 - (response_time_median_hours/24), 0, 1)
--   demand:         0.10 × min(1, (lead_forms_7d + saves_7d)/15)
--   reputation:     0.18 × clamp((weighted_votes_30d - disputes_90d*2 - mod_actions_90d*3)/20, 0, 1)
--   coverage:       0.06 × min(1, (corridors_covered + ports_covered + zones_covered)/25)
--   cold_start:     0.04 × cold_start_boost
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- Signal Collection Tables (first-party event counters)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_entity_signals (
  entity_type        TEXT NOT NULL CHECK (entity_type IN (
    'operator','broker','corridor','port','zone'
  )),
  entity_id          TEXT NOT NULL,
  -- Engagement signals (rolling windows)
  profile_views_7d   INT NOT NULL DEFAULT 0,
  profile_saves_7d   INT NOT NULL DEFAULT 0,
  lead_clicks_7d     INT NOT NULL DEFAULT 0,
  lead_forms_7d      INT NOT NULL DEFAULT 0,
  message_threads_started_7d INT NOT NULL DEFAULT 0,
  availability_toggles_7d INT NOT NULL DEFAULT 0,
  -- Aggregated from hc_ tables
  evidence_events_30d INT NOT NULL DEFAULT 0,
  reputation_votes_weighted_30d NUMERIC(8,2) NOT NULL DEFAULT 0,
  dispute_events_90d INT NOT NULL DEFAULT 0,
  moderation_actions_90d INT NOT NULL DEFAULT 0,
  -- Coverage
  corridors_covered  INT NOT NULL DEFAULT 0,
  ports_covered      INT NOT NULL DEFAULT 0,
  zones_covered      INT NOT NULL DEFAULT 0,
  -- Timing
  last_active_at     TIMESTAMPTZ,
  response_time_median_seconds INT,
  -- Identity
  verified_level     SMALLINT NOT NULL DEFAULT 0,
  -- Cold start
  onboarding_completion NUMERIC(3,2) NOT NULL DEFAULT 0,
  -- Metadata
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_hc_signals_type
  ON public.hc_entity_signals(entity_type);

ALTER TABLE public.hc_entity_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY es_read ON public.hc_entity_signals FOR SELECT USING (true);
CREATE POLICY es_service ON public.hc_entity_signals FOR ALL
  USING (auth.role() = 'service_role');

GRANT SELECT ON public.hc_entity_signals TO anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- Social Gravity Scoring RPC
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.hc_compute_social_gravity(
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id   TEXT DEFAULT NULL
)
RETURNS INT  -- count of entities scored
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT := 0;
  r RECORD;
  v_recency      NUMERIC;
  v_verification NUMERIC;
  v_evidence     NUMERIC;
  v_responsiveness NUMERIC;
  v_demand       NUMERIC;
  v_reputation   NUMERIC;
  v_coverage     NUMERIC;
  v_cold_start   NUMERIC;
  v_total        NUMERIC;
  v_score        SMALLINT;
BEGIN
  FOR r IN
    SELECT *
    FROM public.hc_entity_signals
    WHERE (p_entity_type IS NULL OR entity_type = p_entity_type)
      AND (p_entity_id IS NULL OR entity_id = p_entity_id)
  LOOP
    -- Recency: 0.22 × exp(-days_since_last_active/14)
    v_recency := CASE
      WHEN r.last_active_at IS NULL THEN 0
      ELSE EXP(-1.0 * EXTRACT(EPOCH FROM (now() - r.last_active_at)) / 86400.0 / 14.0)
    END;

    -- Verification: 0.18 × min(1, verified_level/3)
    v_verification := LEAST(1.0, r.verified_level::numeric / 3.0);

    -- Evidence: 0.12 × min(1, evidence_events_30d/10)
    v_evidence := LEAST(1.0, r.evidence_events_30d::numeric / 10.0);

    -- Responsiveness: 0.10 × clamp(1 - (median_hours/24), 0, 1)
    v_responsiveness := CASE
      WHEN r.response_time_median_seconds IS NULL THEN 0.5  -- neutral if no data
      ELSE GREATEST(0, LEAST(1.0,
        1.0 - (r.response_time_median_seconds::numeric / 3600.0 / 24.0)
      ))
    END;

    -- Demand: 0.10 × min(1, (lead_forms_7d + saves_7d)/15)
    v_demand := LEAST(1.0, (r.lead_forms_7d + r.profile_saves_7d)::numeric / 15.0);

    -- Reputation: 0.18 × clamp((weighted_votes - disputes*2 - mod*3)/20, 0, 1)
    v_reputation := GREATEST(0, LEAST(1.0,
      (r.reputation_votes_weighted_30d - r.dispute_events_90d * 2.0 - r.moderation_actions_90d * 3.0) / 20.0
    ));

    -- Coverage: 0.06 × min(1, (corridors + ports + zones)/25)
    v_coverage := LEAST(1.0,
      (r.corridors_covered + r.ports_covered + r.zones_covered)::numeric / 25.0
    );

    -- Cold start: 0.04 × onboarding_completion
    v_cold_start := r.onboarding_completion;

    -- Total weighted score
    v_total :=
      0.22 * v_recency +
      0.18 * v_verification +
      0.12 * v_evidence +
      0.10 * v_responsiveness +
      0.10 * v_demand +
      0.18 * v_reputation +
      0.06 * v_coverage +
      0.04 * v_cold_start;

    v_score := ROUND(100 * v_total)::SMALLINT;
    v_score := GREATEST(0, LEAST(100, v_score));

    -- Upsert into scores table
    INSERT INTO public.hc_social_gravity_scores (
      entity_type, entity_id,
      recency_score, verification_score, evidence_score,
      responsiveness_score, demand_score, reputation_score,
      coverage_score, cold_start_score,
      social_gravity_score, computed_at
    ) VALUES (
      r.entity_type, r.entity_id,
      ROUND(v_recency, 4), ROUND(v_verification, 4), ROUND(v_evidence, 4),
      ROUND(v_responsiveness, 4), ROUND(v_demand, 4), ROUND(v_reputation, 4),
      ROUND(v_coverage, 4), ROUND(v_cold_start, 4),
      v_score, now()
    )
    ON CONFLICT (entity_type, entity_id) DO UPDATE SET
      recency_score = EXCLUDED.recency_score,
      verification_score = EXCLUDED.verification_score,
      evidence_score = EXCLUDED.evidence_score,
      responsiveness_score = EXCLUDED.responsiveness_score,
      demand_score = EXCLUDED.demand_score,
      reputation_score = EXCLUDED.reputation_score,
      coverage_score = EXCLUDED.coverage_score,
      cold_start_score = EXCLUDED.cold_start_score,
      social_gravity_score = EXCLUDED.social_gravity_score,
      computed_at = now();

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hc_compute_social_gravity TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- Signal Collection RPC (populates hc_entity_signals from source tables)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.hc_collect_entity_signals(
  p_entity_type TEXT DEFAULT 'operator'
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT := 0;
  r RECORD;
BEGIN
  -- Collect operator signals from hc_identities + related tables
  IF p_entity_type = 'operator' THEN
    FOR r IN
      SELECT
        hi.identity_id,
        hi.user_id::text AS entity_id,
        hi.verified_level,
        hi.last_active_at,
        COALESCE((
          SELECT COUNT(*)
          FROM public.operator_evidence oe
          WHERE oe.operator_user_id = hi.user_id
            AND oe.created_at >= now() - INTERVAL '30 days'
        ), 0) AS evidence_events_30d,
        COALESCE((
          SELECT SUM(re.weight)
          FROM public.hc_reputation_events re
          WHERE re.subject_type = 'operator'
            AND re.subject_id = hi.user_id::text
            AND re.event_type IN ('upvote','endorsement','thanks')
            AND re.status = 'active'
            AND re.created_at >= now() - INTERVAL '30 days'
        ), 0) AS reputation_votes_weighted_30d,
        COALESCE((
          SELECT COUNT(*)
          FROM public.hc_disputes d
          JOIN public.hc_reputation_events re ON re.rep_event_id = d.rep_event_id
          WHERE re.subject_type = 'operator'
            AND re.subject_id = hi.user_id::text
            AND d.created_at >= now() - INTERVAL '90 days'
        ), 0) AS dispute_events_90d,
        COALESCE((
          SELECT COUNT(DISTINCT lp.corridor_id)
          FROM public.operator_lane_presence lp
          WHERE lp.operator_user_id = hi.user_id
        ), 0) AS corridors_covered,
        COALESCE((
          SELECT ps.strength_score::numeric / 100.0
          FROM public.hc_profile_strength ps
          WHERE ps.user_id = hi.user_id
        ), 0) AS onboarding_completion
      FROM public.hc_identities hi
      WHERE hi.role = 'operator'
    LOOP
      INSERT INTO public.hc_entity_signals (
        entity_type, entity_id,
        verified_level, last_active_at,
        evidence_events_30d, reputation_votes_weighted_30d,
        dispute_events_90d, corridors_covered,
        onboarding_completion, updated_at
      ) VALUES (
        'operator', r.entity_id,
        r.verified_level, r.last_active_at,
        r.evidence_events_30d, r.reputation_votes_weighted_30d,
        r.dispute_events_90d, r.corridors_covered,
        r.onboarding_completion, now()
      )
      ON CONFLICT (entity_type, entity_id) DO UPDATE SET
        verified_level = EXCLUDED.verified_level,
        last_active_at = EXCLUDED.last_active_at,
        evidence_events_30d = EXCLUDED.evidence_events_30d,
        reputation_votes_weighted_30d = EXCLUDED.reputation_votes_weighted_30d,
        dispute_events_90d = EXCLUDED.dispute_events_90d,
        corridors_covered = EXCLUDED.corridors_covered,
        onboarding_completion = EXCLUDED.onboarding_completion,
        updated_at = now();

      v_count := v_count + 1;
    END LOOP;
  END IF;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hc_collect_entity_signals TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- Ranking View (for search results)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.v_hc_operator_ranked AS
SELECT
  sgs.entity_id AS user_id,
  sgs.social_gravity_score,
  sgs.recency_score,
  sgs.verification_score,
  sgs.evidence_score,
  sgs.responsiveness_score,
  sgs.demand_score,
  sgs.reputation_score,
  sgs.coverage_score,
  sgs.cold_start_score,
  sgs.computed_at,
  hi.verified_level,
  hi.trust_tier,
  hi.country_code,
  hi.last_active_at,
  CASE
    WHEN hi.last_active_at >= now() - INTERVAL '24 hours' THEN 'active_today'
    WHEN hi.last_active_at >= now() - INTERVAL '7 days' THEN 'active_this_week'
    WHEN hi.last_active_at >= now() - INTERVAL '30 days' THEN 'active_this_month'
    ELSE 'inactive'
  END AS activity_status,
  -- New verified operator boost: +5 if verified in last 14 days
  CASE
    WHEN hi.verified_level >= 2
      AND hi.created_at >= now() - INTERVAL '14 days'
    THEN LEAST(100, sgs.social_gravity_score + 5)
    ELSE sgs.social_gravity_score
  END AS boosted_score
FROM public.hc_social_gravity_scores sgs
JOIN public.hc_identities hi
  ON hi.user_id::text = sgs.entity_id
  AND hi.role = 'operator'
WHERE sgs.entity_type = 'operator'
ORDER BY boosted_score DESC;

GRANT SELECT ON public.v_hc_operator_ranked TO anon, authenticated;

COMMIT;
