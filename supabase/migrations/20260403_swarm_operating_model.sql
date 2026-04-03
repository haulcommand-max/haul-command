-- Swarm Operating Model Database Schema
-- Tables: swarm_activity_log, swarm_scoreboard, market_states, agent_queue

-- ═══════════════════════════════════════════════════════════════
-- MARKET STATES — mode governor for every market
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS market_states (
  market_key TEXT PRIMARY KEY,
  country_code TEXT NOT NULL,
  region TEXT,
  city TEXT,
  mode TEXT NOT NULL DEFAULT 'seeding'
    CHECK (mode IN ('seeding','demand_capture','waitlist','live','shortage','rescue')),
  supply_count INTEGER DEFAULT 0,
  claimed_count INTEGER DEFAULT 0,
  demand_signals_30d INTEGER DEFAULT 0,
  match_rate_30d NUMERIC(5,4) DEFAULT 0,
  fill_rate_30d NUMERIC(5,4) DEFAULT 0,
  avg_response_time_hours NUMERIC(8,2) DEFAULT 0,
  sponsor_inventory_filled NUMERIC(5,4) DEFAULT 0,
  last_evaluated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_states_country ON market_states(country_code);
CREATE INDEX IF NOT EXISTS idx_market_states_mode ON market_states(mode);

-- ═══════════════════════════════════════════════════════════════
-- SWARM ACTIVITY LOG — what every agent did, when, why
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS swarm_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  domain TEXT,
  trigger_reason TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  surfaces_touched TEXT[] DEFAULT '{}',
  revenue_impact NUMERIC(12,2),
  trust_impact NUMERIC(5,2),
  country TEXT,
  market_key TEXT,
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('queued','running','completed','failed','skipped')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_swarm_activity_created ON swarm_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_swarm_activity_agent ON swarm_activity_log(agent_name);
CREATE INDEX IF NOT EXISTS idx_swarm_activity_domain ON swarm_activity_log(domain);
CREATE INDEX IF NOT EXISTS idx_swarm_activity_country ON swarm_activity_log(country);

-- ═══════════════════════════════════════════════════════════════
-- SWARM SCOREBOARD — daily aggregated metrics
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS swarm_scoreboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executions_today INTEGER DEFAULT 0,
  claims_driven INTEGER DEFAULT 0,
  listings_created INTEGER DEFAULT 0,
  loads_captured INTEGER DEFAULT 0,
  matches_created INTEGER DEFAULT 0,
  revenue_influenced NUMERIC(12,2) DEFAULT 0,
  sponsor_inventory_filled INTEGER DEFAULT 0,
  ai_citation_pages INTEGER DEFAULT 0,
  no_dead_end_fixes INTEGER DEFAULT 0,
  market_activations INTEGER DEFAULT 0,
  domain_breakdown JSONB DEFAULT '{}',
  computed_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- AGENT QUEUE — pending actions for the action queue manager
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS agent_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  action_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  market_key TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_agent_queue_status ON agent_queue(status, priority);
CREATE INDEX IF NOT EXISTS idx_agent_queue_agent ON agent_queue(agent_id);

-- ═══════════════════════════════════════════════════════════════
-- COVERAGE GAP ALERTS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS coverage_gap_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_key TEXT NOT NULL,
  country_code TEXT NOT NULL,
  gap_type TEXT NOT NULL, -- 'role_missing', 'corridor_empty', 'infra_gap'
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  role TEXT,
  corridor TEXT,
  details JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_coverage_gaps_market ON coverage_gap_alerts(market_key);
CREATE INDEX IF NOT EXISTS idx_coverage_gaps_unresolved ON coverage_gap_alerts(resolved) WHERE NOT resolved;

-- ═══════════════════════════════════════════════════════════════
-- RLS: Admin-only for swarm tables
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE market_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE swarm_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE swarm_scoreboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_gap_alerts ENABLE ROW LEVEL SECURITY;

-- Service role has full access (edge functions + cron)
CREATE POLICY "service_role_full_access" ON market_states FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON swarm_activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON swarm_scoreboard FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON agent_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON coverage_gap_alerts FOR ALL USING (true) WITH CHECK (true);
