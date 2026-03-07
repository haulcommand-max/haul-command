-- ================================================================
-- Social Gravity Engine v2 — Database Migration
-- Tables: watchlist, watchlist_events, intent_signals,
--         broker_confidence_cache, corridor_forecasts
-- ================================================================

-- ── 1. Watchlist ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.watchlist (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    watch_type  TEXT NOT NULL CHECK (watch_type IN ('corridor','operator','broker','equipment_type')),
    target_id   TEXT NOT NULL,
    target_label TEXT NOT NULL DEFAULT '',
    digest_mode TEXT NOT NULL DEFAULT 'daily' CHECK (digest_mode IN ('realtime','daily','weekly')),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    metadata    JSONB DEFAULT '{}',
    trigger_count INTEGER NOT NULL DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(user_id, watch_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user
    ON public.watchlist(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_watchlist_target
    ON public.watchlist(watch_type, target_id) WHERE is_active = true;

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY watchlist_user_read ON public.watchlist
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY watchlist_user_write ON public.watchlist
    FOR ALL USING (auth.uid() = user_id);

-- ── 2. Watchlist Events ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.watchlist_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watch_id    UUID NOT NULL REFERENCES public.watchlist(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    watch_type  TEXT NOT NULL,
    target_id   TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    title       TEXT NOT NULL,
    body        TEXT NOT NULL,
    data        JSONB DEFAULT '{}',
    priority    TEXT NOT NULL DEFAULT 'normal',
    digest_mode TEXT NOT NULL DEFAULT 'daily',
    delivered   BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_watchlist_events_user_digest
    ON public.watchlist_events(user_id, digest_mode) WHERE delivered = false;
CREATE INDEX IF NOT EXISTS idx_watchlist_events_created
    ON public.watchlist_events(created_at DESC);

ALTER TABLE public.watchlist_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY watchlist_events_user_read ON public.watchlist_events
    FOR SELECT USING (auth.uid() = user_id);

-- ── 3. Intent Signals (AdGrid Intent Harvest Layer) ──────────────
CREATE TABLE IF NOT EXISTS public.intent_signals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL CHECK (signal_type IN (
        'repeated_corridor_view','availability_scout',
        'profile_view_no_book','route_search_repeat','rate_check'
    )),
    target_id   TEXT NOT NULL,
    count_24h   INTEGER NOT NULL DEFAULT 1,
    first_seen  TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intent_signals_target
    ON public.intent_signals(target_id, last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_intent_signals_user
    ON public.intent_signals(user_id, signal_type, target_id);

ALTER TABLE public.intent_signals ENABLE ROW LEVEL SECURITY;

-- Intent signals are system-written, read by admin/service only
CREATE POLICY intent_signals_service_all ON public.intent_signals
    FOR ALL USING (true);

-- ── 4. Broker Confidence Cache ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.broker_confidence_cache (
    operator_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    confidence_tier TEXT NOT NULL DEFAULT 'unknown',
    confidence_score INTEGER NOT NULL DEFAULT 0,
    booking_probability INTEGER NOT NULL DEFAULT 0,
    response_percentile TEXT NOT NULL DEFAULT 'below',
    median_response_minutes INTEGER NOT NULL DEFAULT 60,
    on_time_pct INTEGER NOT NULL DEFAULT 0,
    completed_jobs INTEGER NOT NULL DEFAULT 0,
    repeat_broker_count INTEGER NOT NULL DEFAULT 0,
    corridor_familiarity INTEGER NOT NULL DEFAULT 0,
    primary_corridor TEXT,
    summary TEXT NOT NULL DEFAULT '',
    last_computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.broker_confidence_cache ENABLE ROW LEVEL SECURITY;

-- Public read (brokers need to see this)
CREATE POLICY broker_confidence_public_read ON public.broker_confidence_cache
    FOR SELECT USING (true);

-- ── 5. Corridor Forecasts ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.corridor_forecasts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_key TEXT NOT NULL,
    corridor_name TEXT NOT NULL DEFAULT '',
    prediction  TEXT NOT NULL CHECK (prediction IN ('cooling','stable','warming','heating','surge_likely')),
    confidence  NUMERIC(3,2) NOT NULL DEFAULT 0.50,
    predicted_loads INTEGER NOT NULL DEFAULT 0,
    predicted_shortage BOOLEAN NOT NULL DEFAULT false,
    reasoning   TEXT[] DEFAULT '{}',
    copy        TEXT NOT NULL DEFAULT '',
    forecast_window TEXT NOT NULL DEFAULT '72h',
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '4 hours')
);

CREATE INDEX IF NOT EXISTS idx_corridor_forecasts_key
    ON public.corridor_forecasts(corridor_key, computed_at DESC);

ALTER TABLE public.corridor_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY corridor_forecasts_public_read ON public.corridor_forecasts
    FOR SELECT USING (true);

-- ── 6. Operator Stats (for Broker Confidence Engine) ─────────────
CREATE TABLE IF NOT EXISTS public.operator_stats (
    user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    median_response_minutes INTEGER DEFAULT 45,
    completed_jobs INTEGER DEFAULT 0,
    on_time_rate NUMERIC(3,2) DEFAULT 0.85,
    cancellation_rate NUMERIC(3,2) DEFAULT 0.05,
    acceptance_rate NUMERIC(3,2) DEFAULT 0.70,
    total_brokers INTEGER DEFAULT 0,
    repeat_brokers INTEGER DEFAULT 0,
    primary_corridor TEXT,
    corridor_jobs INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY operator_stats_public_read ON public.operator_stats
    FOR SELECT USING (true);
CREATE POLICY operator_stats_user_read ON public.operator_stats
    FOR SELECT USING (auth.uid() = user_id);

-- ── 7. RPC: Profile view counts for urgency engine ───────────────
CREATE OR REPLACE FUNCTION public.get_profile_view_counts_24h()
RETURNS TABLE(profile_user_id UUID, view_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT profile_user_id, COUNT(*) as view_count
    FROM public.profile_views
    WHERE created_at >= now() - interval '24 hours'
    GROUP BY profile_user_id
    HAVING COUNT(*) >= 3
    ORDER BY view_count DESC
    LIMIT 500;
$$;

-- ── 8. RPC: Broker stats for confidence engine ───────────────────
CREATE OR REPLACE FUNCTION public.get_broker_stats_for_operator(
    p_operator_id UUID
)
RETURNS TABLE(total_brokers BIGINT, repeat_brokers BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    WITH broker_jobs AS (
        SELECT broker_id, COUNT(*) as job_count
        FROM public.jobs
        WHERE operator_id = p_operator_id
        GROUP BY broker_id
    )
    SELECT
        COUNT(*)::BIGINT as total_brokers,
        COUNT(*) FILTER (WHERE job_count > 1)::BIGINT as repeat_brokers
    FROM broker_jobs;
$$;

-- ── 9. RPC: Corridor stats for confidence engine ─────────────────
CREATE OR REPLACE FUNCTION public.get_corridor_stats_for_operator(
    p_operator_id UUID,
    p_corridor TEXT DEFAULT NULL
)
RETURNS TABLE(primary_corridor TEXT, corridor_jobs BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT
        corridor_key as primary_corridor,
        COUNT(*)::BIGINT as corridor_jobs
    FROM public.jobs
    WHERE operator_id = p_operator_id
        AND (p_corridor IS NULL OR corridor_key = p_corridor)
    GROUP BY corridor_key
    ORDER BY COUNT(*) DESC
    LIMIT 1;
$$;

-- ── 10. TTL cleanup for expired signals ──────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_expired_intent_signals()
RETURNS void
LANGUAGE sql SECURITY DEFINER
AS $$
    DELETE FROM public.intent_signals
    WHERE last_seen < now() - interval '48 hours';

    DELETE FROM public.corridor_forecasts
    WHERE expires_at < now();
$$;
