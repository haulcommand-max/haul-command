-- Notification events audit table
-- Tracks every notification emitted by the Novu brain
-- Required by lib/novu/emitter.ts logEvent()

CREATE TABLE IF NOT EXISTS public.hc_notification_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'dry_run', 'deduplicated', 'failed')),
    transaction_id TEXT DEFAULT '',
    payload TEXT DEFAULT '{}',
    error_message TEXT,
    emitted_at TIMESTAMPTZ DEFAULT now()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_notification_events_recipient
    ON public.hc_notification_events(recipient_id, emitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_events_idem
    ON public.hc_notification_events(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_notification_events_status
    ON public.hc_notification_events(status, emitted_at DESC)
    WHERE status = 'failed';
CREATE INDEX IF NOT EXISTS idx_notification_events_event
    ON public.hc_notification_events(event_name, emitted_at DESC);

-- RLS
ALTER TABLE public.hc_notification_events ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (backend-only)
-- No public read policies — admin only via service-role
