-- migrations/20240403_monetization_events.sql
--
-- Agent Revenue Attribution Table
-- Additive migration — safe to run against existing schema.
-- Tracked by: lib/swarm/revenue-attribution.ts :: trackAgentRevenue()
--
-- Per agent_and_swarm_utilization_rule:
--   "money_impact" is a required field for each agent.
--   "What measurable thing got stronger because this agent/swarm ran?"

CREATE TABLE IF NOT EXISTS monetization_events (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name      text NOT NULL,
  event_type      text NOT NULL,   -- claim_converted | sponsor_placed | lead_captured | etc.
  amount_usd      numeric(10,2) NOT NULL DEFAULT 0,
  market_key      text,            -- e.g. 'us-texas-houston'
  country         text NOT NULL DEFAULT 'US',
  entity_id       text,            -- claim_id, listing_id, product_id, etc.
  metadata        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz DEFAULT now()
);

-- Indexes for fast per-agent and per-market queries
CREATE INDEX IF NOT EXISTS idx_monetization_events_agent
  ON monetization_events (agent_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_monetization_events_market
  ON monetization_events (market_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_monetization_events_type
  ON monetization_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_monetization_events_country
  ON monetization_events (country, created_at DESC);

-- Row Level Security
ALTER TABLE monetization_events ENABLE ROW LEVEL SECURITY;

-- Service role can write (agent attribution)
CREATE POLICY "service_role_write" ON monetization_events
  FOR INSERT TO service_role WITH CHECK (true);

-- Service role can read (reporting)
CREATE POLICY "service_role_read" ON monetization_events
  FOR SELECT TO service_role USING (true);

-- Admin can read all for dashboard
CREATE POLICY "admin_read" ON monetization_events
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'hc_admin');

-- ── View: Per-Agent Revenue Summary ──────────────────────────────
-- Consumed by: SwarmScoreboard, Command Tower Revenue dashboard
CREATE OR REPLACE VIEW v_agent_revenue_summary AS
SELECT
  agent_name,
  COUNT(*)                          AS event_count,
  ROUND(SUM(amount_usd)::numeric, 2) AS total_revenue_usd,
  ROUND(AVG(amount_usd)::numeric, 2) AS avg_revenue_per_event,
  MAX(created_at)                   AS last_attributed_at,
  MIN(created_at)                   AS first_attributed_at
FROM monetization_events
GROUP BY agent_name
ORDER BY total_revenue_usd DESC;

-- ── View: Per-Market Revenue Summary ─────────────────────────────
CREATE OR REPLACE VIEW v_market_revenue_summary AS
SELECT
  market_key,
  country,
  COUNT(*)                          AS event_count,
  ROUND(SUM(amount_usd)::numeric, 2) AS total_revenue_usd,
  COUNT(DISTINCT agent_name)        AS contributing_agents,
  MAX(created_at)                   AS last_revenue_at
FROM monetization_events
WHERE market_key IS NOT NULL
GROUP BY market_key, country
ORDER BY total_revenue_usd DESC;

-- ── View: 30-day Revenue by Event Type ───────────────────────────
CREATE OR REPLACE VIEW v_revenue_by_event_type_30d AS
SELECT
  event_type,
  COUNT(*)                          AS event_count,
  ROUND(SUM(amount_usd)::numeric, 2) AS total_revenue_usd,
  ROUND(AVG(amount_usd)::numeric, 2) AS avg_per_event,
  COUNT(DISTINCT agent_name)        AS agent_count
FROM monetization_events
WHERE created_at >= now() - INTERVAL '30 days'
GROUP BY event_type
ORDER BY total_revenue_usd DESC;
