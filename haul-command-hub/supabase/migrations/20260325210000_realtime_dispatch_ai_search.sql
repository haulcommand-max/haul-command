-- Phase 19: Real-Time Dispatch + AI Search Infrastructure
-- Supports: WebSocket dispatch events, regulations embedding search, scraper audit trail

-- 1. Dispatch Events Log (audit trail for SSE/realtime events)
CREATE TABLE IF NOT EXISTS public.hc_dispatch_events (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    event_id TEXT UNIQUE,
    payload JSONB DEFAULT '{}'::jsonb,
    region_code TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_events_type ON public.hc_dispatch_events(event_type);
CREATE INDEX IF NOT EXISTS idx_dispatch_events_region ON public.hc_dispatch_events(region_code);
CREATE INDEX IF NOT EXISTS idx_dispatch_events_created ON public.hc_dispatch_events(created_at DESC);

-- RLS
ALTER TABLE public.hc_dispatch_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access dispatch events" ON public.hc_dispatch_events
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Authenticated users can read dispatch events" ON public.hc_dispatch_events
    FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Payment Log (Stripe checkout audit trail)
CREATE TABLE IF NOT EXISTS public.hc_payment_log (
    id BIGSERIAL PRIMARY KEY,
    job_id TEXT,
    checkout_session_id TEXT,
    region_code TEXT,
    base_price_usd NUMERIC(10,2),
    surge_multiplier NUMERIC(4,2) DEFAULT 1.00,
    final_price_usd NUMERIC(10,2),
    platform_fee_usd NUMERIC(10,2),
    provider_payout_usd NUMERIC(10,2),
    escort_stripe_account TEXT,
    status TEXT DEFAULT 'checkout_created',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_log_job ON public.hc_payment_log(job_id);
CREATE INDEX IF NOT EXISTS idx_payment_log_session ON public.hc_payment_log(checkout_session_id);

-- RLS
ALTER TABLE public.hc_payment_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access payment log" ON public.hc_payment_log
    FOR ALL USING (auth.role() = 'service_role');

-- 3. Regulations Embedding Search Function (pgvector cosine similarity)
CREATE OR REPLACE FUNCTION match_regulations (
    query_embedding vector(768),
    match_threshold float DEFAULT 0.6,
    match_count int DEFAULT 20,
    country_filter text DEFAULT NULL
)
RETURNS TABLE (
    id bigint,
    title text,
    requirement_name text,
    requirement_text text,
    description text,
    country_code text,
    category text,
    similarity float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        r.id,
        r.title,
        r.requirement_name,
        r.requirement_text,
        r.description,
        r.country_code,
        r.category,
        1 - (r.embedding <=> query_embedding) AS similarity
    FROM public.hc_regulations_global r
    WHERE
        r.embedding IS NOT NULL
        AND 1 - (r.embedding <=> query_embedding) > match_threshold
        AND (country_filter IS NULL OR r.country_code = country_filter)
    ORDER BY r.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- 4. Add missing columns to hc_market_surge if not present
ALTER TABLE public.hc_market_surge ADD COLUMN IF NOT EXISTS active_loads INTEGER DEFAULT 0;
ALTER TABLE public.hc_market_surge ADD COLUMN IF NOT EXISTS available_escorts INTEGER DEFAULT 0;
ALTER TABLE public.hc_market_surge ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. Operator location tracking (GPS pings from mobile app)
CREATE TABLE IF NOT EXISTS public.hc_operator_locations (
    id BIGSERIAL PRIMARY KEY,
    operator_id UUID NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    heading REAL,
    speed_mph REAL,
    battery_level SMALLINT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operator_locations_operator ON public.hc_operator_locations(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_locations_created ON public.hc_operator_locations(created_at DESC);

-- Only keep latest 1000 pings per operator (partition/cleanup via cron)
ALTER TABLE public.hc_operator_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators can insert own location" ON public.hc_operator_locations
    FOR INSERT WITH CHECK (auth.uid() = operator_id);
CREATE POLICY "Service role full access locations" ON public.hc_operator_locations
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Authenticated can read locations" ON public.hc_operator_locations
    FOR SELECT USING (auth.role() = 'authenticated');
