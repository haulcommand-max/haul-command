-- Migration: 20260221_liquidity_control_tower.sql
-- Wave 2 Gap Closer: Real-Time Liquidity Monitor (40x multiplier)

-- 1. Corridor Health Scores
CREATE TABLE IF NOT EXISTS public.corridor_health_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor text NOT NULL,
    origin_state text,
    dest_state text,
    fill_rate numeric DEFAULT 0 CHECK (fill_rate >= 0 AND fill_rate <= 1),
    median_response_sec integer DEFAULT 0,
    supply_demand_ratio numeric DEFAULT 0,
    escorts_available integer DEFAULT 0,
    loads_open integer DEFAULT 0,
    loads_filled_24h integer DEFAULT 0,
    health_grade text DEFAULT 'F' CHECK (health_grade IN ('A','B','C','D','F')),
    computed_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(corridor)
);

CREATE INDEX IF NOT EXISTS idx_corridor_health_grade ON public.corridor_health_scores(health_grade);
CREATE INDEX IF NOT EXISTS idx_corridor_health_computed ON public.corridor_health_scores(computed_at);

-- 2. Uncovered Load Alerts
CREATE TABLE IF NOT EXISTS public.uncovered_load_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id uuid NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
    uncovered_since timestamptz NOT NULL,
    duration_minutes integer GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (now() - uncovered_since))::integer / 60
    ) STORED,
    alert_tier text DEFAULT 'warning' CHECK (alert_tier IN ('warning','critical','emergency')),
    notified boolean DEFAULT false,
    resolved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE(load_id)
);

CREATE INDEX IF NOT EXISTS idx_uncovered_alerts_tier ON public.uncovered_load_alerts(alert_tier) WHERE resolved_at IS NULL;

-- 3. RLS
ALTER TABLE public.corridor_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uncovered_load_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_corridor_health" ON public.corridor_health_scores FOR SELECT USING (true);
CREATE POLICY "service_role_all_corridor_health" ON public.corridor_health_scores FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "broker_read_own_uncovered" ON public.uncovered_load_alerts FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.loads WHERE loads.id = uncovered_load_alerts.load_id AND loads.broker_id = auth.uid())
);
CREATE POLICY "service_role_all_uncovered" ON public.uncovered_load_alerts FOR ALL USING (auth.role() = 'service_role');

-- 4. RPC: Compute Corridor Health
CREATE OR REPLACE FUNCTION public.compute_corridor_health()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated integer := 0;
BEGIN
    -- Compute health per corridor from recent match data
    INSERT INTO public.corridor_health_scores (corridor, origin_state, dest_state, fill_rate, median_response_sec, supply_demand_ratio, escorts_available, loads_open, loads_filled_24h, health_grade, computed_at)
    SELECT
        COALESCE(l.origin_state, '??') || '-' || COALESCE(l.dest_state, '??') as corridor,
        l.origin_state,
        l.dest_state,
        -- Fill rate: loads matched / loads posted (last 24h)
        CASE WHEN COUNT(l.id) > 0 THEN
            COUNT(CASE WHEN m.id IS NOT NULL THEN 1 END)::numeric / COUNT(l.id)::numeric
        ELSE 0 END as fill_rate,
        -- Median response: from match_offers
        COALESCE((
            SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (mo.responded_at - mo.offered_at)))
            FROM public.match_offers mo
            WHERE mo.load_id = ANY(array_agg(l.id))
              AND mo.responded_at IS NOT NULL
        )::integer, 0) as median_response_sec,
        -- Supply/demand ratio
        CASE WHEN COUNT(l.id) > 0 THEN
            COALESCE((SELECT COUNT(*) FROM public.escort_presence WHERE status IN ('available','online'))::numeric / GREATEST(COUNT(l.id)::numeric, 1), 0)
        ELSE 0 END as supply_demand_ratio,
        (SELECT COUNT(*) FROM public.escort_presence WHERE status IN ('available','online'))::integer,
        COUNT(CASE WHEN l.status IN ('open','active') THEN 1 END)::integer,
        COUNT(CASE WHEN m.id IS NOT NULL THEN 1 END)::integer,
        -- Health grade
        CASE
            WHEN COUNT(l.id) = 0 THEN 'F'
            WHEN (COUNT(CASE WHEN m.id IS NOT NULL THEN 1 END)::numeric / GREATEST(COUNT(l.id)::numeric, 1)) >= 0.8 THEN 'A'
            WHEN (COUNT(CASE WHEN m.id IS NOT NULL THEN 1 END)::numeric / GREATEST(COUNT(l.id)::numeric, 1)) >= 0.6 THEN 'B'
            WHEN (COUNT(CASE WHEN m.id IS NOT NULL THEN 1 END)::numeric / GREATEST(COUNT(l.id)::numeric, 1)) >= 0.4 THEN 'C'
            WHEN (COUNT(CASE WHEN m.id IS NOT NULL THEN 1 END)::numeric / GREATEST(COUNT(l.id)::numeric, 1)) >= 0.2 THEN 'D'
            ELSE 'F'
        END as health_grade,
        now()
    FROM public.loads l
    LEFT JOIN public.matches m ON m.load_id = l.id
    WHERE l.created_at > now() - interval '24 hours'
    GROUP BY l.origin_state, l.dest_state
    ON CONFLICT (corridor) DO UPDATE SET
        fill_rate = EXCLUDED.fill_rate,
        median_response_sec = EXCLUDED.median_response_sec,
        supply_demand_ratio = EXCLUDED.supply_demand_ratio,
        escorts_available = EXCLUDED.escorts_available,
        loads_open = EXCLUDED.loads_open,
        loads_filled_24h = EXCLUDED.loads_filled_24h,
        health_grade = EXCLUDED.health_grade,
        computed_at = now();

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated;
END;
$$;

-- 5. RPC: Flag Uncovered Loads
CREATE OR REPLACE FUNCTION public.flag_uncovered_loads()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_flagged integer := 0;
BEGIN
    INSERT INTO public.uncovered_load_alerts (load_id, uncovered_since, alert_tier)
    SELECT
        l.id,
        l.created_at,
        CASE
            WHEN EXTRACT(EPOCH FROM (now() - l.created_at)) / 60 > 120 THEN 'emergency'
            WHEN EXTRACT(EPOCH FROM (now() - l.created_at)) / 60 > 60 THEN 'critical'
            ELSE 'warning'
        END
    FROM public.loads l
    WHERE l.status IN ('open','active')
      AND l.created_at < now() - interval '30 minutes'
      AND NOT EXISTS (SELECT 1 FROM public.match_offers mo WHERE mo.load_id = l.id)
      AND NOT EXISTS (SELECT 1 FROM public.uncovered_load_alerts ula WHERE ula.load_id = l.id AND ula.resolved_at IS NULL)
    ON CONFLICT (load_id) DO UPDATE SET
        alert_tier = EXCLUDED.alert_tier;

    GET DIAGNOSTICS v_flagged = ROW_COUNT;
    RETURN v_flagged;
END;
$$;
