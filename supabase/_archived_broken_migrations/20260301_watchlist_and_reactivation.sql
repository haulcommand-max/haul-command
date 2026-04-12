-- Watchlist tables for WatchlistEngine (core/social/watchlist_engine.ts)
-- Enables follow/watch system for corridors, operators, brokers, equipment types

CREATE TABLE IF NOT EXISTS public.watchlist (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watch_type      TEXT NOT NULL CHECK (watch_type IN ('corridor', 'operator', 'broker', 'equipment_type')),
  target_id       TEXT NOT NULL,
  target_label    TEXT NOT NULL,
  digest_mode     TEXT NOT NULL DEFAULT 'daily' CHECK (digest_mode IN ('realtime', 'daily', 'weekly')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  metadata        JSONB NOT NULL DEFAULT '{}',
  trigger_count   INT NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, watch_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_watchlist_target ON watchlist(watch_type, target_id) WHERE is_active = true;

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_watches" ON watchlist FOR ALL USING (auth.uid() = user_id);

-- Watchlist events: trigger history for digests
CREATE TABLE IF NOT EXISTS public.watchlist_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id        UUID NOT NULL REFERENCES watchlist(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watch_type      TEXT NOT NULL,
  target_id       TEXT NOT NULL,
  trigger_type    TEXT NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  data            JSONB NOT NULL DEFAULT '{}',
  priority        TEXT NOT NULL DEFAULT 'normal',
  digest_mode     TEXT NOT NULL DEFAULT 'daily',
  delivered       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_watchlist_events_user ON watchlist_events(user_id, digest_mode, delivered);
CREATE INDEX IF NOT EXISTS idx_watchlist_events_undelivered ON watchlist_events(digest_mode, delivered) WHERE delivered = false;

ALTER TABLE watchlist_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_events" ON watchlist_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service_write_events" ON watchlist_events FOR ALL USING (true) WITH CHECK (true);

-- Push queue (referenced by UrgencyEngine + WatchlistEngine)
CREATE TABLE IF NOT EXISTS public.push_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel         TEXT NOT NULL DEFAULT 'push',
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  priority        TEXT NOT NULL DEFAULT 'normal',
  data            JSONB NOT NULL DEFAULT '{}',
  sent            BOOLEAN NOT NULL DEFAULT false,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_queue_pending ON push_queue(user_id, created_at) WHERE sent = false;

ALTER TABLE push_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_pushes" ON push_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service_manage_pushes" ON push_queue FOR ALL USING (true) WITH CHECK (true);

-- RPC to get profile view counts in last 24h (used by UrgencyEngine.runProfileAttentionBatch)
CREATE OR REPLACE FUNCTION get_profile_view_counts_24h()
RETURNS TABLE(profile_user_id UUID, view_count BIGINT) AS $$
  SELECT profile_user_id, COUNT(*) as view_count
  FROM profile_views
  WHERE created_at >= now() - interval '24 hours'
  GROUP BY profile_user_id
  HAVING COUNT(*) >= 3
  ORDER BY view_count DESC
  LIMIT 500;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
