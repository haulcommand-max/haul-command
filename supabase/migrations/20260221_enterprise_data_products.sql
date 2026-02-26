-- Migration: 20260221_enterprise_data_products.sql
-- Enterprise Data Product Packaging — API keys, licensing, export audit, redaction

-- ============================================================
-- 1. API KEY MANAGEMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enterprise_api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL,
    customer_name text NOT NULL,
    api_key_hash text NOT NULL UNIQUE,
    api_key_prefix text NOT NULL,
    tier text NOT NULL CHECK (tier IN ('insight_starter','pro_intelligence','enterprise_signal','data_licensing_bulk')),
    active boolean DEFAULT true,
    rate_limit_rpm integer NOT NULL DEFAULT 30,
    export_limit_rows_month integer DEFAULT 25000,
    effective_start timestamptz DEFAULT now(),
    effective_end timestamptz,
    last_used_at timestamptz,
    request_count_total bigint DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_key_hash ON public.enterprise_api_keys(api_key_hash);
CREATE INDEX IF NOT EXISTS idx_api_key_customer ON public.enterprise_api_keys(customer_id);

-- ============================================================
-- 2. EXPORT AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enterprise_export_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id uuid REFERENCES public.enterprise_api_keys(id),
    customer_id uuid NOT NULL,
    endpoint text NOT NULL,
    query_params jsonb DEFAULT '{}',
    rows_returned integer DEFAULT 0,
    response_time_ms integer,
    watermark_hash text,
    ip_address_hash text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_export_audit_customer ON public.enterprise_export_audit(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_audit_endpoint ON public.enterprise_export_audit(endpoint, created_at DESC);

-- ============================================================
-- 3. RATE LIMIT STATE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enterprise_rate_limit_state (
    api_key_id uuid PRIMARY KEY REFERENCES public.enterprise_api_keys(id),
    window_start timestamptz DEFAULT now(),
    request_count integer DEFAULT 0,
    rows_exported_this_month integer DEFAULT 0,
    month_start date DEFAULT CURRENT_DATE,
    throttled_until timestamptz,
    abuse_flags integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 4. DATA PRODUCT CATALOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enterprise_product_catalog (
    product_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name text NOT NULL UNIQUE,
    tier_required text NOT NULL,
    description text,
    endpoints text[] DEFAULT '{}',
    data_fields text[] DEFAULT '{}',
    update_frequency text DEFAULT 'daily',
    redaction_level text DEFAULT 'high' CHECK (redaction_level IN ('high','medium','low_aggregated_only','contract_defined')),
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Seed product bundles
INSERT INTO public.enterprise_product_catalog (product_name, tier_required, description, endpoints, data_fields, update_frequency, redaction_level) VALUES
    ('operations_optimizer', 'pro_intelligence', 'Corridor liquidity + scarcity + fill probability', '{/corridors/liquidity,/corridors/scarcity,/fill/probability}', '{liquidity_score,scarcity_index,p_fill_60m,time_to_fill_benchmarks}', 'hourly', 'medium'),
    ('pricing_intelligence', 'pro_intelligence', 'Rate benchmarks + volatility + surge', '{/rates/benchmark,/corridors/scarcity}', '{rate_per_mile_percentiles,volatility_index,surge_indicator}', 'hourly', 'medium'),
    ('risk_command', 'enterprise_signal', 'Broker risk + route risk + dispute probability', '{/brokers/risk}', '{broker_risk_band,route_risk_indices,dispute_probability}', 'daily', 'low_aggregated_only'),
    ('enterprise_full_signal', 'enterprise_signal', 'All intelligence + historical + predictive', '{/corridors/liquidity,/corridors/scarcity,/fill/probability,/rates/benchmark,/brokers/risk}', '{all_fields}', 'near_realtime', 'low_aggregated_only')
ON CONFLICT (product_name) DO NOTHING;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.enterprise_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_export_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_rate_limit_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_product_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_api_keys" ON public.enterprise_api_keys FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "own_api_keys" ON public.enterprise_api_keys FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "service_export_audit" ON public.enterprise_export_audit FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "own_export_audit" ON public.enterprise_export_audit FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "service_rate_limit" ON public.enterprise_rate_limit_state FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "public_read_catalog" ON public.enterprise_product_catalog FOR SELECT USING (active = true);
CREATE POLICY "service_write_catalog" ON public.enterprise_product_catalog FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- API KEY VALIDATION + RATE LIMIT CHECK RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_enterprise_api_key(p_api_key_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_key record;
    v_rate record;
    v_allowed boolean := true;
    v_reason text;
BEGIN
    SELECT * INTO v_key FROM public.enterprise_api_keys WHERE api_key_hash = p_api_key_hash AND active = true;
    IF NOT FOUND THEN RETURN jsonb_build_object('valid', false, 'reason', 'invalid_key'); END IF;
    IF v_key.effective_end IS NOT NULL AND now() > v_key.effective_end THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'key_expired');
    END IF;

    -- Check rate limit
    SELECT * INTO v_rate FROM public.enterprise_rate_limit_state WHERE api_key_id = v_key.id;
    IF FOUND THEN
        IF v_rate.throttled_until IS NOT NULL AND now() < v_rate.throttled_until THEN
            RETURN jsonb_build_object('valid', false, 'reason', 'rate_limited', 'retry_after', v_rate.throttled_until);
        END IF;
        -- Check RPM (reset window every minute)
        IF v_rate.window_start < now() - interval '1 minute' THEN
            UPDATE public.enterprise_rate_limit_state SET window_start = now(), request_count = 1 WHERE api_key_id = v_key.id;
        ELSE
            IF v_rate.request_count >= v_key.rate_limit_rpm THEN
                UPDATE public.enterprise_rate_limit_state SET throttled_until = now() + interval '60 seconds', abuse_flags = abuse_flags + 1 WHERE api_key_id = v_key.id;
                RETURN jsonb_build_object('valid', false, 'reason', 'rate_limited', 'retry_after', now() + interval '60 seconds');
            END IF;
            UPDATE public.enterprise_rate_limit_state SET request_count = request_count + 1 WHERE api_key_id = v_key.id;
        END IF;
        -- Check monthly export limit
        IF v_key.export_limit_rows_month IS NOT NULL AND v_rate.rows_exported_this_month >= v_key.export_limit_rows_month THEN
            RETURN jsonb_build_object('valid', false, 'reason', 'monthly_export_limit_reached');
        END IF;
    ELSE
        INSERT INTO public.enterprise_rate_limit_state (api_key_id, request_count) VALUES (v_key.id, 1);
    END IF;

    UPDATE public.enterprise_api_keys SET last_used_at = now(), request_count_total = request_count_total + 1 WHERE id = v_key.id;

    RETURN jsonb_build_object('valid', true, 'tier', v_key.tier, 'customer_id', v_key.customer_id, 'rate_limit_rpm', v_key.rate_limit_rpm);
END;
$$;
