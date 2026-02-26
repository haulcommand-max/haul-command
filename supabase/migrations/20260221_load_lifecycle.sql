-- ══════════════════════════════════════════════════════════════
-- Migration: load_lifecycle
-- Adds status progression to loads and trust fields to brokers.
-- Jobs never vanish — they move through visible lifecycle states.
-- ══════════════════════════════════════════════════════════════

-- 1) Load status lifecycle
ALTER TABLE public.loads
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','pending_hold','booked','in_progress','completed','cancelled')),
  ADD COLUMN IF NOT EXISTS booked_at               timestamptz,
  ADD COLUMN IF NOT EXISTS pending_hold_expires_at  timestamptz,
  ADD COLUMN IF NOT EXISTS booked_by_user_id        uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS booked_at_display        text,    -- "filled 4m ago" — server-computed, cached
  ADD COLUMN IF NOT EXISTS deadhead_miles           int,     -- from origin to escort home base (client-computed)
  ADD COLUMN IF NOT EXISTS rate_min                 numeric(10,2),
  ADD COLUMN IF NOT EXISTS rate_max                 numeric(10,2);

-- Index: recently filled strip query
CREATE INDEX IF NOT EXISTS loads_status_booked_at_idx
  ON public.loads (status, booked_at DESC NULLS LAST);

-- Index: open loads sorted by posted_at
CREATE INDEX IF NOT EXISTS loads_status_posted_at_idx
  ON public.loads (status, posted_at DESC) WHERE status = 'open';

-- 2) Auto-expire pending_hold after TTL
-- Run this in a pg_cron job every 60 seconds:
-- UPDATE public.loads SET status='open', pending_hold_expires_at=NULL
--   WHERE status='pending_hold' AND pending_hold_expires_at < now();

-- 3) Broker trust enrichment
ALTER TABLE public.brokers
  ADD COLUMN IF NOT EXISTS platform_payment_count  int  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_funded          bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_open_dispute        bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avg_time_to_fill_min    int;   -- rolling average, server-computed

-- 4) RLS: public can read open + limited view of booked (for "recently filled" strip)
-- Extend existing policies — don't restructure here
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_loads_read" ON public.loads;
CREATE POLICY "public_loads_read" ON public.loads
  FOR SELECT USING (
    status IN ('open', 'pending_hold', 'booked', 'in_progress', 'completed')
  );

-- 5) record_load_booked() — call from server action on booking confirm
CREATE OR REPLACE FUNCTION public.record_load_booked(
  p_load_id  uuid,
  p_user_id  uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.loads SET
    status              = 'booked',
    booked_at           = now(),
    booked_by_user_id   = p_user_id,
    booked_at_display   = 'just now',
    pending_hold_expires_at = NULL
  WHERE id = p_load_id AND status IN ('open','pending_hold');

  INSERT INTO public.onboarding_events(user_id, event, meta)
  VALUES (p_user_id, 'load_booked', jsonb_build_object('load_id', p_load_id));
END;
$$;

-- 6) record_load_hold() — 90-second pending hold
CREATE OR REPLACE FUNCTION public.record_load_hold(
  p_load_id uuid,
  p_user_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.loads SET
    status                   = 'pending_hold',
    pending_hold_expires_at  = now() + interval '90 seconds',
    booked_by_user_id        = p_user_id
  WHERE id = p_load_id AND status = 'open';
END;
$$;
