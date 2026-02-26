-- Migration: 20260221_broker_shortlist.sql
-- Wave 1 Gap Closer: Broker Dispatch Shortlist (50x multiplier)
-- Pre-ranked escort recommendations for instant broker dispatch

-- 1. Shortlist Cache — stores pre-computed ranked results per load
CREATE TABLE IF NOT EXISTS public.broker_shortlist_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id uuid NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
    ranked_escorts jsonb NOT NULL DEFAULT '[]'::jsonb,
    -- Each entry: { escort_id, rank, confidence_pct, eta_minutes, rate_suggestion, readiness_score, distance_miles, territory_match }
    generated_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
    UNIQUE(load_id)
);

CREATE INDEX IF NOT EXISTS idx_shortlist_cache_load ON public.broker_shortlist_cache(load_id);
CREATE INDEX IF NOT EXISTS idx_shortlist_cache_expires ON public.broker_shortlist_cache(expires_at);

-- 2. Dispatch Packs — tracks one-click dispatch actions from shortlist
CREATE TABLE IF NOT EXISTS public.broker_dispatch_packs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id uuid NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
    escort_id uuid NOT NULL,
    broker_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'dispatched' CHECK (status IN ('dispatched','accepted','declined','expired','cancelled')),
    confidence_pct numeric DEFAULT 0,
    dispatched_at timestamptz NOT NULL DEFAULT now(),
    responded_at timestamptz,
    response_time_sec integer GENERATED ALWAYS AS (
        CASE WHEN responded_at IS NOT NULL
             THEN EXTRACT(EPOCH FROM (responded_at - dispatched_at))::integer
             ELSE NULL
        END
    ) STORED
);

CREATE INDEX IF NOT EXISTS idx_dispatch_packs_load ON public.broker_dispatch_packs(load_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_packs_escort ON public.broker_dispatch_packs(escort_id, status);
CREATE INDEX IF NOT EXISTS idx_dispatch_packs_broker ON public.broker_dispatch_packs(broker_id, dispatched_at DESC);

-- 3. RLS
ALTER TABLE public.broker_shortlist_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_dispatch_packs ENABLE ROW LEVEL SECURITY;

-- Brokers can read shortlists for their loads
CREATE POLICY "broker_read_own_shortlists" ON public.broker_shortlist_cache
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.loads WHERE loads.id = broker_shortlist_cache.load_id AND loads.broker_id = auth.uid())
    );

-- Escorts can see dispatches sent to them
CREATE POLICY "escort_read_own_dispatches" ON public.broker_dispatch_packs
    FOR SELECT USING (escort_id = auth.uid());

-- Brokers can see dispatches they sent
CREATE POLICY "broker_read_own_dispatches" ON public.broker_dispatch_packs
    FOR SELECT USING (broker_id = auth.uid());

-- Service role full access
CREATE POLICY "service_role_all_shortlist" ON public.broker_shortlist_cache FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_dispatch" ON public.broker_dispatch_packs FOR ALL USING (auth.role() = 'service_role');

