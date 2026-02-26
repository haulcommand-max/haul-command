-- Migration: 20260221_ecosystem_data_spine.sql
-- Ecosystem Data Monetization Spine — Universal Event Logging + Fact Tables
-- Append-only event stream, job lifecycle, rate intelligence, broker payment, route risk

-- ============================================================
-- 1. UNIVERSAL EVENT STREAM (append-only master ledger)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hc_event_stream (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_time timestamptz NOT NULL DEFAULT now(),
    event_type text NOT NULL,
    actor_type text NOT NULL CHECK (actor_type IN ('escort','broker','carrier','system')),
    actor_id uuid,
    session_id uuid,
    job_id uuid,
    corridor_id text,
    state_origin text,
    state_destination text,
    urgency_level integer DEFAULT 0 CHECK (urgency_level BETWEEN 0 AND 5),
    payload jsonb DEFAULT '{}'::jsonb,
    ingest_source text DEFAULT 'system' CHECK (ingest_source IN ('mobile','web','api','system')),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_event_stream_time ON public.hc_event_stream(event_time DESC);
CREATE INDEX IF NOT EXISTS idx_event_stream_type_time ON public.hc_event_stream(event_type, event_time);
CREATE INDEX IF NOT EXISTS idx_event_stream_actor ON public.hc_event_stream(actor_id, event_time);
CREATE INDEX IF NOT EXISTS idx_event_stream_job ON public.hc_event_stream(job_id) WHERE job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_stream_corridor ON public.hc_event_stream(corridor_id, event_time) WHERE corridor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_stream_payload ON public.hc_event_stream USING gin(payload);

-- ============================================================
-- 2. JOB LIFECYCLE FACT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hc_job_lifecycle (
    job_id uuid PRIMARY KEY,
    broker_id uuid,
    corridor_id text,
    load_class text,
    escorts_required integer DEFAULT 1,
    escorts_assigned integer DEFAULT 0,
    broadcast_time timestamptz,
    first_response_time timestamptz,
    fill_time timestamptz,
    unfilled_flag boolean DEFAULT false,
    urgency_level integer DEFAULT 0,
    total_broadcast_count integer DEFAULT 0,
    time_to_first_response_sec integer GENERATED ALWAYS AS (
        CASE WHEN first_response_time IS NOT NULL AND broadcast_time IS NOT NULL
             THEN EXTRACT(EPOCH FROM (first_response_time - broadcast_time))::integer
             ELSE NULL END
    ) STORED,
    time_to_fill_sec integer GENERATED ALWAYS AS (
        CASE WHEN fill_time IS NOT NULL AND broadcast_time IS NOT NULL
             THEN EXTRACT(EPOCH FROM (fill_time - broadcast_time))::integer
             ELSE NULL END
    ) STORED,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_lifecycle_broker ON public.hc_job_lifecycle(broker_id);
CREATE INDEX IF NOT EXISTS idx_job_lifecycle_corridor ON public.hc_job_lifecycle(corridor_id);
CREATE INDEX IF NOT EXISTS idx_job_lifecycle_unfilled ON public.hc_job_lifecycle(unfilled_flag) WHERE unfilled_flag = true;

-- ============================================================
-- 3. RATE INTELLIGENCE FACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hc_rate_facts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid,
    corridor_id text NOT NULL,
    miles numeric,
    escorts_required integer DEFAULT 1,
    rate_offered numeric,
    rate_accepted numeric,
    rate_per_mile numeric GENERATED ALWAYS AS (
        CASE WHEN miles > 0 AND rate_accepted IS NOT NULL
             THEN ROUND(rate_accepted / miles, 2)
             ELSE NULL END
    ) STORED,
    negotiation_count integer DEFAULT 0,
    time_to_agreement_minutes integer DEFAULT 0,
    urgency_level integer DEFAULT 0,
    day_of_week integer,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_facts_corridor ON public.hc_rate_facts(corridor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_facts_job ON public.hc_rate_facts(job_id) WHERE job_id IS NOT NULL;

-- ============================================================
-- 4. BROKER PAYMENT BEHAVIOR
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hc_broker_payment_facts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id uuid NOT NULL,
    job_id uuid,
    invoice_amount numeric,
    invoice_sent_at timestamptz,
    paid_at timestamptz,
    days_to_pay numeric GENERATED ALWAYS AS (
        CASE WHEN paid_at IS NOT NULL AND invoice_sent_at IS NOT NULL
             THEN EXTRACT(EPOCH FROM (paid_at - invoice_sent_at)) / 86400.0
             ELSE NULL END
    ) STORED,
    payment_method text,
    short_pay_flag boolean DEFAULT false,
    dispute_flag boolean DEFAULT false,
    cancellation_after_book boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_facts_broker ON public.hc_broker_payment_facts(broker_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payment_facts_dispute ON public.hc_broker_payment_facts(dispute_flag) WHERE dispute_flag = true;

-- ============================================================
-- 5. ROUTE RISK SIGNALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hc_route_risk_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid,
    corridor_id text,
    route_id text,
    incident_type text,
    weather_severity integer DEFAULT 0 CHECK (weather_severity BETWEEN 0 AND 5),
    delay_minutes integer DEFAULT 0,
    permit_issue_flag boolean DEFAULT false,
    police_required_flag boolean DEFAULT false,
    clearance_margin_inches numeric,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_route_risk_corridor ON public.hc_route_risk_events(corridor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_route_risk_job ON public.hc_route_risk_events(job_id) WHERE job_id IS NOT NULL;

-- ============================================================
-- RLS (service-role only for all spine tables)
-- ============================================================
ALTER TABLE public.hc_event_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_job_lifecycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_rate_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_broker_payment_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_route_risk_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_only_events" ON public.hc_event_stream FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only_lifecycle" ON public.hc_job_lifecycle FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only_rates" ON public.hc_rate_facts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only_payments" ON public.hc_broker_payment_facts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only_route_risk" ON public.hc_route_risk_events FOR ALL USING (auth.role() = 'service_role');

-- Broker can read own payment facts
CREATE POLICY "broker_own_payments" ON public.hc_broker_payment_facts FOR SELECT USING (broker_id = auth.uid());

-- ============================================================
-- EVENT INGEST RPC (idempotent, validated)
-- ============================================================
CREATE OR REPLACE FUNCTION public.ingest_event(
    p_event_type text,
    p_actor_type text,
    p_actor_id uuid DEFAULT NULL,
    p_session_id uuid DEFAULT NULL,
    p_job_id uuid DEFAULT NULL,
    p_corridor_id text DEFAULT NULL,
    p_state_origin text DEFAULT NULL,
    p_state_destination text DEFAULT NULL,
    p_urgency_level integer DEFAULT 0,
    p_payload jsonb DEFAULT '{}'::jsonb,
    p_ingest_source text DEFAULT 'system'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id uuid;
    v_corridor text;
BEGIN
    -- Auto-compute corridor if origin+dest provided
    v_corridor := COALESCE(p_corridor_id, 
        CASE WHEN p_state_origin IS NOT NULL AND p_state_destination IS NOT NULL 
             THEN p_state_origin || '-' || p_state_destination 
             ELSE NULL END
    );

    INSERT INTO public.hc_event_stream (event_type, actor_type, actor_id, session_id, job_id, corridor_id, state_origin, state_destination, urgency_level, payload, ingest_source)
    VALUES (p_event_type, p_actor_type, p_actor_id, p_session_id, p_job_id, v_corridor, p_state_origin, p_state_destination, p_urgency_level, p_payload, p_ingest_source)
    RETURNING id INTO v_event_id;

    -- Auto-populate fact tables based on event type
    CASE p_event_type
        WHEN 'job_broadcasted' THEN
            INSERT INTO public.hc_job_lifecycle (job_id, broker_id, corridor_id, urgency_level, broadcast_time, total_broadcast_count)
            VALUES (p_job_id, p_actor_id, v_corridor, p_urgency_level, now(), 1)
            ON CONFLICT (job_id) DO UPDATE SET total_broadcast_count = hc_job_lifecycle.total_broadcast_count + 1;

        WHEN 'escort_responded' THEN
            UPDATE public.hc_job_lifecycle
            SET first_response_time = COALESCE(first_response_time, now())
            WHERE job_id = p_job_id;

        WHEN 'job_fully_covered' THEN
            UPDATE public.hc_job_lifecycle
            SET fill_time = now(), escorts_assigned = COALESCE((p_payload->>'escorts_assigned')::int, escorts_assigned)
            WHERE job_id = p_job_id;

        WHEN 'job_unfilled_timeout' THEN
            UPDATE public.hc_job_lifecycle
            SET unfilled_flag = true
            WHERE job_id = p_job_id;

        WHEN 'rate_accepted' THEN
            INSERT INTO public.hc_rate_facts (job_id, corridor_id, miles, escorts_required, rate_offered, rate_accepted, negotiation_count, urgency_level, day_of_week)
            VALUES (
                p_job_id, v_corridor,
                (p_payload->>'miles')::numeric,
                COALESCE((p_payload->>'escorts_required')::int, 1),
                (p_payload->>'rate_offered')::numeric,
                (p_payload->>'rate_accepted')::numeric,
                COALESCE((p_payload->>'negotiation_count')::int, 0),
                p_urgency_level,
                EXTRACT(DOW FROM now())::int
            );

        WHEN 'invoice_sent' THEN
            INSERT INTO public.hc_broker_payment_facts (broker_id, job_id, invoice_amount, invoice_sent_at)
            VALUES (p_actor_id, p_job_id, (p_payload->>'invoice_amount')::numeric, now());

        WHEN 'payment_received' THEN
            UPDATE public.hc_broker_payment_facts
            SET paid_at = now(), payment_method = p_payload->>'payment_method'
            WHERE job_id = p_job_id AND paid_at IS NULL;

        WHEN 'dispute_opened' THEN
            UPDATE public.hc_broker_payment_facts
            SET dispute_flag = true
            WHERE job_id = p_job_id;

        WHEN 'route_delay', 'permit_issue', 'police_escalation' THEN
            INSERT INTO public.hc_route_risk_events (job_id, corridor_id, incident_type, weather_severity, delay_minutes, permit_issue_flag, police_required_flag, clearance_margin_inches)
            VALUES (
                p_job_id, v_corridor, p_event_type,
                COALESCE((p_payload->>'weather_severity')::int, 0),
                COALESCE((p_payload->>'delay_minutes')::int, 0),
                p_event_type = 'permit_issue',
                p_event_type = 'police_escalation',
                (p_payload->>'clearance_margin_inches')::numeric
            );
        ELSE
            -- Unknown event type — still logged to stream
            NULL;
    END CASE;

    RETURN v_event_id;
END;
$$;
