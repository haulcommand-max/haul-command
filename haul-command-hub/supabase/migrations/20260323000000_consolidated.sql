-- ═══════════════════════════════════════════════════════════════
-- CONSOLIDATED MIGRATION — Run in Supabase SQL Editor
-- Combines revenue_features + unified_infrastructure + system_infrastructure
-- All tables use CREATE TABLE IF NOT EXISTS (safe to re-run)
-- ═══════════════════════════════════════════════════════════════

-- ════════════════════════════
-- SECTION 1: Revenue Features
-- ════════════════════════════

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
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_operator_runs_operator ON operator_runs(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_runs_date ON operator_runs(date DESC);

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
  source TEXT DEFAULT 'manual',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_corridor_alerts_active ON corridor_alerts(is_active, severity);
CREATE INDEX IF NOT EXISTS idx_corridor_alerts_corridor ON corridor_alerts(corridor_id);

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

-- Extend hc_places with operator MPG settings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hc_places' AND column_name='operator_mpg') THEN
    ALTER TABLE hc_places ADD COLUMN operator_mpg NUMERIC(4,1) DEFAULT 8.0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hc_places' AND column_name='default_fuel_price') THEN
    ALTER TABLE hc_places ADD COLUMN default_fuel_price NUMERIC(4,2) DEFAULT 3.50;
  END IF;
END $$;


-- ════════════════════════════════
-- SECTION 2: Unified Infrastructure
-- ════════════════════════════════

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_id ON stripe_webhook_events (stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON stripe_webhook_events (event_type);

CREATE TABLE IF NOT EXISTS corridor_sponsors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  corridor_slug TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  activated_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_corridor_sponsors_slug ON corridor_sponsors (corridor_slug);
CREATE INDEX IF NOT EXISTS idx_corridor_sponsors_status ON corridor_sponsors (status);

CREATE TABLE IF NOT EXISTS operator_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  source TEXT DEFAULT 'phone' CHECK (source IN ('phone', 'motive', 'manual')),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_operator_locations_operator ON operator_locations (operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_locations_updated ON operator_locations (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_operator_locations_geo ON operator_locations (lat, lng);

CREATE OR REPLACE FUNCTION cleanup_stale_locations()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM operator_locations WHERE updated_at < now() - interval '5 minutes';
END;
$$;

CREATE TABLE IF NOT EXISTS gps_breadcrumbs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  source TEXT DEFAULT 'phone',
  recorded_at TIMESTAMPTZ NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gps_breadcrumbs_operator ON gps_breadcrumbs (operator_id);
CREATE INDEX IF NOT EXISTS idx_gps_breadcrumbs_recorded ON gps_breadcrumbs (recorded_at DESC);


-- ════════════════════════════════
-- SECTION 3: System Infrastructure
-- ════════════════════════════════

CREATE TABLE IF NOT EXISTS system_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  user_id TEXT,
  extra JSONB,
  count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(route, message)
);
CREATE INDEX IF NOT EXISTS idx_system_errors_route ON system_errors (route);
CREATE INDEX IF NOT EXISTS idx_system_errors_created ON system_errors (created_at DESC);

CREATE TABLE IF NOT EXISTS global_countries (
  country_code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'planned' CHECK (status IN ('live', 'next', 'planned')),
  tier TEXT DEFAULT 'C' CHECK (tier IN ('A', 'B', 'C')),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  flag TEXT,
  regulations_score INTEGER DEFAULT 0,
  operators_score INTEGER DEFAULT 0,
  corridors_score INTEGER DEFAULT 0,
  compliance_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  went_live_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_global_countries_status ON global_countries (status);
CREATE INDEX IF NOT EXISTS idx_global_countries_tier ON global_countries (tier);

-- Seed 57 countries
INSERT INTO global_countries (country_code, name, status, tier, lat, lng, flag) VALUES
  ('US', 'United States', 'live', 'A', 39.83, -98.58, '🇺🇸'),
  ('CA', 'Canada', 'live', 'A', 56.13, -106.35, '🇨🇦'),
  ('AU', 'Australia', 'live', 'A', -25.27, 133.78, '🇦🇺'),
  ('GB', 'United Kingdom', 'live', 'A', 55.38, -3.44, '🇬🇧'),
  ('DE', 'Germany', 'next', 'A', 51.17, 10.45, '🇩🇪'),
  ('NL', 'Netherlands', 'next', 'A', 52.13, 5.29, '🇳🇱'),
  ('FR', 'France', 'next', 'A', 46.23, 2.21, '🇫🇷'),
  ('SE', 'Sweden', 'next', 'A', 60.13, 18.64, '🇸🇪'),
  ('NO', 'Norway', 'next', 'A', 60.47, 8.47, '🇳🇴'),
  ('AE', 'United Arab Emirates', 'next', 'A', 23.42, 53.85, '🇦🇪'),
  ('SA', 'Saudi Arabia', 'planned', 'B', 23.89, 45.08, '🇸🇦'),
  ('NZ', 'New Zealand', 'planned', 'B', -40.90, 174.89, '🇳🇿'),
  ('ZA', 'South Africa', 'planned', 'B', -30.56, 22.94, '🇿🇦'),
  ('BR', 'Brazil', 'planned', 'B', -14.24, -51.93, '🇧🇷'),
  ('MX', 'Mexico', 'planned', 'B', 23.63, -102.55, '🇲🇽'),
  ('IN', 'India', 'planned', 'B', 20.59, 78.96, '🇮🇳'),
  ('JP', 'Japan', 'planned', 'B', 36.20, 138.25, '🇯🇵'),
  ('KR', 'South Korea', 'planned', 'B', 35.91, 127.77, '🇰🇷'),
  ('IT', 'Italy', 'planned', 'B', 41.87, 12.57, '🇮🇹'),
  ('ES', 'Spain', 'planned', 'B', 40.46, -3.75, '🇪🇸'),
  ('PL', 'Poland', 'planned', 'B', 51.92, 19.15, '🇵🇱'),
  ('AT', 'Austria', 'planned', 'B', 47.52, 14.55, '🇦🇹'),
  ('BE', 'Belgium', 'planned', 'B', 50.50, 4.47, '🇧🇪'),
  ('CH', 'Switzerland', 'planned', 'B', 46.82, 8.23, '🇨🇭'),
  ('DK', 'Denmark', 'planned', 'B', 56.26, 9.50, '🇩🇰'),
  ('FI', 'Finland', 'planned', 'C', 61.92, 25.75, '🇫🇮'),
  ('IE', 'Ireland', 'planned', 'C', 53.14, -7.69, '🇮🇪'),
  ('PT', 'Portugal', 'planned', 'C', 39.40, -8.22, '🇵🇹'),
  ('CZ', 'Czech Republic', 'planned', 'C', 49.82, 15.47, '🇨🇿'),
  ('RO', 'Romania', 'planned', 'C', 45.94, 24.97, '🇷🇴'),
  ('HU', 'Hungary', 'planned', 'C', 47.16, 19.50, '🇭🇺'),
  ('GR', 'Greece', 'planned', 'C', 39.07, 21.82, '🇬🇷'),
  ('CL', 'Chile', 'planned', 'C', -35.68, -71.54, '🇨🇱'),
  ('AR', 'Argentina', 'planned', 'C', -38.42, -63.62, '🇦🇷'),
  ('CO', 'Colombia', 'planned', 'C', 4.57, -74.30, '🇨🇴'),
  ('PE', 'Peru', 'planned', 'C', -9.19, -75.02, '🇵🇪'),
  ('TH', 'Thailand', 'planned', 'C', 15.87, 100.99, '🇹🇭'),
  ('MY', 'Malaysia', 'planned', 'C', 4.21, 101.98, '🇲🇾'),
  ('SG', 'Singapore', 'planned', 'C', 1.35, 103.82, '🇸🇬'),
  ('PH', 'Philippines', 'planned', 'C', 12.88, 121.77, '🇵🇭'),
  ('ID', 'Indonesia', 'planned', 'C', -0.79, 113.92, '🇮🇩'),
  ('VN', 'Vietnam', 'planned', 'C', 14.06, 108.28, '🇻🇳'),
  ('TW', 'Taiwan', 'planned', 'C', 23.70, 120.96, '🇹🇼'),
  ('NG', 'Nigeria', 'planned', 'C', 9.08, 8.68, '🇳🇬'),
  ('KE', 'Kenya', 'planned', 'C', -0.02, 37.91, '🇰🇪'),
  ('EG', 'Egypt', 'planned', 'C', 26.82, 30.80, '🇪🇬'),
  ('MA', 'Morocco', 'planned', 'C', 31.79, -7.09, '🇲🇦'),
  ('GH', 'Ghana', 'planned', 'C', 7.95, -1.02, '🇬🇭'),
  ('TR', 'Turkey', 'planned', 'C', 38.96, 35.24, '🇹🇷'),
  ('IL', 'Israel', 'planned', 'C', 31.05, 34.85, '🇮🇱'),
  ('QA', 'Qatar', 'planned', 'C', 25.35, 51.18, '🇶🇦'),
  ('KW', 'Kuwait', 'planned', 'C', 29.31, 47.48, '🇰🇼'),
  ('OM', 'Oman', 'planned', 'C', 21.47, 55.98, '🇴🇲'),
  ('BH', 'Bahrain', 'planned', 'C', 26.07, 50.56, '🇧🇭'),
  ('PK', 'Pakistan', 'planned', 'C', 30.38, 69.35, '🇵🇰'),
  ('BD', 'Bangladesh', 'planned', 'C', 23.68, 90.36, '🇧🇩'),
  ('LK', 'Sri Lanka', 'planned', 'C', 7.87, 80.77, '🇱🇰')
ON CONFLICT (country_code) DO UPDATE SET
  name = EXCLUDED.name, lat = EXCLUDED.lat, lng = EXCLUDED.lng,
  flag = EXCLUDED.flag, tier = EXCLUDED.tier;

CREATE TABLE IF NOT EXISTS copilot_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jurisdiction TEXT NOT NULL,
  question_hash TEXT NOT NULL UNIQUE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  model_used TEXT,
  tokens_used INTEGER,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_copilot_cache_hash ON copilot_cache (question_hash);
CREATE INDEX IF NOT EXISTS idx_copilot_cache_jurisdiction ON copilot_cache (jurisdiction);
CREATE INDEX IF NOT EXISTS idx_copilot_cache_expires ON copilot_cache (expires_at);

CREATE TABLE IF NOT EXISTS hc_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hc_events_type ON hc_events (event_type);
CREATE INDEX IF NOT EXISTS idx_hc_events_created ON hc_events (created_at DESC);


-- ════════════════════════════════
-- SECTION 4: RLS Policies
-- ════════════════════════════════

-- Enable RLS on all new tables
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
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE corridor_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_breadcrumbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_events ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY IF NOT EXISTS "read_corridor_alerts" ON corridor_alerts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "read_operator_posts" ON operator_posts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "read_endorsements" ON broker_endorsements FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "read_active_boosts" ON ad_boosts FOR SELECT USING (status = 'active');
CREATE POLICY IF NOT EXISTS "read_active_campaigns" ON adgrid_campaigns FOR SELECT USING (status = 'active');
CREATE POLICY IF NOT EXISTS "read_operator_locations" ON operator_locations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "read_gps_breadcrumbs" ON gps_breadcrumbs FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "read_corridor_sponsors" ON corridor_sponsors FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "read_global_countries" ON global_countries FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "read_copilot_cache" ON copilot_cache FOR SELECT USING (true);

-- Service role full access for API routes
CREATE POLICY IF NOT EXISTS "svc_operator_runs" ON operator_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "svc_load_analyses" ON load_analyses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "svc_rate_advisories" ON rate_advisories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "svc_follows" ON follows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "svc_operator_posts" ON operator_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "svc_endorsements" ON broker_endorsements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "svc_ad_boosts" ON ad_boosts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "svc_campaigns" ON adgrid_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "svc_adgrid_events" ON adgrid_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "svc_hc_events" ON hc_events FOR ALL USING (true) WITH CHECK (true);

-- Fix HTML entities in operator names
UPDATE directory_listings SET name = replace(replace(replace(replace(replace(replace(name,
  '&#39;', ''''),
  '&amp;', '&'),
  '&quot;', '"'),
  '&#34;', '"'),
  '&lt;', '<'),
  '&gt;', '>')
WHERE name LIKE '%&%';
