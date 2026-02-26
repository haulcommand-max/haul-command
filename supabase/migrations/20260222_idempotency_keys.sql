-- ============================================================
-- Migration: idempotency_keys
-- Source: SPEC.md §9 & SCHEMA.md §1.12
-- Purpose: Dedup table for all critical mutations (payments, compliance, referrals)
-- Key format: {operation}:{primary_id}:{secondary_id}:{version}
-- ============================================================

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key         TEXT PRIMARY KEY,
  -- Examples:
  --   preauth:{load_id}:{driver_id}:{broker_id}
  --   capture:{payment_intent_id}
  --   snapshot:{job_id}:{driver_id}
  --   referral:{referral_code}:{new_user_id}
  status      TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing','done','failed')),
  response    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Index for efficient expiry sweeps
CREATE INDEX IF NOT EXISTS ik_expires_idx
  ON public.idempotency_keys (expires_at);

-- Index for status queries (find stuck 'processing' keys)
CREATE INDEX IF NOT EXISTS ik_status_idx
  ON public.idempotency_keys (status)
  WHERE status = 'processing';

-- Row Level Security — service_role only (edge functions write; no client access)
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_only" ON public.idempotency_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Auto-purge function (called by pg_cron daily)
-- Removes expired keys to keep table lean
-- ============================================================
CREATE OR REPLACE FUNCTION public.purge_expired_idempotency_keys()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.idempotency_keys
  WHERE expires_at < NOW();
END;
$$;

COMMENT ON TABLE public.idempotency_keys IS
  'Dedup store for all critical mutations. Edge functions check this before executing any side-effectful operation. Purged daily by pg_cron.';

COMMENT ON COLUMN public.idempotency_keys.key IS
  'Format: {operation}:{primary_id}:{secondary_id}. E.g. preauth:load-uuid:driver-uuid:broker-uuid';

COMMENT ON COLUMN public.idempotency_keys.status IS
  'processing = in flight | done = completed (response cached) | failed = errored (may retry with new key)';
