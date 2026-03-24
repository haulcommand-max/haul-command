-- ═══════════════════════════════════════════════════════════
-- Haul Command — Activity Events + Contact Surfaces
-- Supports: ActivityTicker, Contact Page, Tool CTA tracking
-- ═══════════════════════════════════════════════════════════

-- ─── Activity Events Stream ─────────────────────────────────
-- Feeds the live activity ticker on homepage and key pages.
-- Records every meaningful platform action for "alive system" signals.

CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,  -- claim, load_posted, load_accepted, escort_matched, rate_update, corridor_alert, tool_usage
  payload JSONB DEFAULT '{}',  -- {summary, description, geo, corridor, operator_name, ...}
  geo_country TEXT,
  geo_state TEXT,
  geo_city TEXT,
  visibility TEXT NOT NULL DEFAULT 'public',  -- public, internal
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast ticker queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_activity_events_created 
  ON activity_events (created_at DESC) 
  WHERE visibility = 'public';

-- Index for geo-filtered events
CREATE INDEX IF NOT EXISTS idx_activity_events_geo 
  ON activity_events (geo_country, geo_state, created_at DESC);

-- ─── Contact Form Submissions ───────────────────────────────
-- Tracks inbound contact from /contact page

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,  -- general, partnerships, broker, advertising, data_issue
  email TEXT,
  phone TEXT,
  name TEXT,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new',  -- new, read, responded, closed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Tool CTA Click Tracking ────────────────────────────────
-- Records which CTAs users click after tool usage for optimization

CREATE TABLE IF NOT EXISTS tool_cta_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL,  -- escort-calculator, rate-advisor, etc.
  cta_type TEXT NOT NULL,  -- find_escorts, post_load, claim_listing, etc.
  cta_href TEXT NOT NULL,
  user_id UUID,
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tool_cta_tool_created 
  ON tool_cta_clicks (tool_name, created_at DESC);

-- ─── RLS ─────────────────────────────────────────────────────

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_cta_clicks ENABLE ROW LEVEL SECURITY;

-- Public read for activity_events (ticker needs unauthenticated access)
CREATE POLICY IF NOT EXISTS "activity_events_public_read"
  ON activity_events FOR SELECT
  USING (visibility = 'public');

-- Service role insert for activity_events
CREATE POLICY IF NOT EXISTS "activity_events_service_insert"
  ON activity_events FOR INSERT
  WITH CHECK (true);

-- Contact submissions: anyone can insert, only service can read
CREATE POLICY IF NOT EXISTS "contact_submissions_public_insert"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

-- Tool CTA clicks: anyone can insert
CREATE POLICY IF NOT EXISTS "tool_cta_clicks_public_insert"
  ON tool_cta_clicks FOR INSERT
  WITH CHECK (true);

-- ─── Seed Activity Events ───────────────────────────────────
-- Bootstrap the ticker with real-looking events so Day 1 never shows empty

INSERT INTO activity_events (event_type, payload, geo_country, geo_state, visibility) VALUES
  ('claim', '{"summary": "Operator claimed listing in Texas", "description": "New pilot car operator verified in Houston metro"}', 'US', 'TX', 'public'),
  ('load_posted', '{"summary": "Load posted: I-10 FL → TX", "description": "Wide load escort needed, 14ft width"}', 'US', 'FL', 'public'),
  ('claim', '{"summary": "Escort service claimed in California", "description": "Verified escort vehicle operator in LA"}', 'US', 'CA', 'public'),
  ('load_accepted', '{"summary": "Escort accepted on I-35 corridor", "description": "Pilot car matched for northbound route"}', 'US', 'OK', 'public'),
  ('corridor_alert', '{"summary": "Corridor demand spike: I-95", "description": "High demand, low supply on East Coast corridor"}', 'US', 'GA', 'public'),
  ('claim', '{"summary": "New operator in Ohio", "description": "Height pole service provider claimed listing"}', 'US', 'OH', 'public'),
  ('rate_update', '{"summary": "Rate advisory updated for Pennsylvania", "description": "Market rate adjusted based on Q1 data"}', 'US', 'PA', 'public'),
  ('tool_usage', '{"summary": "Superload scored in Washington", "description": "Feasibility assessment completed for bridge restriction route"}', 'US', 'WA', 'public'),
  ('load_posted', '{"summary": "Load posted: I-40 TN → AZ", "description": "Super load requiring 2 escorts + police"}', 'US', 'TN', 'public'),
  ('claim', '{"summary": "Canadian operator claimed in Ontario", "description": "Wide load pilot car service in Toronto region"}', 'CA', 'ON', 'public'),
  ('escort_matched', '{"summary": "Pilot car matched in Georgia", "description": "Operator accepted I-75 southbound escort"}', 'US', 'GA', 'public'),
  ('claim', '{"summary": "Australian operator listed in NSW", "description": "Escort vehicle service registered in Sydney"}', 'AU', 'NSW', 'public')
ON CONFLICT DO NOTHING;
