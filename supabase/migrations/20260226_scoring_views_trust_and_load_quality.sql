-- ══════════════════════════════════════════════════════════════
-- TRUST SCORE & LOAD QUALITY SCORING VIEWS
-- Foundation layer for marketplace credibility signals.
-- Run via: Supabase Dashboard → SQL Editor → paste & run
-- ══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- 1. v_trust_scores — SINGLE VIEW FOR ALL ENTITY TYPES
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.v_trust_scores AS

-- ── ESCORT SCORES ──
WITH escort_review_stats AS (
    SELECT
        r.subject_id,
        count(*)::int AS review_count,
        coalesce(avg(r.rating_value), 0) AS avg_rating
    FROM public.reviews r
    WHERE r.subject_type = 'driver'
      AND r.status = 'approved'
    GROUP BY r.subject_id
),
escort_match_stats AS (
    SELECT
        m.escort_id,
        count(*) FILTER (WHERE m.status = 'completed')::int AS completed_jobs,
        count(*) FILTER (WHERE m.status = 'canceled')::int  AS canceled_jobs,
        count(*)::int AS total_jobs
    FROM public.matches m
    GROUP BY m.escort_id
),
escort_incident_stats AS (
    SELECT
        i.subject_user_id,
        count(*)::int AS incident_count
    FROM public.incidents i
    GROUP BY i.subject_user_id
),
escort_scores AS (
    SELECT
        ep.escort_id AS entity_id,
        'escort'::text AS entity_type,
        coalesce(om.on_time_rate, 80)  AS on_time_rate,
        coalesce(om.completion_rate, 80) AS acceptance_rate,
        CASE
            WHEN coalesce(ems.total_jobs, 0) = 0 THEN 80
            ELSE greatest(0, 100 - (coalesce(eis.incident_count, 0)::numeric / greatest(ems.total_jobs, 1) * 100))
        END AS safety_score,
        CASE
            WHEN coalesce(ers.review_count, 0) < 1 THEN 70
            ELSE least(100, ers.avg_rating * 20)
        END AS feedback_score,
        CASE
            WHEN coalesce(ems.total_jobs, 0) = 0 THEN 70
            ELSE least(100, (coalesce(ems.completed_jobs, 0)::numeric / greatest(ems.total_jobs, 1) * 100))
        END AS corridor_reliability,
        least(100, coalesce(ems.completed_jobs, 0))::numeric AS activity_score,
        coalesce(ems.total_jobs, 0) + coalesce(ers.review_count, 0) AS total_events
    FROM public.escort_profiles ep
    LEFT JOIN public.operator_metrics  om  ON om.operator_id = ep.escort_id
    LEFT JOIN escort_match_stats       ems ON ems.escort_id  = ep.escort_id
    LEFT JOIN escort_review_stats      ers ON ers.subject_id = ep.escort_id
    LEFT JOIN escort_incident_stats    eis ON eis.subject_user_id = ep.escort_id
),
escort_final AS (
    SELECT
        entity_id,
        entity_type,
        CASE
            WHEN total_events < 5 THEN NULL  -- anti-gaming: min 5 events
            ELSE least(100, greatest(0, round(
                on_time_rate         * 0.25 +
                acceptance_rate      * 0.15 +
                safety_score         * 0.20 +
                feedback_score       * 0.20 +
                corridor_reliability * 0.10 +
                activity_score       * 0.10
            )))
        END AS trust_score,
        total_events
    FROM escort_scores
),

-- ── BROKER SCORES ──
broker_review_stats AS (
    SELECT
        r.subject_id,
        count(*)::int AS review_count,
        coalesce(avg(r.rating_value), 0) AS avg_rating
    FROM public.reviews r
    WHERE r.subject_type = 'broker'
      AND r.status = 'approved'
    GROUP BY r.subject_id
),
broker_load_stats AS (
    SELECT
        l.broker_id,
        count(*)::int AS total_loads,
        count(*) FILTER (WHERE l.status = 'filled')::int AS filled_loads,
        count(*) FILTER (WHERE l.status = 'cancelled')::int AS cancelled_loads
    FROM public.loads l
    GROUP BY l.broker_id
),
broker_scores AS (
    SELECT
        bp.broker_id AS entity_id,
        'broker'::text AS entity_type,
        CASE
            WHEN brp.payment_speed_days IS NULL THEN 60
            WHEN brp.payment_speed_days <= 7  THEN 95
            WHEN brp.payment_speed_days <= 14 THEN 85
            WHEN brp.payment_speed_days <= 30 THEN 70
            WHEN brp.payment_speed_days <= 45 THEN 50
            ELSE 30
        END AS payment_speed_score,
        coalesce(bp.reputation_score, 50)::numeric AS rate_score,
        CASE
            WHEN coalesce(bls.total_loads, 0) = 0 THEN 70
            ELSE greatest(0, 100 - (coalesce(bls.cancelled_loads, 0)::numeric / greatest(bls.total_loads, 1) * 100))
        END AS cancellation_score,
        CASE
            WHEN coalesce(brs.review_count, 0) < 1 THEN 60
            ELSE least(100, brs.avg_rating * 20)
        END AS feedback_score,
        CASE
            WHEN brp.dispute_frequency IS NULL THEN 70
            ELSE greatest(0, 100 - (brp.dispute_frequency * 10))
        END AS dispute_score,
        CASE
            WHEN coalesce(bls.total_loads, 0) = 0 THEN 60
            ELSE least(100, (coalesce(bls.filled_loads, 0)::numeric / greatest(bls.total_loads, 1) * 100))
        END AS fill_score,
        coalesce(bls.total_loads, 0) + coalesce(brs.review_count, 0) AS total_events
    FROM public.broker_profiles bp
    LEFT JOIN public.broker_risk_profiles brp ON brp.broker_id = bp.broker_id
    LEFT JOIN broker_load_stats           bls ON bls.broker_id = bp.broker_id
    LEFT JOIN broker_review_stats         brs ON brs.subject_id = bp.broker_id
),
broker_final AS (
    SELECT
        entity_id,
        entity_type,
        CASE
            WHEN total_events < 5 THEN NULL
            ELSE least(100, greatest(0, round(
                payment_speed_score * 0.25 +
                rate_score          * 0.20 +
                cancellation_score  * 0.15 +
                feedback_score      * 0.20 +
                dispute_score       * 0.10 +
                fill_score          * 0.10
            )))
        END AS trust_score,
        total_events
    FROM broker_scores
)

