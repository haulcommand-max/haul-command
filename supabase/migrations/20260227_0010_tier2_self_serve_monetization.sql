-- Migration: 20260227_0010_tier2_self_serve_monetization.sql
-- Tier 2 (Controlled Self-Serve) — Usage metering, plan matrix,
-- abuse guardrails, key provisioning enhancements, observability

-- ============================================================
-- 1. EXTEND enterprise_api_keys FOR SELF-SERVE
-- ============================================================
ALTER TABLE public.enterprise_api_keys
    ADD COLUMN IF NOT EXISTS org_id uuid,
    ADD COLUMN IF NOT EXISTS key_label text DEFAULT 'Default',
    ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
        CHECK (status IN ('active','suspended','revoked','expired')),
    ADD COLUMN IF NOT EXISTS suspension_reason text,
    ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
    ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
    ADD COLUMN IF NOT EXISTS ip_allowlist text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS endpoint_allowlist text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS monthly_quota bigint DEFAULT 500000,
    ADD COLUMN IF NOT EXISTS created_by uuid;

CREATE INDEX IF NOT EXISTS idx_api_key_org ON public.enterprise_api_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_api_key_status ON public.enterprise_api_keys(status);

-- Allow users to manage their own keys (self-serve)
CREATE POLICY IF NOT EXISTS "own_keys_insert" ON public.enterprise_api_keys
    FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY IF NOT EXISTS "own_keys_update" ON public.enterprise_api_keys
    FOR UPDATE USING (customer_id = auth.uid())
    WITH CHECK (customer_id = auth.uid());

-- ============================================================
-- 2. ENTERPRISE PLAN MATRIX
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enterprise_plan_matrix (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_slug text NOT NULL UNIQUE,
    display_name text NOT NULL,
    tier text NOT NULL CHECK (tier IN ('insight_starter','pro_intelligence','enterprise_signal','data_licensing_bulk')),
    rpm_limit integer NOT NULL DEFAULT 60,
    monthly_rows bigint NOT NULL DEFAULT 500000,
    max_keys integer NOT NULL DEFAULT 3,
    support_level text NOT NULL DEFAULT 'community'
        CHECK (support_level IN ('community','priority','sla','dedicated')),
    stripe_price_id text,
    overage_unit_price_cents integer DEFAULT 0,
    overage_unit_rows integer DEFAULT 1000,
    contract_override boolean DEFAULT false,
    regional_multiplier_enabled boolean DEFAULT true,
    features jsonb DEFAULT '{}',
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Seed the 3 commercial plans
INSERT INTO public.enterprise_plan_matrix
    (plan_slug, display_name, tier, rpm_limit, monthly_rows, max_keys, support_level, overage_unit_price_cents, overage_unit_rows, features)
VALUES
    ('starter_api', 'Starter API', 'insight_starter', 60, 500000, 3, 'community', 50, 1000,
     '{"products":["operations_optimizer"],"export_formats":["json"],"webhooks":false,"sla_percent":null}'::jsonb),
    ('growth_api', 'Growth API', 'pro_intelligence', 240, 5000000, 10, 'priority', 30, 1000,
     '{"products":["operations_optimizer","pricing_intelligence"],"export_formats":["json","csv"],"webhooks":true,"sla_percent":99.5}'::jsonb),
    ('enterprise_api', 'Enterprise API', 'enterprise_signal', 600, -1, 50, 'sla', 15, 1000,
     '{"products":["operations_optimizer","pricing_intelligence","risk_command","enterprise_full_signal"],"export_formats":["json","csv","parquet"],"webhooks":true,"sla_percent":99.9}'::jsonb)
ON CONFLICT (plan_slug) DO NOTHING;

ALTER TABLE public.enterprise_plan_matrix ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_plans" ON public.enterprise_plan_matrix FOR SELECT USING (active = true);
CREATE POLICY "service_write_plans" ON public.enterprise_plan_matrix FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 3. USAGE METERING TABLE (fine-grained events)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enterprise_usage_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid,
    customer_id uuid NOT NULL,
    api_key_id uuid REFERENCES public.enterprise_api_keys(id),
    endpoint text NOT NULL,
    endpoint_family text NOT NULL,
    method text DEFAULT 'GET',
    rows_returned integer DEFAULT 0,
    compute_cost_units numeric(10,4) DEFAULT 1.0,
    geo_scope text,
    confidence_band text,
    response_time_ms integer,
    status_code integer DEFAULT 200,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_customer_day
    ON public.enterprise_usage_events(customer_id, (timezone('UTC', created_at)::date));
CREATE INDEX IF NOT EXISTS idx_usage_events_key
    ON public.enterprise_usage_events(api_key_id, created_at DESC);

ALTER TABLE public.enterprise_usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_usage_events" ON public.enterprise_usage_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "own_usage_events" ON public.enterprise_usage_events FOR SELECT USING (customer_id = auth.uid());

-- ============================================================
-- 4. USAGE ROLLUPS (daily aggregation for billing + dashboards)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enterprise_usage_rollups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid,
    customer_id uuid NOT NULL,
    rollup_date date NOT NULL,
    plan_slug text,
    total_requests bigint DEFAULT 0,
    total_rows_served bigint DEFAULT 0,
    total_compute_units numeric(14,4) DEFAULT 0,
    quota_rows bigint DEFAULT 0,
    overage_rows bigint DEFAULT 0,
    overage_units integer DEFAULT 0,
    estimated_value_cents bigint DEFAULT 0,
    peak_rpm integer DEFAULT 0,
    unique_endpoints integer DEFAULT 0,
    unique_keys_used integer DEFAULT 0,
    error_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(customer_id, rollup_date)
);

