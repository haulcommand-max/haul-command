-- Panic Fill Escalation Log
-- Tracks automated rescue interventions on slow-filling loads

CREATE TABLE IF NOT EXISTS public.panic_fill_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    load_id UUID NOT NULL,
    broker_id UUID,
    stage INT NOT NULL CHECK (stage BETWEEN 1 AND 4),
    stage_label TEXT NOT NULL,
    actions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),

    -- Prevent duplicate escalation entries per load+stage
    CONSTRAINT uq_panic_fill_load_stage UNIQUE (load_id, stage)
);

-- Index for fast lookups by load
CREATE INDEX IF NOT EXISTS idx_panic_fill_load ON public.panic_fill_log(load_id);
CREATE INDEX IF NOT EXISTS idx_panic_fill_created ON public.panic_fill_log(created_at DESC);

-- RLS: only service role can write (edge function), authenticated can read their own
ALTER TABLE public.panic_fill_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.panic_fill_log
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Brokers read own escalations" ON public.panic_fill_log
    FOR SELECT USING (broker_id = auth.uid());

-- Schedule panic fill check every 5 minutes
SELECT cron.schedule(
    'panic-fill-check-5min',
    '*/5 * * * *',
    $$SELECT net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/panic-fill-escalation',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    );$$
);

-- Ad click log (for AdSlot tracking)
CREATE TABLE IF NOT EXISTS public.ad_click_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    placement_id TEXT NOT NULL,
    clicked_at TIMESTAMPTZ DEFAULT now(),
    user_agent TEXT,
    referrer TEXT
);

CREATE INDEX IF NOT EXISTS idx_ad_clicks_placement ON public.ad_click_log(placement_id);
ALTER TABLE public.ad_click_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role ad clicks" ON public.ad_click_log
    FOR ALL USING (auth.role() = 'service_role');
