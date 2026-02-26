-- 📊 MODULE E: ANALYTICS (The "Default Setting Moat" Tracker)
-- Directive: "Track Loss Meters: Deadhead, Compliance, Pay Speed."

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- Nullable for anonymous/guest events
  role TEXT NOT NULL, -- broker | escort | carrier | guest
  name TEXT NOT NULL, -- The event name (e.g., 'page_view', 'tool_used')
  payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- Context (path, provider_id, lead_id)
  session_id UUID, -- To track guest sessions
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for High-Velocity Querying
CREATE INDEX IF NOT EXISTS idx_analytics_name_time ON analytics_events(name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_payload_gin ON analytics_events USING GIN (payload);

-- RLS: Users insert their own events. Admins read all.
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insert Public Events" ON analytics_events
  FOR INSERT WITH CHECK (true); -- Allow anonymous inserts (e.g. landing page views)

CREATE POLICY "Read Own Events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin Read All Events" ON analytics_events
  FOR ALL USING (auth.role() = 'service_role');
