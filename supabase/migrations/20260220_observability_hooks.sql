-- 20260220_observability_hooks.sql
-- Lightweight edge function telemetry before moving to full OpenTelemetry/Sentry overhead

CREATE TABLE IF NOT EXISTS public.api_request_log (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    edge_fn text NOT NULL, -- e.g. 'panic-fill-escalation', 'morning-pulse'
    status integer NOT NULL, -- HTTP status code
    latency_ms integer NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- initiator if any
    error_message text,
    created_at timestamptz DEFAULT now()
);

-- Index for searching recent edge function errors
CREATE INDEX IF NOT EXISTS idx_api_request_log_errors ON public.api_request_log(created_at DESC) WHERE status >= 400;

-- Optionally, we could schedule pg_cron to delete logs older than 7 days
-- SELECT cron.schedule('cleanup-api-logs', '0 0 * * *', $$ DELETE FROM public.api_request_log WHERE created_at < now() - INTERVAL '7 days' $$);

-- For security, only allow service role to insert or select
ALTER TABLE public.api_request_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on api logs" ON public.api_request_log 
    FOR ALL TO service_role USING (true) WITH CHECK (true);