-- 4. RPC: Generate Broker Shortlist
-- Ranks available escorts by composite score for a given load
CREATE OR REPLACE FUNCTION public.generate_broker_shortlist(p_load_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_load record;
    v_results jsonb;
    v_shortlist_id uuid;
BEGIN
    -- Get load details
    SELECT id, origin_lat, origin_lng, origin_state, equipment_required
    INTO v_load
    FROM public.loads
    WHERE id = p_load_id AND status IN ('open', 'active');

    IF NOT FOUND THEN
        RETURN jsonb_build_object('shortlist', '[]'::jsonb, 'message', 'Load not found or not open');
    END IF;

    -- Check cache first
    SELECT ranked_escorts INTO v_results
    FROM public.broker_shortlist_cache
    WHERE load_id = p_load_id AND expires_at > now();

    IF v_results IS NOT NULL THEN
        RETURN jsonb_build_object('shortlist', v_results, 'cached', true);
    END IF;

    -- Generate fresh shortlist: rank escorts by composite score
    WITH available_escorts AS (
        SELECT
            ep.escort_id,
            epr.last_lat,
            epr.last_lng,
            epr.status as presence_status,
            ep.readiness_score,
            ep.response_time_sec_avg,
            ep.trust_base,
            -- Distance calculation (simplified haversine approx in miles)
            CASE WHEN v_load.origin_lat IS NOT NULL AND epr.last_lat IS NOT NULL THEN
                3959 * acos(
                    LEAST(1.0, cos(radians(v_load.origin_lat)) * cos(radians(epr.last_lat)) *
                    cos(radians(epr.last_lng) - radians(v_load.origin_lng)) +
                    sin(radians(v_load.origin_lat)) * sin(radians(epr.last_lat)))
                )
            ELSE 9999 END as distance_miles,
            -- Territory match
            EXISTS (
                SELECT 1 FROM public.escort_territory_claims etc
                WHERE etc.escort_id = ep.escort_id AND etc.state_code = v_load.origin_state
            ) as territory_match
        FROM public.escort_profiles ep
        JOIN public.escort_presence epr ON epr.escort_id = ep.escort_id
        WHERE epr.status IN ('available', 'online')
          AND epr.updated_at > now() - interval '4 hours'
    ),
    scored AS (
        SELECT
            ae.escort_id,
            ae.distance_miles,
            ae.territory_match,
            COALESCE(ae.readiness_score, 50) as readiness_score,
            COALESCE(ae.response_time_sec_avg, 300) as response_time_sec_avg,
            COALESCE(ae.trust_base, 50) as trust_base,
            -- Composite score (0-100): proximity(30%) + readiness(25%) + response speed(20%) + trust(15%) + territory(10%)
            (
                GREATEST(0, (100 - LEAST(ae.distance_miles, 500) / 5)) * 0.30 +
                COALESCE(ae.readiness_score, 50) * 0.25 +
                GREATEST(0, (100 - LEAST(COALESCE(ae.response_time_sec_avg, 300), 600) / 6)) * 0.20 +
                COALESCE(ae.trust_base, 50) * 0.15 +
                CASE WHEN ae.territory_match THEN 100 ELSE 0 END * 0.10
            ) as composite_score
        FROM available_escorts ae
        WHERE ae.distance_miles < 500
    )
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'escort_id', s.escort_id,
            'rank', row_number() OVER (ORDER BY s.composite_score DESC),
            'confidence_pct', ROUND(s.composite_score),
            'distance_miles', ROUND(s.distance_miles::numeric, 1),
            'readiness_score', ROUND(s.readiness_score::numeric),
            'response_time_sec', s.response_time_sec_avg,
            'trust_score', ROUND(s.trust_base::numeric),
            'territory_match', s.territory_match
        ) ORDER BY s.composite_score DESC
    ), '[]'::jsonb) INTO v_results
    FROM (SELECT * FROM scored ORDER BY composite_score DESC LIMIT 10) s;

    -- Cache the result
    INSERT INTO public.broker_shortlist_cache (load_id, ranked_escorts)
    VALUES (p_load_id, v_results)
    ON CONFLICT (load_id) DO UPDATE SET
        ranked_escorts = EXCLUDED.ranked_escorts,
        generated_at = now(),
        expires_at = now() + interval '30 minutes';

    RETURN jsonb_build_object('shortlist', v_results, 'cached', false);
END;
$$;

-- 5. RPC: Dispatch From Shortlist (one-click)
CREATE OR REPLACE FUNCTION public.dispatch_from_shortlist(
    p_load_id uuid,
    p_escort_id uuid,
    p_confidence_pct numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_broker_id uuid;
    v_dispatch_id uuid;
    v_offer_id uuid;
BEGIN
    -- Verify broker owns the load
    SELECT broker_id INTO v_broker_id
    FROM public.loads WHERE id = p_load_id;

    IF v_broker_id IS NULL OR v_broker_id != auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
    END IF;

    -- Check for existing dispatch to same escort
    IF EXISTS (
        SELECT 1 FROM public.broker_dispatch_packs
        WHERE load_id = p_load_id AND escort_id = p_escort_id AND status = 'dispatched'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already dispatched to this escort');
    END IF;

    -- Create dispatch pack
    INSERT INTO public.broker_dispatch_packs (load_id, escort_id, broker_id, confidence_pct)
    VALUES (p_load_id, p_escort_id, auth.uid(), p_confidence_pct)
    RETURNING id INTO v_dispatch_id;

    -- Create match_offer (integrates with existing matching system)
    INSERT INTO public.match_offers (load_id, broker_id, escort_id, status, wave)
    VALUES (p_load_id, auth.uid(), p_escort_id, 'offered', 0)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_offer_id;

    RETURN jsonb_build_object(
        'success', true,
        'dispatch_id', v_dispatch_id,
        'offer_id', v_offer_id
    );
END;
$$;
