-- ══════════════════════════════════════════════════════════════
-- Haul Command — Job Queue + Price Discrimination Tables
-- Sprint: Execution Engine + Monetization
-- ══════════════════════════════════════════════════════════════

-- ─── Job Queue ──────────────────────────────────────────────
-- All non-critical work runs through here off the main cycle

CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,                                          -- ingestion | scoring | analytics | agent_action | email | match
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',                          -- pending | processing | done | failed
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_queue_status_scheduled
  ON job_queue (status, scheduled_at ASC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_job_queue_type_created
  ON job_queue (job_type, created_at DESC);

-- ─── Price Discrimination Rules ─────────────────────────────
-- Charge different prices based on region, demand, urgency

CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL,                                         -- urgency | region | demand | supply_scarcity
  condition_key TEXT NOT NULL,                                     -- e.g. 'urgency_score', 'corridor_id', 'state'
  condition_operator TEXT NOT NULL DEFAULT '>=',                   -- >= | <= | = | in
  condition_value TEXT NOT NULL,                                   -- e.g. '80', 'TX', '["TX","FL"]'
  price_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,             -- e.g. 1.25 = 25% premium
  absolute_adder INT NOT NULL DEFAULT 0,                          -- flat $ amount to add
  active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 50,                               -- higher = applied first
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default pricing rules (urgency + scarcity signals)
INSERT INTO pricing_rules (name, rule_type, condition_key, condition_operator, condition_value, price_multiplier, absolute_adder, priority, description)
VALUES
  ('High Urgency Premium',     'urgency',          'urgency_score',  '>=',  '80', 1.35, 0,   90, '35% premium for moves within 3 days'),
  ('Moderate Urgency Premium', 'urgency',          'urgency_score',  '>=',  '60', 1.18, 0,   80, '18% premium for moves this week'),
  ('Superload Premium',        'demand',           'is_superload',   '=',   '1',  1.50, 500, 95, '50% premium + $500 for superloads'),
  ('High Demand Corridor',     'demand',           'demand_score',   '>=',  '80', 1.25, 0,   85, '25% premium for hot corridors'),
  ('Police Escort Required',   'supply_scarcity',  'police_required','=',   '1',  1.20, 350, 88, '20% + $350 for police coordination'),
  ('Multi-State Premium',      'region',           'route_states',   '>=',  '3',  1.15, 0,   75, '15% for 3+ state routes')
ON CONFLICT DO NOTHING;

-- ─── Supply Scarcity Alerts ─────────────────────────────────
-- Powers "3 escorts left" urgency signals

CREATE TABLE IF NOT EXISTS supply_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id UUID,
  state_code TEXT,
  alert_type TEXT NOT NULL,                                        -- low_supply | high_demand | price_spike
  available_count INT,
  demand_rate NUMERIC(5,2),
  message TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supply_alerts_active
  ON supply_alerts (state_code, active)
  WHERE active = true;

-- Seed some urgency signals for immediate display
INSERT INTO supply_alerts (state_code, alert_type, available_count, message, expires_at)
VALUES
  ('TX', 'low_supply',  3, '3 verified escorts available in Texas this week',               now() + interval '7 days'),
  ('FL', 'high_demand', 8, 'High demand corridor: I-10 FL→TX. Book escorts early.',         now() + interval '3 days'),
  ('CA', 'low_supply',  2, 'Limited pilot car availability in California this week',        now() + interval '5 days'),
  ('OH', 'price_spike', 5, 'Rate spike on I-77 Ohio. Secure escorts now before prices rise', now() + interval '4 days')
ON CONFLICT DO NOTHING;

-- ─── RLS ─────────────────────────────────────────────────────
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_alerts ENABLE ROW LEVEL SECURITY;

-- Job queue: service role only
CREATE POLICY IF NOT EXISTS "job_queue_service_only"
  ON job_queue FOR ALL
  USING (false);  -- only service role key bypasses RLS

-- Pricing rules: public read
CREATE POLICY IF NOT EXISTS "pricing_rules_public_read"
  ON pricing_rules FOR SELECT
  USING (active = true);

-- Supply alerts: public read
CREATE POLICY IF NOT EXISTS "supply_alerts_public_read"
  ON supply_alerts FOR SELECT
  USING (active = true AND (expires_at IS NULL OR expires_at > now()));
