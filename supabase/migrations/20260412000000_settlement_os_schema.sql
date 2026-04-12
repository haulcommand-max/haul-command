-- =====================================================================
-- OPUS-02: SETTLEMENT OS — ADDITIVE SCHEMA HARDENING
-- Schema-verified against types/supabase.ts before writing.
-- =====================================================================

-- ─────────────────────────────────────────────────
-- 0. hc_escrow_disputes — NEW canonical dispute table (replaces legacy hc_disputes)
-- Supports UUID-based loads and escrows.
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_escrow_disputes (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_id         UUID NOT NULL REFERENCES public.hc_escrow(id) ON DELETE CASCADE,
    load_id           UUID NOT NULL REFERENCES public.hc_loads(id) ON DELETE CASCADE,
    opened_by         UUID NOT NULL REFERENCES auth.users(id),
    reason            TEXT NOT NULL,
    status            TEXT NOT NULL DEFAULT 'OPEN',
    resolution        TEXT,
    evidence_payload  JSONB DEFAULT '{}'::jsonb,
    deadline_at       TIMESTAMPTZ NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hc_escrow_disputes_escrow ON public.hc_escrow_disputes(escrow_id);
CREATE INDEX IF NOT EXISTS idx_hc_escrow_disputes_load   ON public.hc_escrow_disputes(load_id);

ALTER TABLE public.hc_escrow_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access_disputes"
    ON public.hc_escrow_disputes FOR ALL
    USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────
-- 1. hc_call_billing — NEW table for LiveKit per-minute billing
-- Feeds from /api/webhooks/livekit room_finished handler
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_call_billing (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_name         TEXT NOT NULL,
    duration_seconds  INTEGER,
    billable_minutes  INTEGER NOT NULL DEFAULT 0,
    amount_cents      INTEGER NOT NULL DEFAULT 0,
    status            TEXT NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'BILLED', 'FAILED', 'WAIVED')),
    billed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    charged_at        TIMESTAMPTZ,
    failure_reason    TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hc_call_billing_status ON public.hc_call_billing (status, billed_at);
CREATE INDEX IF NOT EXISTS idx_hc_call_billing_room   ON public.hc_call_billing (room_name);

ALTER TABLE public.hc_call_billing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access_call_billing"
    ON public.hc_call_billing FOR ALL
    USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────
-- 2. hc_escrow — document DISPUTED status
-- (status col is TEXT — no enum migration needed)
-- ─────────────────────────────────────────────────
COMMENT ON COLUMN public.hc_escrow.status IS
    'Valid states: PENDING_FUNDS | held | funds_secured | DISPUTED | FROZEN | SETTLED | refunded_network_recovery';


-- ─────────────────────────────────────────────────
-- 3. hc_disputes — index for admin review queue
-- Table exists; just add missing index
-- ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hc_disputes_status
    ON public.hc_disputes (status, created_at DESC);


-- ─────────────────────────────────────────────────
-- 4. Auto-update trigger for hc_escrow.updated_at
-- ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION hc_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hc_escrow_updated_at ON public.hc_escrow;
CREATE TRIGGER hc_escrow_updated_at
    BEFORE UPDATE ON public.hc_escrow
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

DROP TRIGGER IF EXISTS hc_escrow_disputes_updated_at ON public.hc_escrow_disputes;
CREATE TRIGGER hc_escrow_disputes_updated_at
    BEFORE UPDATE ON public.hc_escrow_disputes
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();
