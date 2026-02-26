-- ============================================================
-- Trust & Crowd Intelligence Layer — Core Tables + Views
-- Migration: 20260222_trust_crowd_intelligence.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────
-- 1. escort_reviews
--    5-axis operational reviews submitted by brokers after a job.
--    Replaces/extends the old 3-axis community_votes pattern.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.escort_reviews (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escort_id             UUID NOT NULL,
    broker_id             UUID NOT NULL,
    load_id               UUID,
    on_time_rating        SMALLINT NOT NULL CHECK (on_time_rating BETWEEN 1 AND 5),
    communication_rating  SMALLINT NOT NULL CHECK (communication_rating BETWEEN 1 AND 5),
    professionalism_rating SMALLINT NOT NULL CHECK (professionalism_rating BETWEEN 1 AND 5),
    equipment_ready_rating SMALLINT NOT NULL CHECK (equipment_ready_rating BETWEEN 1 AND 5),
    route_awareness_rating SMALLINT NOT NULL CHECK (route_awareness_rating BETWEEN 1 AND 5),
    would_use_again       BOOLEAN NOT NULL DEFAULT true,
    review_text           TEXT CHECK (char_length(review_text) <= 500),
    verified_job          BOOLEAN NOT NULL DEFAULT false,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Anti-gaming: one review per job pair
    UNIQUE (escort_id, broker_id, COALESCE(load_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

CREATE INDEX IF NOT EXISTS idx_escort_reviews_escort  ON public.escort_reviews(escort_id);
CREATE INDEX IF NOT EXISTS idx_escort_reviews_broker  ON public.escort_reviews(broker_id);
CREATE INDEX IF NOT EXISTS idx_escort_reviews_load    ON public.escort_reviews(load_id);
CREATE INDEX IF NOT EXISTS idx_escort_reviews_created ON public.escort_reviews(created_at DESC);

ALTER TABLE public.escort_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers can insert escort reviews"
    ON public.escort_reviews FOR INSERT
    WITH CHECK (broker_id = auth.uid());

CREATE POLICY "Anyone can read escort reviews"
    ON public.escort_reviews FOR SELECT
    USING (true);

CREATE POLICY "Service role manages escort reviews"
    ON public.escort_reviews FOR ALL
    USING (auth.role() = 'service_role');

GRANT SELECT ON public.escort_reviews TO anon, authenticated;
GRANT INSERT ON public.escort_reviews TO authenticated;


-- ─────────────────────────────────────────────────────────
-- 2. broker_reviews
--    5-axis reviews submitted by escorts rating brokers.
--    High-leverage: NO competitor platform does this.
--    "Paid on Time" is the hero axis (0.45 weight).
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.broker_reviews (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id                UUID NOT NULL,
    escort_id                UUID NOT NULL,
    load_id                  UUID,
    paid_on_time_rating      SMALLINT NOT NULL CHECK (paid_on_time_rating BETWEEN 1 AND 5),
    rate_accuracy_rating     SMALLINT NOT NULL CHECK (rate_accuracy_rating BETWEEN 1 AND 5),
    communication_rating     SMALLINT NOT NULL CHECK (communication_rating BETWEEN 1 AND 5),
    load_clarity_rating      SMALLINT NOT NULL CHECK (load_clarity_rating BETWEEN 1 AND 5),
    detention_fairness_rating SMALLINT NOT NULL CHECK (detention_fairness_rating BETWEEN 1 AND 5),
    would_work_again         BOOLEAN NOT NULL DEFAULT true,
    review_text              TEXT CHECK (char_length(review_text) <= 500),
    verified_job             BOOLEAN NOT NULL DEFAULT false,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Anti-gaming: one review per job pair
    UNIQUE (broker_id, escort_id, COALESCE(load_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

CREATE INDEX IF NOT EXISTS idx_broker_reviews_broker  ON public.broker_reviews(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_reviews_escort  ON public.broker_reviews(escort_id);
CREATE INDEX IF NOT EXISTS idx_broker_reviews_load    ON public.broker_reviews(load_id);
CREATE INDEX IF NOT EXISTS idx_broker_reviews_created ON public.broker_reviews(created_at DESC);

ALTER TABLE public.broker_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escorts can insert broker reviews"
    ON public.broker_reviews FOR INSERT
    WITH CHECK (escort_id = auth.uid());

CREATE POLICY "Anyone can read broker reviews"
    ON public.broker_reviews FOR SELECT
    USING (true);

CREATE POLICY "Service role manages broker reviews"
    ON public.broker_reviews FOR ALL
    USING (auth.role() = 'service_role');

GRANT SELECT ON public.broker_reviews TO anon, authenticated;
GRANT INSERT ON public.broker_reviews TO authenticated;


-- ─────────────────────────────────────────────────────────
-- 3. broker_pay_events
--    Tracks invoice → payment timelines for broker pay score.
--    Populated by the payment rail (Haul-Pay integration).
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.broker_pay_events (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id             UUID NOT NULL,
    load_id               UUID NOT NULL,
    invoice_submitted_at  TIMESTAMPTZ NOT NULL,
    paid_at               TIMESTAMPTZ,
    -- days_to_pay computed server-side (avoid generated column FK issues)
    days_to_pay           INT,
    on_time_flag          BOOLEAN,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broker_pay_events_broker ON public.broker_pay_events(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_pay_events_load   ON public.broker_pay_events(load_id);

ALTER TABLE public.broker_pay_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages pay events"
    ON public.broker_pay_events FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can read pay events"
    ON public.broker_pay_events FOR SELECT
    USING (true);

GRANT SELECT ON public.broker_pay_events TO anon, authenticated;


-- ─────────────────────────────────────────────────────────
-- 4. crowd_signals
--    Waze-style field alerts with auto-expiry by severity.
--    Critical = 20min, High = 30min, Medium = 45min, Low = 60min.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crowd_signals (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID NOT NULL,
    corridor_id      TEXT NOT NULL,
    signal_type      TEXT NOT NULL CHECK (signal_type IN (
        'corridor_heating',
        'police_required',
        'height_issue',
        'permit_tight',
        'route_delay',
        'coverage_tightening',
        'bridge_clearance_watch'
    )),
    severity         TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    latitude         NUMERIC(10, 6),
    longitude        NUMERIC(10, 6),
    expires_at       TIMESTAMPTZ NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crowd_signals_corridor ON public.crowd_signals(corridor_id);
CREATE INDEX IF NOT EXISTS idx_crowd_signals_expires  ON public.crowd_signals(expires_at);
CREATE INDEX IF NOT EXISTS idx_crowd_signals_type     ON public.crowd_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_crowd_signals_severity ON public.crowd_signals(severity);

ALTER TABLE public.crowd_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can report signals"
    ON public.crowd_signals FOR INSERT
    WITH CHECK (reporter_user_id = auth.uid());

CREATE POLICY "Anyone can read active signals"
    ON public.crowd_signals FOR SELECT
    USING (expires_at > now());

CREATE POLICY "Service role manages signals"
    ON public.crowd_signals FOR ALL
    USING (auth.role() = 'service_role');

GRANT SELECT ON public.crowd_signals TO anon, authenticated;
GRANT INSERT ON public.crowd_signals TO authenticated;


-- ─────────────────────────────────────────────────────────
-- 5. v_escort_review_scores
--    Weighted aggregate for trust score from escort reviews.
--    Weights match YAML: on_time 0.30, comm 0.20, prof 0.15,
--    equip 0.10, route 0.10. Remaining 0.15 = would_use_again.
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_escort_review_scores AS
SELECT
    escort_id,
    COUNT(*)                                     AS review_count,
    COUNT(*) FILTER (WHERE verified_job)          AS verified_count,
    ROUND(AVG(on_time_rating)::numeric, 2)        AS avg_on_time,
    ROUND(AVG(communication_rating)::numeric, 2)  AS avg_communication,
    ROUND(AVG(professionalism_rating)::numeric, 2) AS avg_professionalism,
    ROUND(AVG(equipment_ready_rating)::numeric, 2) AS avg_equipment,
    ROUND(AVG(route_awareness_rating)::numeric, 2) AS avg_route_awareness,
    -- Weighted composite → scaled to 0–100
    ROUND((
        AVG(on_time_rating)        * 0.30 +
        AVG(communication_rating)  * 0.20 +
        AVG(professionalism_rating)* 0.15 +
        AVG(equipment_ready_rating)* 0.10 +
        AVG(route_awareness_rating)* 0.10
    ) / 5.0 * 100, 1)                             AS review_trust_score,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE would_use_again)
        / NULLIF(COUNT(*), 0)::numeric, 1
    )                                              AS would_use_again_pct,
    -- Confidence (reviews count → gradually approaches 1.0 after 5 reviews, full weight at 10+)
    LEAST(1.0, COUNT(*)::numeric / 10.0)           AS review_confidence
FROM public.escort_reviews
GROUP BY escort_id;

GRANT SELECT ON public.v_escort_review_scores TO anon, authenticated;


-- ─────────────────────────────────────────────────────────
-- 6. v_broker_review_scores
--    Weighted aggregate for broker pay score from escort reviews.
--    Weights: paid_on_time 0.45, rate_accuracy 0.20,
--    communication 0.15, load_clarity 0.10, detention 0.10.
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_broker_review_scores AS
SELECT
    broker_id,
    COUNT(*)                                            AS review_count,
    COUNT(*) FILTER (WHERE verified_job)                 AS verified_count,
    ROUND(AVG(paid_on_time_rating)::numeric, 2)          AS avg_paid_on_time,
    ROUND(AVG(rate_accuracy_rating)::numeric, 2)         AS avg_rate_accuracy,
    ROUND(AVG(communication_rating)::numeric, 2)         AS avg_communication,
    ROUND(AVG(load_clarity_rating)::numeric, 2)          AS avg_load_clarity,
    ROUND(AVG(detention_fairness_rating)::numeric, 2)    AS avg_detention_fairness,
    -- Weighted broker pay score → scaled to 0–100
    ROUND((
        AVG(paid_on_time_rating)      * 0.45 +
        AVG(rate_accuracy_rating)     * 0.20 +
        AVG(communication_rating)     * 0.15 +
        AVG(load_clarity_rating)      * 0.10 +
        AVG(detention_fairness_rating)* 0.10
    ) / 5.0 * 100, 1)                                   AS broker_pay_score,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE would_work_again)
        / NULLIF(COUNT(*), 0)::numeric, 1
    )                                                    AS would_work_again_pct,
    -- Slow pay flag: avg days across pay events
    (
        SELECT ROUND(AVG(bpe.days_to_pay)::numeric, 1)
        FROM public.broker_pay_events bpe
        WHERE bpe.broker_id = br.broker_id
          AND bpe.days_to_pay IS NOT NULL
    )                                                    AS avg_days_to_pay,
    -- Risk flags
    CASE WHEN (
        SELECT AVG(bpe.days_to_pay)
        FROM public.broker_pay_events bpe
        WHERE bpe.broker_id = br.broker_id
          AND bpe.days_to_pay IS NOT NULL
    ) > 21 THEN true ELSE false END                      AS slow_pay_warning,
    LEAST(1.0, COUNT(*)::numeric / 10.0)                 AS review_confidence
FROM public.broker_reviews br
GROUP BY broker_id;

GRANT SELECT ON public.v_broker_review_scores TO anon, authenticated;


-- ─────────────────────────────────────────────────────────
-- 7. Helper RPC: submit_crowd_signal
--    Computes expires_at server-side from severity so frontend
--    never needs to calculate it.
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_crowd_signal(
    p_corridor_id  TEXT,
    p_signal_type  TEXT,
    p_severity     TEXT,
    p_latitude     NUMERIC DEFAULT NULL,
    p_longitude    NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expires_at TIMESTAMPTZ;
    v_id UUID;
BEGIN
    -- Expiry rules from YAML
    v_expires_at := now() + CASE p_severity
        WHEN 'critical' THEN INTERVAL '20 minutes'
        WHEN 'high'     THEN INTERVAL '30 minutes'
        WHEN 'medium'   THEN INTERVAL '45 minutes'
        ELSE                 INTERVAL '60 minutes'
    END;

    INSERT INTO public.crowd_signals (
        reporter_user_id, corridor_id, signal_type,
        severity, latitude, longitude, expires_at
    ) VALUES (
        auth.uid(), p_corridor_id, p_signal_type,
        p_severity, p_latitude, p_longitude, v_expires_at
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_crowd_signal TO authenticated;
