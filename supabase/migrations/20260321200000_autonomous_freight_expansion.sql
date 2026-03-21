-- Autonomous Freight Expansion Migration
-- Adds tables for AV readiness, affiliate tracking, GDPR, intel feed, and regulatory alerts

-- Operator AV readiness badges
CREATE TABLE IF NOT EXISTS operator_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type text NOT NULL CHECK (badge_type IN ('av_ready', 'drone_survey', 'superload', 'night_certified')),
  earned_at timestamptz DEFAULT now(),
  verified_by uuid,
  metadata jsonb DEFAULT '{}',
  UNIQUE(user_id, badge_type)
);

ALTER TABLE operator_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all badges" ON operator_badges FOR SELECT USING (true);
CREATE POLICY "Users can manage own badges" ON operator_badges FOR ALL USING (auth.uid() = user_id);

-- Affiliate tracking
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  partner text NOT NULL,
  source text,
  url text,
  clicked_at timestamptz DEFAULT now(),
  converted boolean DEFAULT false,
  conversion_value numeric(10,2)
);

ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view affiliate data" ON affiliate_clicks FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- GDPR consent tracking
CREATE TABLE IF NOT EXISTS gdpr_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN ('marketing', 'analytics', 'essential', 'third_party')),
  granted boolean DEFAULT false,
  granted_at timestamptz,
  revoked_at timestamptz,
  ip_address text,
  UNIQUE(user_id, consent_type)
);

ALTER TABLE gdpr_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own consent" ON gdpr_consents FOR ALL USING (auth.uid() = user_id);

-- Intelligence feed articles
CREATE TABLE IF NOT EXISTS intel_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  category text NOT NULL CHECK (category IN ('autonomous', 'regulation', 'market', 'technology', 'industry')),
  impact text CHECK (impact IN ('high', 'medium', 'low')),
  source_url text,
  published_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

ALTER TABLE intel_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read intel" ON intel_articles FOR SELECT USING (true);

-- Regulatory alerts
CREATE TABLE IF NOT EXISTS regulatory_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction text NOT NULL,
  title text NOT NULL,
  summary text,
  impact text CHECK (impact IN ('high', 'medium', 'low')),
  category text CHECK (category IN ('av_escort', 'permit', 'insurance', 'certification', 'weight_limit')),
  effective_date date,
  source text,
  affected_states text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE regulatory_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read alerts" ON regulatory_alerts FOR SELECT USING (true);

-- Enterprise API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_hash text NOT NULL,
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code int,
  response_ms int,
  tier text DEFAULT 'free',
  called_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_key ON api_usage(api_key_hash, called_at);

-- Route intelligence (tribal knowledge)
CREATE TABLE IF NOT EXISTS route_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  corridor text NOT NULL,
  intel_type text CHECK (intel_type IN ('hazard', 'construction', 'bridge_restriction', 'fuel_stop', 'rest_area', 'weigh_station', 'tip')),
  description text NOT NULL,
  lat numeric(10,6),
  lng numeric(10,6),
  upvotes int DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE route_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read route intel" ON route_intelligence FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add intel" ON route_intelligence FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users manage own intel" ON route_intelligence FOR UPDATE USING (auth.uid() = user_id);