-- ── UNION ──
SELECT
    entity_id,
    entity_type,
    trust_score::int AS trust_score,
    CASE
        WHEN trust_score IS NULL THEN 'unrated'
        WHEN trust_score >= 90  THEN 'elite'
        WHEN trust_score >= 75  THEN 'strong'
        WHEN trust_score >= 60  THEN 'watch'
        ELSE 'risk'
    END AS tier,
    total_events
FROM escort_final

UNION ALL

SELECT
    entity_id,
    entity_type,
    trust_score::int AS trust_score,
    CASE
        WHEN trust_score IS NULL THEN 'unrated'
        WHEN trust_score >= 90  THEN 'elite'
        WHEN trust_score >= 75  THEN 'strong'
        WHEN trust_score >= 60  THEN 'watch'
        ELSE 'risk'
    END AS tier,
    total_events
FROM broker_final;


-- ──────────────────────────────────────────────────────────────
-- 2. v_load_quality_scores — RATE PRESSURE ENGINE
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.v_load_quality_scores AS

WITH corridor_stats AS (
    SELECT
        unnest(l.route_corridors) AS corridor_key,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY l.rate_offer) AS median_rate,
        count(*)::int AS sample_size
    FROM public.loads l
    WHERE l.status IN ('filled', 'expired')
      AND l.rate_offer IS NOT NULL
      AND l.rate_offer > 0
    GROUP BY unnest(l.route_corridors)
    HAVING count(*) >= 3
),
load_corridor AS (
    SELECT DISTINCT ON (l.id)
        l.id AS load_id,
        l.rate_offer,
        l.broker_id,
        l.status,
        c.corridor_key,
        c.median_rate,
        c.sample_size
    FROM public.loads l
    LEFT JOIN LATERAL (
        SELECT cs.corridor_key, cs.median_rate, cs.sample_size
        FROM corridor_stats cs
        WHERE cs.corridor_key = ANY(l.route_corridors)
        ORDER BY cs.sample_size DESC
        LIMIT 1
    ) c ON true
    WHERE l.status IN ('open', 'active', 'filled')
      AND l.rate_offer IS NOT NULL
),
broker_trust AS (
    SELECT entity_id, trust_score
    FROM public.v_trust_scores
    WHERE entity_type = 'broker'
),
scored AS (
    SELECT
        lc.load_id,
        lc.rate_offer,
        lc.corridor_key,
        lc.median_rate,
        lc.status,
        CASE
            WHEN lc.median_rate IS NULL OR lc.median_rate <= 0 THEN 50
            ELSE least(100, greatest(0,
                (lc.rate_offer / lc.median_rate) * 50
            ))
        END AS rate_component,
        coalesce(bt.trust_score, 50) AS broker_trust_component,
        CASE
            WHEN lc.sample_size IS NULL THEN 40
            WHEN lc.sample_size >= 20  THEN 90
            WHEN lc.sample_size >= 10  THEN 75
            WHEN lc.sample_size >= 5   THEN 60
            ELSE 45
        END AS data_quality_component
    FROM load_corridor lc
    LEFT JOIN broker_trust bt ON bt.entity_id = lc.broker_id
)
SELECT
    load_id,
    rate_offer,
    corridor_key,
    median_rate,
    least(100, greatest(0, round(
        rate_component          * 0.60 +
        broker_trust_component  * 0.25 +
        data_quality_component  * 0.15
    )))::int AS load_quality_score,
    CASE
        WHEN least(100, greatest(0, round(
            rate_component * 0.60 + broker_trust_component * 0.25 + data_quality_component * 0.15
        ))) >= 85 THEN 'excellent'
        WHEN least(100, greatest(0, round(
            rate_component * 0.60 + broker_trust_component * 0.25 + data_quality_component * 0.15
        ))) >= 70 THEN 'good'
        WHEN least(100, greatest(0, round(
            rate_component * 0.60 + broker_trust_component * 0.25 + data_quality_component * 0.15
        ))) >= 55 THEN 'fair'
        WHEN least(100, greatest(0, round(
            rate_component * 0.60 + broker_trust_component * 0.25 + data_quality_component * 0.15
        ))) >= 40 THEN 'weak'
        ELSE 'poor'
    END AS level,
    CASE
        WHEN median_rate IS NOT NULL AND median_rate > 0 AND rate_offer IS NOT NULL THEN
            round((rate_offer / median_rate * 100)::numeric, 0)::int
        ELSE NULL
    END AS rate_percentile_of_median
FROM scored;


-- ──────────────────────────────────────────────────────────────
-- 3. GRANT public SELECT on both views
-- ──────────────────────────────────────────────────────────────
GRANT SELECT ON public.v_trust_scores TO anon, authenticated;
GRANT SELECT ON public.v_load_quality_scores TO anon, authenticated;
