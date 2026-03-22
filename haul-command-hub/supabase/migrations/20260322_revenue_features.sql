-- ============================================================
-- Revenue Features Migration
-- Load Analyzer, Rate Advisor, Earnings Tracker, Corridor Alerts
-- Social Layer, AdGrid Boosts
-- ============================================================

-- ── Operator Runs (Earnings Tracker) ──────────────────────────
CREATE TABLE IF NOT EXISTS operator_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL,
  corridor_id TEXT,
  corridor_name TEXT,
  load_type TEXT DEFAULT 'standard',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  gross_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  miles NUMERIC(8,1) DEFAULT 0,
  fuel_cost NUMERIC(8,2) DEFAULT 0,
  hours NUMERIC(5,1) DEFAULT 0,
  net_profit NUMERIC(10,2) GENERATED ALWAYS AS (gross_rate - fuel_cost) STORED,
  notes TEXT,
  source TEXT DEFAULT 'manual', -- manual | auto
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operator_runs_operator ON operator_runs(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_runs_date ON operator_runs(date DESC);

-- ── Corridor Alerts (Delay & Shutdown Prevention) ─────────────
CREATE TABLE IF NOT EXISTS corridor_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id TEXT,
  corridor_name TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('weather','curfew','shutdown','construction','dot_advisory')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  source_url TEXT,
  source TEXT DEFAULT 'manual', -- manual | weather_api | dot_feed
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corridor_alerts_active ON corridor_alerts(is_active, severity);
CREATE INDEX IF NOT EXISTS idx_corridor_alerts_corridor ON corridor_alerts(corridor_id);

-- ── Load Analysis History ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS load_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  origin TEXT,
  destination TEXT,
  dimensions TEXT,
  weight_lbs NUMERIC(10,0),
  load_type TEXT,
  offered_rate NUMERIC(10,2),
  profit_score INTEGER CHECK (profit_score BETWEEN 0 AND 100),
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  hidden_costs JSONB DEFAULT '[]',
  recommendation TEXT CHECK (recommendation IN ('accept','negotiate','decline')),
  reasoning TEXT,
  is_pro_report BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_load_analyses_user ON load_analyses(user_id);

-- ── Rate Advisory History ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_advisories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  corridor_name TEXT,
  load_type TEXT,
  distance_miles NUMERIC(8,1),
  run_date DATE,
  rate_low NUMERIC(10,2),
  rate_mid NUMERIC(10,2),
  rate_high NUMERIC(10,2),
  negotiate_ceiling NUMERIC(10,2),
  corridor_status TEXT CHECK (corridor_status IN ('hot','warm','cool')),
  reasons JSONB DEFAULT '[]',
  is_pro_report BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Social Layer Tables ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS operator_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  post_type TEXT DEFAULT 'update' CHECK (post_type IN ('update','availability','rate_intel','broker_request')),
  corridor_tag TEXT,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operator_posts_operator ON operator_posts(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_posts_corridor ON operator_posts(corridor_tag);

CREATE TABLE IF NOT EXISTS broker_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL,
  operator_id UUID NOT NULL,
  endorsement TEXT NOT NULL CHECK (char_length(endorsement) <= 120),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_endorsements_operator ON broker_endorsements(operator_id);

-- ── AdGrid Boosts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days IN (7, 30, 90)),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  amount_paid NUMERIC(8,2) NOT NULL,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_boosts_active ON ad_boosts(status, end_date);
CREATE INDEX IF NOT EXISTS idx_ad_boosts_operator ON ad_boosts(operator_id);

-- ── AdGrid Campaigns ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adgrid_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('sponsored_listing','banner','corridor_sponsor','data_sponsor')),
  target_corridors JSONB DEFAULT '[]',
  target_countries JSONB DEFAULT '[]',
  target_audience TEXT DEFAULT 'both' CHECK (target_audience IN ('operators','brokers','both')),
  daily_budget NUMERIC(8,2),
  duration_days INTEGER DEFAULT 30,
  total_spend NUMERIC(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review','active','paused','expired','rejected')),
  stripe_session_id TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AdGrid Events Tracking ───────────────────────────────────
CREATE TABLE IF NOT EXISTS adgrid_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES adgrid_campaigns(id),
  boost_id UUID REFERENCES ad_boosts(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('impression','click','conversion')),
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adgrid_events_campaign ON adgrid_events(campaign_id, event_type);

-- ── Operator MPG Settings ─────────────────────────────────────
-- Extend hc_places if needed (non-destructive)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hc_places' AND column_name='operator_mpg') THEN
    ALTER TABLE hc_places ADD COLUMN operator_mpg NUMERIC(4,1) DEFAULT 8.0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hc_places' AND column_name='default_fuel_price') THEN
    ALTER TABLE hc_places ADD COLUMN default_fuel_price NUMERIC(4,2) DEFAULT 3.50;
  END IF;
END $$;

-- ── RLS Policies for new tables ───────────────────────────────
ALTER TABLE operator_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE corridor_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE adgrid_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE adgrid_events ENABLE ROW LEVEL SECURITY;

-- Public read on alerts, posts, endorsements, boosts
CREATE POLICY "Public read corridor alerts" ON corridor_alerts FOR SELECT USING (true);
CREATE POLICY "Public read operator posts" ON operator_posts FOR SELECT USING (true);
CREATE POLICY "Public read endorsements" ON broker_endorsements FOR SELECT USING (true);
CREATE POLICY "Public read active boosts" ON ad_boosts FOR SELECT USING (status = 'active');
CREATE POLICY "Public read active campaigns" ON adgrid_campaigns FOR SELECT USING (status = 'active');

-- Service role full access (for API routes)
CREATE POLICY "Service full access operator_runs" ON operator_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full access load_analyses" ON load_analyses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full access rate_advisories" ON rate_advisories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full access follows" ON follows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full access operator_posts_write" ON operator_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full access endorsements_write" ON broker_endorsements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full access ad_boosts_write" ON ad_boosts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full access campaigns_write" ON adgrid_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full access events_write" ON adgrid_events FOR ALL USING (true) WITH CHECK (true);
