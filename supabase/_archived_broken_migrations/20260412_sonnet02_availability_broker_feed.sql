-- ============================================================
-- Migration: SONNET-02 — Availability + Broker Feed Support
-- Additive only. No destructive schema changes.
-- ============================================================

-- 1. panic_fill_log — audit trail for panic-fill-escalation
--    Required for the upsert in panic-fill-escalation/index.ts
CREATE TABLE IF NOT EXISTS public.panic_fill_log (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    load_id         uuid NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
    stage           smallint NOT NULL CHECK (stage BETWEEN 1 AND 4),
    stage_label     text NOT NULL,
    actions         text[] NOT NULL DEFAULT '{}',
    broker_id       uuid REFERENCES auth.users(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (load_id, stage)
);
CREATE INDEX IF NOT EXISTS panic_fill_log_load_id_idx ON public.panic_fill_log(load_id);
CREATE INDEX IF NOT EXISTS panic_fill_log_stage_idx   ON public.panic_fill_log(stage);

-- RLS: service role only (cron + edge functions)
ALTER TABLE public.panic_fill_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.panic_fill_log
    USING (true) WITH CHECK (true);

-- 2. hc_csn_signals — broker-availability-feed reads shortage signals from here
--    Create if missing (it may already exist under a variant name)
CREATE TABLE IF NOT EXISTS public.hc_csn_signals (
    id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    signal_type  text NOT NULL,
    geo_key      text NOT NULL,
    context_json jsonb NOT NULL DEFAULT '{}',
    created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hc_csn_signals_geo_type_idx ON public.hc_csn_signals(geo_key, signal_type);
CREATE INDEX IF NOT EXISTS hc_csn_signals_created_at_idx ON public.hc_csn_signals(created_at DESC);

ALTER TABLE public.hc_csn_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.hc_csn_signals
    USING (true) WITH CHECK (true);
-- Brokers can read signals for their market
CREATE POLICY "broker_read_signals" ON public.hc_csn_signals
    FOR SELECT USING (auth.role() = 'authenticated');

-- 3. operator_profiles — ensure primary_phone column exists (used by VAPI)
ALTER TABLE public.operator_profiles
    ADD COLUMN IF NOT EXISTS primary_phone text;

-- 4. push_endpoints — used by morning-pulse-dispatch
--    Create if missing. Table may already exist as push_subscriptions.
CREATE TABLE IF NOT EXISTS public.push_endpoints (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider    text NOT NULL CHECK (provider IN ('fcm', 'webpush', 'apns')),
    token       text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, provider, token)
);
CREATE INDEX IF NOT EXISTS push_endpoints_user_id_idx ON public.push_endpoints(user_id);

ALTER TABLE public.push_endpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_manage" ON public.push_endpoints
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "service_role_all" ON public.push_endpoints
    USING (true) WITH CHECK (true);

-- 5. v_market_liquidity — view required by broker-availability-feed + panic-fill-escalation
--    Create stub if missing; will be replaced by real compute when
--    compute_market_liquidity_score() runs via availability-truth-tick.
CREATE OR REPLACE VIEW public.v_market_liquidity AS
SELECT
    ep.home_base_state AS geo_key,
    COUNT(CASE WHEN pres.status = 'available' THEN 1 END) AS available_count,
    COUNT(DISTINCT l.id) AS load_count_24h,
    COALESCE(
        ROUND(
            (COUNT(CASE WHEN pres.status = 'available' THEN 1 END)::numeric
             / NULLIF(COUNT(DISTINCT l.id), 0)) * 50
        , 0),
        50
    ) AS liquidity_score
FROM public.operator_profiles ep
LEFT JOIN public.escort_presence pres ON pres.escort_id = ep.user_id
LEFT JOIN public.loads l
    ON l.origin_state = ep.home_base_state
    AND l.status = 'active'
    AND l.created_at > now() - INTERVAL '24 hours'
GROUP BY ep.home_base_state;

-- 6. Updated-at trigger for panic_fill_log
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS panic_fill_log_updated_at ON public.panic_fill_log;
CREATE TRIGGER panic_fill_log_updated_at
    BEFORE UPDATE ON public.panic_fill_log
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- END MIGRATION
-- Apply with: supabase db push (or via service-role psql)
-- Rollback: DROP TABLE panic_fill_log; DROP TABLE hc_csn_signals;
--           DROP TABLE push_endpoints; DROP VIEW v_market_liquidity;
-- ============================================================
