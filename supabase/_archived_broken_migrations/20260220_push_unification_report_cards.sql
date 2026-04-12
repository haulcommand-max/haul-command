-- ============================================================
-- Push Endpoints Unification + Report Cards V1 + Corridor Incidents
-- Migration: 20260220_push_unification_report_cards.sql
-- ============================================================

-- 1. Unified Push Endpoints Table
CREATE TABLE IF NOT EXISTS public.push_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('webpush', 'fcm')),
    endpoint TEXT NOT NULL,
    p256dh TEXT,
    auth TEXT,
    fcm_token TEXT,
    device_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, provider_type, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_endpoints_user ON public.push_endpoints(user_id);
ALTER TABLE public.push_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own endpoints" ON public.push_endpoints
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users insert own endpoints" ON public.push_endpoints
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own endpoints" ON public.push_endpoints
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Service role full push" ON public.push_endpoints
    FOR ALL USING (auth.role() = 'service_role');

-- 2. Corridor Report Card View
CREATE OR REPLACE VIEW public.v_corridor_report_card AS
WITH corridor_stats AS (
    SELECT
        l.corridor_slug,
        COUNT(DISTINCT j.id) FILTER (WHERE j.created_at > NOW() - INTERVAL '7 days') AS fills_7d,
        COUNT(DISTINCT l.id) FILTER (WHERE l.created_at > NOW() - INTERVAL '7 days') AS loads_7d,
        AVG(EXTRACT(EPOCH FROM (j.created_at - l.created_at)) / 60)
            FILTER (WHERE j.created_at > NOW() - INTERVAL '7 days') AS avg_fill_minutes_7d,
        AVG(l.rate_total)
            FILTER (WHERE l.created_at > NOW() - INTERVAL '7 days') AS avg_rate_7d
    FROM public.loads l
    LEFT JOIN public.jobs j ON j.load_id = l.id
    WHERE l.corridor_slug IS NOT NULL
    GROUP BY l.corridor_slug
),
supply AS (
    SELECT
        dp.primary_corridor AS corridor_slug,
        COUNT(*) FILTER (WHERE ep.status = 'online') AS online_drivers,
        COUNT(*) AS total_drivers
    FROM public.driver_profiles dp
    LEFT JOIN public.escort_presence ep ON ep.escort_id = dp.user_id
    WHERE dp.primary_corridor IS NOT NULL
    GROUP BY dp.primary_corridor
)
SELECT
    cs.corridor_slug,
    COALESCE(cs.loads_7d, 0) AS loads_7d,
    COALESCE(cs.fills_7d, 0) AS fills_7d,
    CASE WHEN COALESCE(cs.loads_7d, 0) > 0
         THEN ROUND((COALESCE(cs.fills_7d, 0)::numeric / cs.loads_7d) * 100, 1)
         ELSE 0 END AS fill_rate_pct,
    ROUND(COALESCE(cs.avg_fill_minutes_7d, 0)::numeric, 0) AS avg_fill_minutes,
    ROUND(COALESCE(cs.avg_rate_7d, 0)::numeric, 0) AS avg_rate_est,
    COALESCE(s.online_drivers, 0) AS supply_online,
    COALESCE(s.total_drivers, 0) AS supply_total,
    -- Score (0-100)
    LEAST(100, GREATEST(0, (
        (CASE WHEN COALESCE(cs.loads_7d, 0) > 0
              THEN LEAST(100, (COALESCE(cs.fills_7d, 0)::numeric / cs.loads_7d) * 100)
              ELSE 0 END) * 0.35 +
        (CASE WHEN COALESCE(cs.avg_fill_minutes_7d, 999) < 60 THEN 30
              WHEN COALESCE(cs.avg_fill_minutes_7d, 999) < 120 THEN 15 ELSE 0 END) +
        (LEAST(25, COALESCE(s.online_drivers, 0)::numeric / NULLIF(GREATEST(s.total_drivers, 1), 0) * 25)) +
        (CASE WHEN COALESCE(cs.loads_7d, 0) >= 5 THEN 10 ELSE COALESCE(cs.loads_7d, 0)::numeric / 5 * 10 END)
    )))::int AS corridor_score,
    -- Letter grade
    CASE
        WHEN LEAST(100, GREATEST(0, (
            (CASE WHEN COALESCE(cs.loads_7d, 0) > 0
                  THEN LEAST(100, (COALESCE(cs.fills_7d, 0)::numeric / cs.loads_7d) * 100)
                  ELSE 0 END) * 0.35 +
            (CASE WHEN COALESCE(cs.avg_fill_minutes_7d, 999) < 60 THEN 30
                  WHEN COALESCE(cs.avg_fill_minutes_7d, 999) < 120 THEN 15 ELSE 0 END) +
            (LEAST(25, COALESCE(s.online_drivers, 0)::numeric / NULLIF(GREATEST(s.total_drivers, 1), 0) * 25)) +
            (CASE WHEN COALESCE(cs.loads_7d, 0) >= 5 THEN 10 ELSE COALESCE(cs.loads_7d, 0)::numeric / 5 * 10 END)
        ))) >= 85 THEN 'A'
        WHEN LEAST(100, GREATEST(0, (
            (CASE WHEN COALESCE(cs.loads_7d, 0) > 0
                  THEN LEAST(100, (COALESCE(cs.fills_7d, 0)::numeric / cs.loads_7d) * 100)
                  ELSE 0 END) * 0.35 +
            (CASE WHEN COALESCE(cs.avg_fill_minutes_7d, 999) < 60 THEN 30
                  WHEN COALESCE(cs.avg_fill_minutes_7d, 999) < 120 THEN 15 ELSE 0 END) +
            (LEAST(25, COALESCE(s.online_drivers, 0)::numeric / NULLIF(GREATEST(s.total_drivers, 1), 0) * 25)) +
            (CASE WHEN COALESCE(cs.loads_7d, 0) >= 5 THEN 10 ELSE COALESCE(cs.loads_7d, 0)::numeric / 5 * 10 END)
        ))) >= 70 THEN 'B'
        WHEN LEAST(100, GREATEST(0, (
            (CASE WHEN COALESCE(cs.loads_7d, 0) > 0
                  THEN LEAST(100, (COALESCE(cs.fills_7d, 0)::numeric / cs.loads_7d) * 100)
                  ELSE 0 END) * 0.35 +
            (CASE WHEN COALESCE(cs.avg_fill_minutes_7d, 999) < 60 THEN 30
                  WHEN COALESCE(cs.avg_fill_minutes_7d, 999) < 120 THEN 15 ELSE 0 END) +
            (LEAST(25, COALESCE(s.online_drivers, 0)::numeric / NULLIF(GREATEST(s.total_drivers, 1), 0) * 25)) +
            (CASE WHEN COALESCE(cs.loads_7d, 0) >= 5 THEN 10 ELSE COALESCE(cs.loads_7d, 0)::numeric / 5 * 10 END)
        ))) >= 50 THEN 'C'
        ELSE 'D'
    END AS letter_grade,
    NOW() AS computed_at
