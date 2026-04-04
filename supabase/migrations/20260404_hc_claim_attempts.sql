-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: hc_claim_attempts — Rate-limit table for operator claim flow
--
-- Purpose:
--   Prevents brute-force OTP attacks on the claim funnel.
--   Tracks claim attempts per email/phone, blocks after 5/hour.
--
-- Required by: app/api/identity/claim/route.ts (R2 security fix)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_claim_attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id     UUID REFERENCES public.hc_global_operators(id) ON DELETE CASCADE,
    contact         TEXT NOT NULL,            -- lowercased email or phone
    claim_method    TEXT NOT NULL,            -- 'email' | 'sms'
    attempted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for rate-limit query (contact + attempted_at)
CREATE INDEX IF NOT EXISTS idx_hc_claim_attempts_contact_time
    ON public.hc_claim_attempts (contact, attempted_at);

CREATE INDEX IF NOT EXISTS idx_hc_claim_attempts_operator
    ON public.hc_claim_attempts (operator_id);

-- Auto-cleanup: purge attempts older than 7 days to avoid table bloat
-- Wire to pg_cron if available, otherwise run manually:
-- DELETE FROM hc_claim_attempts WHERE attempted_at < NOW() - INTERVAL '7 days';

-- Add claimed_at column to hc_global_operators (tracks when profile was successfully claimed)
ALTER TABLE public.hc_global_operators
    ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE public.hc_claim_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to claim_attempts"
    ON public.hc_claim_attempts
    FOR ALL
    USING (auth.role() = 'service_role');

-- Verify:
-- SELECT * FROM hc_claim_attempts ORDER BY attempted_at DESC LIMIT 5;
