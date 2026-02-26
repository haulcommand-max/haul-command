-- ============================================================
-- Migration: notification_events
-- Source: SPEC.md §6 & SCHEMA.md §1.11
-- Purpose: In-app notification inbox + push delivery tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notification_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  -- Types: LOAD_MATCH | COMPLIANCE_WARNING | CURFEW_REMINDER | PAYMENT_UPDATE
  --        | REVIEW_RECEIVED | ADMIN_ALERT | JOB_STATUS
  title         TEXT NOT NULL,
  body          TEXT,
  payload       JSONB NOT NULL DEFAULT '{}',
  read_at       TIMESTAMPTZ,                        -- NULL = unread
  push_sent_at  TIMESTAMPTZ,                        -- NULL = not yet attempted
  push_status   TEXT NOT NULL DEFAULT 'pending'     -- pending | sent | failed | skipped | sms_escalated
    CHECK (push_status IN ('pending','sent','failed','skipped','sms_escalated')),
  sms_sent_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS ne_user_unread_idx
  ON public.notification_events (user_id, read_at)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS ne_user_created_idx
  ON public.notification_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ne_push_status_idx
  ON public.notification_events (push_status)
  WHERE push_status = 'pending';

-- Row Level Security
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- Users can read/update (mark read) only their own notifications
CREATE POLICY "owner_read_update" ON public.notification_events
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can write on behalf of any user (edge functions)
CREATE POLICY "service_write" ON public.notification_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable Realtime for live badge count updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_events;

-- Comment
COMMENT ON TABLE public.notification_events IS
  'In-app notification inbox. Push delivery tracked here. Firebase is delivery-only, never business state.';
COMMENT ON COLUMN public.notification_events.push_status IS
  'pending = not yet attempted | sent = FCM accepted | failed = FCM rejected | skipped = user opted out | sms_escalated = SMS fallback triggered';