FROM corridor_stats cs
LEFT JOIN supply s ON s.corridor_slug = cs.corridor_slug;

-- 3. Driver Report Card View
CREATE OR REPLACE VIEW public.v_driver_report_card AS
SELECT
    dp.user_id,
    dp.display_name,
    dp.home_state,
    dp.primary_corridor,
    COALESCE(dp.trust_score, 0) AS trust_score,
    -- Response time (from presence data)
    COALESCE(dp.avg_response_minutes, 0) AS response_time_minutes,
    -- Completion rate
    COALESCE(dp.total_jobs, 0) AS jobs_completed,
    COALESCE(dp.acceptance_rate, 0) AS acceptance_rate,
    -- Verification density
    (CASE WHEN dp.is_verified THEN 25 ELSE 0 END +
     CASE WHEN dp.insurance_verified THEN 25 ELSE 0 END +
     CASE WHEN dp.twic_flag THEN 15 ELSE 0 END +
     CASE WHEN dp.photo_url IS NOT NULL THEN 15 ELSE 0 END +
     CASE WHEN COALESCE(dp.total_jobs, 0) > 0 THEN 20 ELSE 0 END
    ) AS verification_density,
    -- Rank tier
    CASE
        WHEN COALESCE(dp.trust_score, 0) >= 95 THEN 'Elite'
        WHEN COALESCE(dp.trust_score, 0) >= 80 THEN 'Pro'
        WHEN COALESCE(dp.trust_score, 0) >= 60 THEN 'Verified'
        ELSE 'Starter'
    END AS rank_tier,
    -- Improvement tips
    ARRAY_REMOVE(ARRAY[
        CASE WHEN NOT COALESCE(dp.is_verified, false) THEN 'Complete identity verification to unlock Pro tier' END,
        CASE WHEN NOT COALESCE(dp.insurance_verified, false) THEN 'Upload insurance documents for trust boost' END,
        CASE WHEN NOT COALESCE(dp.twic_flag, false) THEN 'Add TWIC credential for port/refinery loads' END,
        CASE WHEN dp.photo_url IS NULL THEN 'Add a profile photo to increase broker confidence' END,
        CASE WHEN COALESCE(dp.avg_response_minutes, 999) > 15 THEN 'Faster responses earn higher rankings' END
    ], NULL) AS improvement_tips,
    NOW() AS computed_at
FROM public.driver_profiles dp;

GRANT SELECT ON public.v_corridor_report_card TO anon, authenticated;
GRANT SELECT ON public.v_driver_report_card TO anon, authenticated;

-- 4. Corridor Incidents Table (Waze-style crowdsourced reports)
CREATE TABLE IF NOT EXISTS public.corridor_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_slug TEXT NOT NULL,
    incident_type TEXT NOT NULL CHECK (incident_type IN (
        'construction', 'police', 'bridge_restriction', 'weather',
        'road_closure', 'utility_work', 'accident', 'other'
    )),
    location_text TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('low', 'moderate', 'high', 'critical')),
    reported_by UUID,
    source TEXT DEFAULT 'crowd' CHECK (source IN ('crowd', 'api', 'admin')),
    verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '6 hours',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corridor_incidents_slug ON public.corridor_incidents(corridor_slug);
CREATE INDEX IF NOT EXISTS idx_corridor_incidents_active ON public.corridor_incidents(expires_at) WHERE expires_at > NOW();
ALTER TABLE public.corridor_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active incidents" ON public.corridor_incidents
    FOR SELECT USING (expires_at > NOW());

CREATE POLICY "Authenticated can report incidents" ON public.corridor_incidents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Service role manages incidents" ON public.corridor_incidents
    FOR ALL USING (auth.role() = 'service_role');
