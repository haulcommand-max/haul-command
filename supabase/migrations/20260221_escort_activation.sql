-- Migration: 20260221_escort_activation.sql
-- Wave 3 Gap Closer: Escort Activation Engine (40x multiplier)

-- 1. Activation Nudges — tracks all nudge attempts
CREATE TABLE IF NOT EXISTS public.activation_nudges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    escort_id uuid NOT NULL,
    nudge_type text NOT NULL CHECK (nudge_type IN ('gentle_ping','missing_loads','going_dormant','smart_wake','territory_demand')),
    channel text NOT NULL DEFAULT 'push' CHECK (channel IN ('push','sms','email')),
    sent_at timestamptz NOT NULL DEFAULT now(),
    responded boolean DEFAULT false,
    responded_at timestamptz,
    response_time_sec integer GENERATED ALWAYS AS (
        CASE WHEN responded_at IS NOT NULL
             THEN EXTRACT(EPOCH FROM (responded_at - sent_at))::integer
             ELSE NULL
        END
    ) STORED,
    load_context_id uuid REFERENCES public.loads(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_nudges_escort ON public.activation_nudges(escort_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_nudges_type ON public.activation_nudges(nudge_type, responded);

-- 2. Predicted Availability — learned patterns per escort
CREATE TABLE IF NOT EXISTS public.escort_predicted_availability (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    escort_id uuid NOT NULL,
    day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    hour_block integer NOT NULL CHECK (hour_block BETWEEN 0 AND 23),
    probability numeric DEFAULT 0 CHECK (probability >= 0 AND probability <= 1),
    sample_count integer DEFAULT 0,
    last_computed_at timestamptz DEFAULT now(),
    UNIQUE(escort_id, day_of_week, hour_block)
);

CREATE INDEX IF NOT EXISTS idx_predicted_avail_escort ON public.escort_predicted_availability(escort_id);

-- 3. RLS
ALTER TABLE public.activation_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escort_predicted_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "escort_read_own_nudges" ON public.activation_nudges FOR SELECT USING (escort_id = auth.uid());
CREATE POLICY "service_role_all_nudges" ON public.activation_nudges FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "escort_read_own_availability" ON public.escort_predicted_availability FOR SELECT USING (escort_id = auth.uid());
CREATE POLICY "service_role_all_avail" ON public.escort_predicted_availability FOR ALL USING (auth.role() = 'service_role');

-- 4. RPC: Compute Predicted Availability for an escort
CREATE OR REPLACE FUNCTION public.compute_predicted_availability(p_escort_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated integer := 0;
BEGIN
    -- Based on 30-day escort_presence history: count online/available pings per day_of_week + hour_block
    INSERT INTO public.escort_predicted_availability (escort_id, day_of_week, hour_block, probability, sample_count, last_computed_at)
    SELECT
        p_escort_id,
        EXTRACT(DOW FROM ep.updated_at)::integer as dow,
        EXTRACT(HOUR FROM ep.updated_at)::integer as hour,
        COUNT(CASE WHEN ep.status IN ('available','online') THEN 1 END)::numeric / GREATEST(COUNT(*)::numeric, 1) as prob,
        COUNT(*),
        now()
    FROM public.escort_presence ep
    WHERE ep.escort_id = p_escort_id
      AND ep.updated_at > now() - interval '30 days'
    GROUP BY EXTRACT(DOW FROM ep.updated_at), EXTRACT(HOUR FROM ep.updated_at)
    ON CONFLICT (escort_id, day_of_week, hour_block) DO UPDATE SET
        probability = EXCLUDED.probability,
        sample_count = EXCLUDED.sample_count,
        last_computed_at = now();

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated;
END;
$$;

-- 5. Auto-unavailable trigger: mark escorts unavailable after 48h no presence update
CREATE OR REPLACE FUNCTION public.auto_unavailable_stale_escorts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count integer;
BEGIN
    UPDATE public.escort_presence
    SET status = 'offline', updated_at = now()
    WHERE status IN ('available', 'online')
      AND updated_at < now() - interval '48 hours';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;
