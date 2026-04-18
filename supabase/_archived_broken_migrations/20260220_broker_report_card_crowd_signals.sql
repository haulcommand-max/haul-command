-- Broker Report Card View + Community Signals Tables
-- Migration: 20260220_broker_report_card_crowd_signals.sql

-- 1. Broker Report Card View
CREATE OR REPLACE VIEW public.v_broker_report_card AS
SELECT
    bp.user_id,
    bp.company_name,
    bp.contact_name,
    -- Payment behavior (45% weight)
    COALESCE(bp.on_time_payment_rate, 0) AS on_time_payment_rate,
    COALESCE(bp.avg_days_to_pay, 30) AS avg_days_to_pay,
    -- Fill performance (30% weight)
    COALESCE(bp.load_fill_rate, 0) AS load_fill_rate,
    COALESCE(bp.repeat_driver_rate, 0) AS repeat_driver_rate,
    COALESCE(bp.total_loads_posted, 0) AS total_loads_posted,
    -- Composite trust score
    LEAST(100, GREATEST(0, (
        -- Payment behavior (45%)
        (COALESCE(bp.on_time_payment_rate, 0) * 0.30 +
         GREATEST(0, (1.0 - COALESCE(bp.avg_days_to_pay, 30)::numeric / 60.0)) * 100 * 0.15) +
        -- Fill performance (30%)
        (COALESCE(bp.load_fill_rate, 0) * 0.20 +
         COALESCE(bp.repeat_driver_rate, 0) * 0.10) +
        -- Base reputation (25%)
        (CASE WHEN COALESCE(bp.total_loads_posted, 0) >= 20 THEN 15
              WHEN COALESCE(bp.total_loads_posted, 0) >= 5 THEN 10
              ELSE COALESCE(bp.total_loads_posted, 0)::numeric / 5 * 10 END +
         CASE WHEN bp.verified THEN 10 ELSE 0 END)
    )))::int AS broker_trust_score,
    -- Tier
    CASE
        WHEN LEAST(100, GREATEST(0, (
            COALESCE(bp.on_time_payment_rate, 0) * 0.30 +
            GREATEST(0, (1.0 - COALESCE(bp.avg_days_to_pay, 30)::numeric / 60.0)) * 100 * 0.15 +
            COALESCE(bp.load_fill_rate, 0) * 0.20 +
            COALESCE(bp.repeat_driver_rate, 0) * 0.10 +
            CASE WHEN COALESCE(bp.total_loads_posted, 0) >= 20 THEN 15
                 WHEN COALESCE(bp.total_loads_posted, 0) >= 5 THEN 10
                 ELSE COALESCE(bp.total_loads_posted, 0)::numeric / 5 * 10 END +
            CASE WHEN bp.verified THEN 10 ELSE 0 END
        ))) >= 85 THEN 'Preferred'
        WHEN LEAST(100, GREATEST(0, (
            COALESCE(bp.on_time_payment_rate, 0) * 0.30 +
            GREATEST(0, (1.0 - COALESCE(bp.avg_days_to_pay, 30)::numeric / 60.0)) * 100 * 0.15 +
            COALESCE(bp.load_fill_rate, 0) * 0.20 +
            COALESCE(bp.repeat_driver_rate, 0) * 0.10 +
            CASE WHEN COALESCE(bp.total_loads_posted, 0) >= 20 THEN 15
                 WHEN COALESCE(bp.total_loads_posted, 0) >= 5 THEN 10
                 ELSE COALESCE(bp.total_loads_posted, 0)::numeric / 5 * 10 END +
            CASE WHEN bp.verified THEN 10 ELSE 0 END
        ))) >= 60 THEN 'Standard'
        ELSE 'New'
    END AS broker_tier,
    -- Flags
    ARRAY_REMOVE(ARRAY[
        CASE WHEN COALESCE(bp.avg_days_to_pay, 30) > 45 THEN 'Slow Pay Alert' END,
        CASE WHEN COALESCE(bp.on_time_payment_rate, 0) < 70 THEN 'Payment Risk' END,
        CASE WHEN COALESCE(bp.load_fill_rate, 0) < 30 THEN 'Low Fill Rate' END,
        CASE WHEN NOT COALESCE(bp.verified, false) THEN 'Unverified' END
    ], NULL) AS risk_flags,
    NOW() AS computed_at
FROM public.broker_profiles bp;

GRANT SELECT ON public.v_broker_report_card TO anon, authenticated;

-- 2. Community Votes Table (for crowd-powered report cards)
CREATE TABLE IF NOT EXISTS public.community_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id UUID NOT NULL,
    voter_user_id UUID NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN (
        'professional_conduct', 'helpful_in_field', 'communication_quality',
        'safety_concern', 'no_show', 'late_arrival', 'unsafe_behavior',
        'fair_rates', 'professionalism', 'payment_issue', 'rate_bait'
    )),
    sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (target_user_id, voter_user_id, vote_type)
);

CREATE INDEX IF NOT EXISTS idx_community_votes_target ON public.community_votes(target_user_id);
CREATE INDEX IF NOT EXISTS idx_community_votes_voter ON public.community_votes(voter_user_id);
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can vote" ON public.community_votes
    FOR INSERT WITH CHECK (voter_user_id = auth.uid());

CREATE POLICY "Anyone can read votes" ON public.community_votes
    FOR SELECT USING (true);

CREATE POLICY "Service role manages votes" ON public.community_votes
    FOR ALL USING (auth.role() = 'service_role');
