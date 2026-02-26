-- Migration: 20260221_pretraffic_hardening.sql
-- Observability + Availability Truth + Broker Memory + Readiness Gates

-- ============================================================
-- 1. TELEMETRY / OBSERVABILITY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hc_telemetry_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_time timestamptz NOT NULL DEFAULT now(),
    user_id uuid,
    role text,
    action text NOT NULL,
    entity_type text,
    entity_id text,
    latency_ms integer,
    region text,
    client text CHECK (client IN ('web','mobile','api','edge','system')),
    route text,
    status_code integer,
    error_message text,
    metadata jsonb DEFAULT '{}',
    pii_redacted boolean DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_time ON public.hc_telemetry_events(event_time DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_action ON public.hc_telemetry_events(action, event_time);
CREATE INDEX IF NOT EXISTS idx_telemetry_route ON public.hc_telemetry_events(route, event_time) WHERE route IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_telemetry_slow ON public.hc_telemetry_events(latency_ms DESC) WHERE latency_ms > 800;

-- Edge function execution log
CREATE TABLE IF NOT EXISTS public.hc_edge_execution_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name text NOT NULL,
    execution_time_ms integer NOT NULL,
    cold_start boolean DEFAULT false,
    success boolean DEFAULT true,
    error_message text,
    records_processed integer DEFAULT 0,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edge_log_func ON public.hc_edge_execution_log(function_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_edge_log_slow ON public.hc_edge_execution_log(execution_time_ms DESC) WHERE execution_time_ms > 800;

-- Cron execution audit
CREATE TABLE IF NOT EXISTS public.hc_cron_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name text NOT NULL,
    scheduled_at timestamptz NOT NULL,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    status text DEFAULT 'running' CHECK (status IN ('running','completed','failed','stuck')),
    records_processed integer DEFAULT 0,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_audit_job ON public.hc_cron_audit(job_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_stuck ON public.hc_cron_audit(status) WHERE status IN ('running','stuck');

-- ============================================================
-- 2. AVAILABILITY TRUTH SYSTEM
-- ============================================================
CREATE TABLE IF NOT EXISTS public.escort_availability_state (
    escort_id uuid PRIMARY KEY,
    current_status text DEFAULT 'unknown' CHECK (current_status IN ('available','busy','offline','unknown','stale')),
    last_confirmed_at timestamptz,
    last_heartbeat_at timestamptz,
    auto_unavailable_at timestamptz,
    stale_decay_started_at timestamptz,
    availability_expiry_at timestamptz,
    ping_count_today integer DEFAULT 0,
    last_ping_at timestamptz,
    false_availability_flags integer DEFAULT 0,
    trust_score numeric DEFAULT 0.5 CHECK (trust_score >= 0 AND trust_score <= 1),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avail_status ON public.escort_availability_state(current_status);
CREATE INDEX IF NOT EXISTS idx_avail_stale ON public.escort_availability_state(last_confirmed_at) WHERE current_status != 'offline';
CREATE INDEX IF NOT EXISTS idx_avail_expiry ON public.escort_availability_state(availability_expiry_at) WHERE availability_expiry_at IS NOT NULL;

-- ============================================================
-- 3. BROKER MEMORY LAYER
-- ============================================================
CREATE TABLE IF NOT EXISTS public.broker_escort_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id uuid NOT NULL,
    escort_id uuid NOT NULL,
    preference_type text DEFAULT 'preferred' CHECK (preference_type IN ('preferred','blocked','neutral')),
    pairing_count integer DEFAULT 0,
    last_paired_at timestamptz,
    rating numeric CHECK (rating >= 0 AND rating <= 5),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(broker_id, escort_id)
);

CREATE INDEX IF NOT EXISTS idx_broker_prefs_broker ON public.broker_escort_preferences(broker_id, preference_type);

CREATE TABLE IF NOT EXISTS public.broker_lane_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id uuid NOT NULL,
    corridor_id text NOT NULL,
    usage_count integer DEFAULT 0,
    last_used_at timestamptz,
    avg_rate_per_mile numeric,
    preferred_escorts uuid[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    UNIQUE(broker_id, corridor_id)
);

CREATE INDEX IF NOT EXISTS idx_lane_prefs_broker ON public.broker_lane_preferences(broker_id, usage_count DESC);

-- ============================================================
-- 4. READINESS GATES (configurable flags)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hc_readiness_gates (
    gate_name text PRIMARY KEY,
    gate_category text NOT NULL CHECK (gate_category IN ('paid_ads','coverage_guarantee','broker_acquisition','liquidity_visibility')),
    current_value numeric DEFAULT 0,
    threshold numeric NOT NULL,
    operator text DEFAULT '>=' CHECK (operator IN ('>=','<=','>')),
    is_passing boolean DEFAULT false,
    last_computed_at timestamptz,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Seed readiness gates
INSERT INTO public.hc_readiness_gates (gate_name, gate_category, threshold, operator, notes) VALUES
    ('observability_stack_green',     'paid_ads',             1,    '>=', 'Event pipeline + tracing active'),
    ('liquidity_control_tower_green', 'paid_ads',             1,    '>=', 'Live metrics dashboard operational'),
    ('median_first_response_sec',     'paid_ads',             120,  '<=', 'Median first response < 120s'),
    ('uncovered_load_rate',           'paid_ads',             0.08, '<=', 'Uncovered load rate < 8%'),
    ('push_delivery_success_rate',    'paid_ads',             0.95, '>=', 'Push delivery > 95%'),
    ('shortlist_generation_time_sec', 'paid_ads',             2,    '<=', 'Shortlist < 2s'),
    ('corridor_health_score_avg',     'coverage_guarantee',   75,   '>=', 'Average corridor health ≥ 75'),
    ('fill_success_rate_30d',         'coverage_guarantee',   0.94, '>=', 'Fill rate ≥ 94% over 30d'),
    ('active_escort_density_met',     'coverage_guarantee',   1,    '>=', 'Escort density threshold met'),
    ('dispute_rate_below_threshold',  'coverage_guarantee',   0.03, '<=', 'Dispute rate < 3%'),
    ('broker_time_to_assignment_min', 'broker_acquisition',   15,   '<=', 'Assignment < 15 min'),
    ('broker_repeat_rate',            'broker_acquisition',   0.30, '>=', 'Repeat broker rate ≥ 30%'),
    ('liquidity_stable_30d',          'broker_acquisition',   1,    '>=', 'Liquidity stable 30 days'),
    ('false_availability_rate',       'liquidity_visibility', 0.03, '<=', 'False availability < 3%')
ON CONFLICT (gate_name) DO NOTHING;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.hc_telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_edge_execution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_cron_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escort_availability_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_escort_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_lane_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_readiness_gates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_telemetry" ON public.hc_telemetry_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_edge_log" ON public.hc_edge_execution_log FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_cron" ON public.hc_cron_audit FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_avail" ON public.escort_availability_state FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "own_avail" ON public.escort_availability_state FOR SELECT USING (escort_id = auth.uid());
CREATE POLICY "service_broker_prefs" ON public.broker_escort_preferences FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "own_broker_prefs" ON public.broker_escort_preferences FOR ALL USING (broker_id = auth.uid());
CREATE POLICY "service_lane_prefs" ON public.broker_lane_preferences FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "own_lane_prefs" ON public.broker_lane_preferences FOR ALL USING (broker_id = auth.uid());
CREATE POLICY "public_read_gates" ON public.hc_readiness_gates FOR SELECT USING (true);
CREATE POLICY "service_write_gates" ON public.hc_readiness_gates FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- TELEMETRY INGEST RPC (fast, PII-safe)
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_telemetry(
    p_action text,
    p_user_id uuid DEFAULT NULL,
    p_role text DEFAULT NULL,
    p_entity_type text DEFAULT NULL,
    p_entity_id text DEFAULT NULL,
    p_latency_ms integer DEFAULT NULL,
    p_client text DEFAULT 'web',
    p_route text DEFAULT NULL,
    p_status_code integer DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.hc_telemetry_events (action, user_id, role, entity_type, entity_id, latency_ms, client, route, status_code, metadata)
    VALUES (p_action, p_user_id, p_role, p_entity_type, p_entity_id, p_latency_ms, p_client, p_route, p_status_code, p_metadata);
END;
$$;

-- ============================================================
-- AVAILABILITY HEARTBEAT RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.escort_heartbeat(p_escort_id uuid, p_status text DEFAULT 'available')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expiry timestamptz;
BEGIN
    v_expiry := now() + interval '4 hours'; -- availability expires in 4h without refresh

    INSERT INTO public.escort_availability_state (escort_id, current_status, last_confirmed_at, last_heartbeat_at, availability_expiry_at, updated_at)
    VALUES (p_escort_id, p_status, now(), now(), CASE WHEN p_status = 'available' THEN v_expiry ELSE NULL END, now())
    ON CONFLICT (escort_id) DO UPDATE SET
        current_status = p_status,
        last_confirmed_at = now(),
        last_heartbeat_at = now(),
        availability_expiry_at = CASE WHEN p_status = 'available' THEN v_expiry ELSE NULL END,
        stale_decay_started_at = NULL,
        updated_at = now();

    RETURN jsonb_build_object('status', p_status, 'expires_at', v_expiry, 'heartbeat_at', now());
END;
$$;

-- ============================================================
-- EXPIRE STALE AVAILABILITY RPC (cron-driven)
-- ============================================================
CREATE OR REPLACE FUNCTION public.expire_stale_availability()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expired integer;
BEGIN
    -- Mark stale: no heartbeat for > 4h while "available"
    UPDATE public.escort_availability_state
    SET current_status = 'stale',
        stale_decay_started_at = COALESCE(stale_decay_started_at, now()),
        false_availability_flags = false_availability_flags + 1,
        updated_at = now()
    WHERE current_status = 'available'
      AND (availability_expiry_at IS NOT NULL AND availability_expiry_at < now());

    GET DIAGNOSTICS v_expired = ROW_COUNT;

    -- Auto-offline after 48h stale
    UPDATE public.escort_availability_state
    SET current_status = 'offline', updated_at = now()
    WHERE current_status = 'stale'
      AND stale_decay_started_at < now() - interval '48 hours';

    RETURN v_expired;
END;
$$;

-- ============================================================
-- BROKER MEMORY: Record pairing
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_broker_pairing(
    p_broker_id uuid, p_escort_id uuid, p_corridor_id text DEFAULT NULL, p_rate_per_mile numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Escort preference
    INSERT INTO public.broker_escort_preferences (broker_id, escort_id, pairing_count, last_paired_at)
    VALUES (p_broker_id, p_escort_id, 1, now())
    ON CONFLICT (broker_id, escort_id) DO UPDATE SET
        pairing_count = broker_escort_preferences.pairing_count + 1,
        last_paired_at = now(), updated_at = now();

    -- Lane preference
    IF p_corridor_id IS NOT NULL THEN
        INSERT INTO public.broker_lane_preferences (broker_id, corridor_id, usage_count, last_used_at, avg_rate_per_mile)
        VALUES (p_broker_id, p_corridor_id, 1, now(), p_rate_per_mile)
        ON CONFLICT (broker_id, corridor_id) DO UPDATE SET
            usage_count = broker_lane_preferences.usage_count + 1,
            last_used_at = now(),
            avg_rate_per_mile = CASE
                WHEN p_rate_per_mile IS NOT NULL THEN
                    (COALESCE(broker_lane_preferences.avg_rate_per_mile, 0) * broker_lane_preferences.usage_count + p_rate_per_mile) / (broker_lane_preferences.usage_count + 1)
                ELSE broker_lane_preferences.avg_rate_per_mile
            END;
    END IF;
END;
$$;

-- ============================================================
-- READINESS GATE EVALUATOR
-- ============================================================
CREATE OR REPLACE FUNCTION public.evaluate_readiness_gates()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_results jsonb := '{}';
    v_gate record;
    v_passing boolean;
    v_categories jsonb := '{}';
BEGIN
    FOR v_gate IN SELECT * FROM public.hc_readiness_gates ORDER BY gate_category, gate_name
    LOOP
        v_passing := CASE v_gate.operator
            WHEN '>=' THEN v_gate.current_value >= v_gate.threshold
            WHEN '<=' THEN v_gate.current_value <= v_gate.threshold
            WHEN '>'  THEN v_gate.current_value > v_gate.threshold
            ELSE false
        END;

        UPDATE public.hc_readiness_gates SET is_passing = v_passing, last_computed_at = now() WHERE gate_name = v_gate.gate_name;
    END LOOP;

    -- Aggregate by category
    SELECT jsonb_object_agg(gate_category, cat_result)
    INTO v_results
    FROM (
        SELECT gate_category,
            jsonb_build_object(
                'all_passing', bool_and(is_passing),
                'total', count(*),
                'passing', count(*) FILTER (WHERE is_passing),
                'failing', array_agg(gate_name) FILTER (WHERE NOT is_passing)
            ) as cat_result
        FROM public.hc_readiness_gates
        GROUP BY gate_category
    ) sub;

    RETURN v_results;
END;
$$;