CREATE INDEX IF NOT EXISTS idx_usage_rollups_org_date ON public.enterprise_usage_rollups(org_id, rollup_date DESC);

ALTER TABLE public.enterprise_usage_rollups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_usage_rollups" ON public.enterprise_usage_rollups FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "own_usage_rollups" ON public.enterprise_usage_rollups FOR SELECT USING (customer_id = auth.uid());

-- ============================================================
-- 5. ANOMALY / ABUSE DETECTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enterprise_anomaly_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id uuid REFERENCES public.enterprise_api_keys(id),
    customer_id uuid NOT NULL,
    anomaly_type text NOT NULL
        CHECK (anomaly_type IN (
            'sudden_geo_expansion','key_sharing_signature',
            'abnormal_hourly_spike','low_entropy_sequential_scan',
            'response_size_abuse','burst_detection','ip_rotation'
        )),
    severity text NOT NULL DEFAULT 'warning'
        CHECK (severity IN ('info','warning','critical','auto_suspend')),
    details jsonb DEFAULT '{}',
    resolved boolean DEFAULT false,
    resolved_at timestamptz,
    resolved_by uuid,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anomaly_key ON public.enterprise_anomaly_log(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_unresolved ON public.enterprise_anomaly_log(resolved, severity) WHERE resolved = false;

ALTER TABLE public.enterprise_anomaly_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_anomaly" ON public.enterprise_anomaly_log FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 6. QUOTA WARNING/BREACH EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enterprise_quota_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL,
    org_id uuid,
    event_type text NOT NULL
        CHECK (event_type IN ('warning_80','warning_90','hard_cap','overage_start','overage_billing','reset')),
    quota_limit bigint NOT NULL,
    current_usage bigint NOT NULL,
    percentage_used numeric(5,2),
    plan_slug text,
    notified boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.enterprise_quota_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_quota_events" ON public.enterprise_quota_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "own_quota_events" ON public.enterprise_quota_events FOR SELECT USING (customer_id = auth.uid());

-- ============================================================
-- 7. HONEYTOKEN ROWS FOR LEAK DETECTION
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enterprise_honeytokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id uuid REFERENCES public.enterprise_api_keys(id),
    customer_id uuid NOT NULL,
    token_value text NOT NULL UNIQUE,
    token_type text DEFAULT 'corridor_id',
    embedded_in_response_at timestamptz DEFAULT now(),
    detected_leak_at timestamptz,
    leak_source text,
    active boolean DEFAULT true
);

ALTER TABLE public.enterprise_honeytokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_honeytokens" ON public.enterprise_honeytokens FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 8. INCREMENT EXPORT ROWS RPC (fixes fallback in middleware)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_export_rows(
    p_api_key_id uuid,
    p_rows integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.enterprise_rate_limit_state
    SET rows_exported_this_month = rows_exported_this_month + p_rows
    WHERE api_key_id = p_api_key_id;
END;
$$;

-- ============================================================
-- 9. DAILY ROLLUP FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.rollup_enterprise_usage(p_date date DEFAULT CURRENT_DATE - 1)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count integer := 0;
BEGIN
    INSERT INTO public.enterprise_usage_rollups (
        org_id, customer_id, rollup_date, total_requests, total_rows_served,
        total_compute_units, unique_endpoints, error_count
    )
    SELECT
        e.org_id,
        e.customer_id,
        p_date,
        COUNT(*)::bigint,
        COALESCE(SUM(e.rows_returned), 0)::bigint,
        COALESCE(SUM(e.compute_cost_units), 0),
        COUNT(DISTINCT e.endpoint),
        COUNT(*) FILTER (WHERE e.status_code >= 400)
    FROM public.enterprise_usage_events e
    WHERE e.created_at::date = p_date
    GROUP BY e.org_id, e.customer_id
    ON CONFLICT (customer_id, rollup_date) DO UPDATE SET
        total_requests = EXCLUDED.total_requests,
        total_rows_served = EXCLUDED.total_rows_served,
        total_compute_units = EXCLUDED.total_compute_units,
        unique_endpoints = EXCLUDED.unique_endpoints,
        error_count = EXCLUDED.error_count;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Calculate overage for each customer
    UPDATE public.enterprise_usage_rollups r
    SET
        quota_rows = COALESCE(pm.monthly_rows, 0),
        plan_slug = pm.plan_slug,
        overage_rows = GREATEST(0,
            (SELECT COALESCE(SUM(r2.total_rows_served), 0)
             FROM public.enterprise_usage_rollups r2
             WHERE r2.customer_id = r.customer_id
               AND date_trunc('month', r2.rollup_date) = date_trunc('month', p_date))
            - COALESCE(pm.monthly_rows, 0)
        ),
        estimated_value_cents = CASE
            WHEN pm.monthly_rows > 0 AND
                 (SELECT COALESCE(SUM(r2.total_rows_served), 0)
                  FROM public.enterprise_usage_rollups r2
                  WHERE r2.customer_id = r.customer_id
                    AND date_trunc('month', r2.rollup_date) = date_trunc('month', p_date))
                 > pm.monthly_rows
            THEN (GREATEST(0,
                (SELECT COALESCE(SUM(r2.total_rows_served), 0)
                 FROM public.enterprise_usage_rollups r2
                 WHERE r2.customer_id = r.customer_id
                   AND date_trunc('month', r2.rollup_date) = date_trunc('month', p_date))
                - pm.monthly_rows) / NULLIF(pm.overage_unit_rows, 0)) * pm.overage_unit_price_cents
            ELSE 0
        END
    FROM public.enterprise_api_keys ak
    JOIN public.enterprise_plan_matrix pm ON pm.tier = ak.tier
    WHERE r.rollup_date = p_date
      AND ak.customer_id = r.customer_id
      AND ak.active = true;

    RETURN v_count;
