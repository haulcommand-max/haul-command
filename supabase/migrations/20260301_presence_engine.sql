-- ================================================================
-- Presence Engine v1.0 — Database Migration
-- Tables: operator_presence, presence_audit_log
-- ================================================================

-- ── 1. Operator Presence (root signal table) ─────────────────────
CREATE TABLE IF NOT EXISTS public.operator_presence (
    operator_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    status            TEXT NOT NULL DEFAULT 'offline'
                      CHECK (status IN ('available_now','available_soon','on_job','recently_active','offline')),
    previous_status   TEXT NOT NULL DEFAULT 'offline',
    corridor_scope    TEXT,                     -- null = global
    available_soon_window TEXT,                 -- later_today, tomorrow, within_48h, custom
    custom_eta        TIMESTAMPTZ,
    last_signal_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    status_set_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_signal     TEXT NOT NULL DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_presence_status
    ON public.operator_presence(status) WHERE status != 'offline';
CREATE INDEX IF NOT EXISTS idx_presence_stale
    ON public.operator_presence(last_signal_at) WHERE status != 'offline';

ALTER TABLE public.operator_presence ENABLE ROW LEVEL SECURITY;

-- Public read (brokers + operators need this)
CREATE POLICY presence_public_read ON public.operator_presence
    FOR SELECT USING (true);
-- Operators can update own
CREATE POLICY presence_owner_update ON public.operator_presence
    FOR UPDATE USING (auth.uid() = operator_id);

-- ── 2. Presence Audit Log ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.presence_audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    previous_status TEXT NOT NULL,
    new_status      TEXT NOT NULL,
    timestamp_utc   TIMESTAMPTZ NOT NULL DEFAULT now(),
    corridor_scope  TEXT,
    source_signal   TEXT NOT NULL DEFAULT 'unknown',
    freshness_minutes INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_presence_audit_operator
    ON public.presence_audit_log(operator_id, timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_presence_audit_source
    ON public.presence_audit_log(source_signal, timestamp_utc DESC);

ALTER TABLE public.presence_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY presence_audit_owner_read ON public.presence_audit_log
    FOR SELECT USING (auth.uid() = operator_id);

-- ── 3. Momentum points increment RPC ────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_momentum_points(
    p_user_id UUID,
    p_points INTEGER,
    p_source TEXT
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.operator_momentum
    SET total_score = GREATEST(0, total_score + p_points),
        updated_at = now()
    WHERE user_id = p_user_id;

    -- If no row updated, insert new
    IF NOT FOUND THEN
        INSERT INTO public.operator_momentum (user_id, total_score, band)
        VALUES (p_user_id, GREATEST(0, p_points), 'new')
        ON CONFLICT (user_id) DO UPDATE
        SET total_score = GREATEST(0, operator_momentum.total_score + p_points);
    END IF;
END;
$$;
