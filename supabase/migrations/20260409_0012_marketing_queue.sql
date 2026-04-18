-- Migration: Omnichannel Marketing Queue
-- Captures system fallbacks (e.g., LiveKit hung up) and routes them into async SMS/Email sequences

CREATE TABLE IF NOT EXISTS public.marketing_campaign_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id TEXT NOT NULL,
    campaign_type TEXT NOT NULL, -- 'omnichannel_fallback', 'claim_reminder'
    trigger_reason TEXT, -- 'livekit_hangup', 'abandoned_cart'
    status TEXT DEFAULT 'queued', -- pending, queued, executing, completed, failed
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mcq_status_idx ON public.marketing_campaign_queue (status);

ALTER TABLE public.marketing_campaign_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY mcq_sr_policy ON public.marketing_campaign_queue FOR ALL TO service_role USING (true) WITH CHECK (true);