END;
$$;

-- ============================================================
-- 10. QUOTA CHECK + WARNING FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_enterprise_quota(
    p_customer_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan record;
    v_usage bigint;
    v_pct numeric;
    v_result jsonb;
BEGIN
    -- Get customer's plan
    SELECT pm.* INTO v_plan
    FROM public.enterprise_api_keys ak
    JOIN public.enterprise_plan_matrix pm ON pm.tier = ak.tier
    WHERE ak.customer_id = p_customer_id AND ak.active = true
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'no_active_plan');
    END IF;

    -- Unlimited plan
    IF v_plan.monthly_rows < 0 THEN
        RETURN jsonb_build_object(
            'plan', v_plan.plan_slug,
            'quota', -1,
            'used', 0,
            'pct', 0,
            'status', 'unlimited'
        );
    END IF;

    -- Sum usage this month
    SELECT COALESCE(SUM(total_rows_served), 0) INTO v_usage
    FROM public.enterprise_usage_rollups
    WHERE customer_id = p_customer_id
      AND date_trunc('month', rollup_date) = date_trunc('month', CURRENT_DATE);

    v_pct := ROUND((v_usage::numeric / NULLIF(v_plan.monthly_rows, 0)) * 100, 2);

    -- Emit quota events
    IF v_pct >= 100 THEN
        INSERT INTO public.enterprise_quota_events (customer_id, event_type, quota_limit, current_usage, percentage_used, plan_slug)
        VALUES (p_customer_id, 'hard_cap', v_plan.monthly_rows, v_usage, v_pct, v_plan.plan_slug)
        ON CONFLICT DO NOTHING;
    ELSIF v_pct >= 90 THEN
        INSERT INTO public.enterprise_quota_events (customer_id, event_type, quota_limit, current_usage, percentage_used, plan_slug)
        VALUES (p_customer_id, 'warning_90', v_plan.monthly_rows, v_usage, v_pct, v_plan.plan_slug)
        ON CONFLICT DO NOTHING;
    ELSIF v_pct >= 80 THEN
        INSERT INTO public.enterprise_quota_events (customer_id, event_type, quota_limit, current_usage, percentage_used, plan_slug)
        VALUES (p_customer_id, 'warning_80', v_plan.monthly_rows, v_usage, v_pct, v_plan.plan_slug)
        ON CONFLICT DO NOTHING;
    END IF;

    v_result := jsonb_build_object(
        'plan', v_plan.plan_slug,
        'quota', v_plan.monthly_rows,
        'used', v_usage,
        'remaining', GREATEST(0, v_plan.monthly_rows - v_usage),
        'pct', v_pct,
        'status', CASE
            WHEN v_pct >= 100 THEN 'exceeded'
            WHEN v_pct >= 90 THEN 'critical'
            WHEN v_pct >= 80 THEN 'warning'
            ELSE 'ok'
        END,
        'overage_unit_price_cents', v_plan.overage_unit_price_cents,
        'overage_unit_rows', v_plan.overage_unit_rows
    );

    RETURN v_result;
END;
$$;

-- ============================================================
-- 11. MONTHLY RATE LIMIT RESET
-- ============================================================
CREATE OR REPLACE FUNCTION public.reset_monthly_enterprise_counters()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count integer;
BEGIN
    UPDATE public.enterprise_rate_limit_state
    SET rows_exported_this_month = 0,
        month_start = CURRENT_DATE
    WHERE month_start < date_trunc('month', CURRENT_DATE);

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Log reset events
    INSERT INTO public.enterprise_quota_events (customer_id, event_type, quota_limit, current_usage, percentage_used)
    SELECT ak.customer_id, 'reset', ak.export_limit_rows_month, 0, 0
    FROM public.enterprise_api_keys ak
    WHERE ak.active = true;

    RETURN v_count;
END;
$$;
