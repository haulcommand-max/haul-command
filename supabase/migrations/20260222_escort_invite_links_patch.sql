-- ==========================================================
-- Migration: 20260222_escort_invite_links_patch.sql
-- Adds missing columns to escort_invite_links:
--   click_count, last_clicked_at, broker_user_id, source
-- Also adds admin_events table if not already present.
-- ==========================================================

-- ─────────────────────────────────────────────────────────────
-- escort_invite_links: add missing tracking columns
-- ─────────────────────────────────────────────────────────────

ALTER TABLE escort_invite_links
  ADD COLUMN IF NOT EXISTS click_count     int            DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_clicked_at timestamptz,
  ADD COLUMN IF NOT EXISTS broker_user_id  uuid           REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source          text           DEFAULT 'escort_invite'; -- 'escort_invite' | 'posted_load' | etc.

-- profile_badges: add source column for provenance tracking
ALTER TABLE profile_badges
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'system';

-- ─────────────────────────────────────────────────────────────
-- admin_events table (lightweight audit log)
-- Used by nudge API and invite conversion API
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  text NOT NULL,
  actor_id    uuid,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_events_type    ON admin_events(event_type);
CREATE INDEX IF NOT EXISTS idx_admin_events_actor   ON admin_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_admin_events_created ON admin_events(created_at DESC);

ALTER TABLE admin_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_events" ON admin_events
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
CREATE POLICY "service_write_events" ON admin_events
  FOR INSERT WITH CHECK (true); -- service role inserts via Edge Functions / API routes

-- ─────────────────────────────────────────────────────────────
-- Corridor stress scores: add unique constraint on slug so 
-- Edge Function upsert works with ON CONFLICT (corridor_slug)
-- ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'corridor_stress_scores_corridor_slug_key'
  ) THEN
    ALTER TABLE corridor_stress_scores
      ADD CONSTRAINT corridor_stress_scores_corridor_slug_key UNIQUE (corridor_slug);
  END IF;
END $$;
