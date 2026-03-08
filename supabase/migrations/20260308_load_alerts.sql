-- ════════════════════════════════════════════════════════════
-- Load Alert Ingestion Table
-- Stores parsed load board demand signals
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_load_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id UUID,
    company_name TEXT NOT NULL,
    phone TEXT,
    origin_city TEXT,
    origin_state TEXT,
    destination_city TEXT,
    destination_state TEXT,
    corridor TEXT,
    position_type TEXT CHECK (position_type IN ('pilot', 'chase', 'lead', 'unknown')),
    rate_amount NUMERIC(10,2),
    dedup_key TEXT UNIQUE,
    source TEXT DEFAULT 'load_board_alert',
    raw_text TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matched', 'expired', 'canceled')),
    matched_operator_id UUID REFERENCES public.operators(id),
    matched_at TIMESTAMPTZ,
    ingested_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '72 hours')
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_load_alerts_corridor ON public.hc_load_alerts(corridor) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_load_alerts_origin ON public.hc_load_alerts(origin_state) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_load_alerts_dest ON public.hc_load_alerts(destination_state) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_load_alerts_position ON public.hc_load_alerts(position_type) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_load_alerts_batch ON public.hc_load_alerts(batch_id);
CREATE INDEX IF NOT EXISTS idx_load_alerts_phone ON public.hc_load_alerts(phone);
CREATE INDEX IF NOT EXISTS idx_load_alerts_expires ON public.hc_load_alerts(expires_at) WHERE status = 'active';

-- RLS
ALTER TABLE public.hc_load_alerts ENABLE ROW LEVEL SECURITY;

-- Authenticated users can see active load alerts
CREATE POLICY read_active_loads ON public.hc_load_alerts
    FOR SELECT TO authenticated
    USING (status = 'active' AND expires_at > now());

-- Auto-expire old alerts (runs via pg_cron or scheduled edge function)
-- UPDATE hc_load_alerts SET status = 'expired' WHERE expires_at < now() AND status = 'active';
