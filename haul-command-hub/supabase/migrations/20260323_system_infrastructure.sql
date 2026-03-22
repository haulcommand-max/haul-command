-- ═══════════════════════════════════════════════════════════════
-- System Errors Table (Sentry fallback)
-- ═══════════════════════════════════════════════════════════════

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

CREATE INDEX IF NOT EXISTS idx_system_errors_route
  ON system_errors (route);
CREATE INDEX IF NOT EXISTS idx_system_errors_created
  ON system_errors (created_at DESC);

ALTER TABLE system_errors ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- Global Countries Table (57-country framework)
-- ═══════════════════════════════════════════════════════════════

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

CREATE INDEX IF NOT EXISTS idx_global_countries_status
  ON global_countries (status);
CREATE INDEX IF NOT EXISTS idx_global_countries_tier
  ON global_countries (tier);

ALTER TABLE global_countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "global_countries_read_all" ON global_countries
  FOR SELECT USING (true);

-- Seed all 57 countries with centroids
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
  name = EXCLUDED.name,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  flag = EXCLUDED.flag,
  tier = EXCLUDED.tier;

-- ═══════════════════════════════════════════════════════════════
-- Copilot Cache Table (for compliance caching)
-- ═══════════════════════════════════════════════════════════════

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

CREATE INDEX IF NOT EXISTS idx_copilot_cache_hash
  ON copilot_cache (question_hash);
CREATE INDEX IF NOT EXISTS idx_copilot_cache_jurisdiction
  ON copilot_cache (jurisdiction);
CREATE INDEX IF NOT EXISTS idx_copilot_cache_expires
  ON copilot_cache (expires_at);

ALTER TABLE copilot_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "copilot_cache_read_all" ON copilot_cache
  FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════
-- hc_events table (if not exists)
-- Unified event tracking for analytics
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_events_type
  ON hc_events (event_type);
CREATE INDEX IF NOT EXISTS idx_hc_events_created
  ON hc_events (created_at DESC);

ALTER TABLE hc_events ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- Fix HTML entities in operator names
-- ═══════════════════════════════════════════════════════════════

UPDATE directory_listings SET name = replace(replace(replace(replace(replace(replace(name,
  '&#39;', ''''),
  '&amp;', '&'),
  '&quot;', '"'),
  '&#34;', '"'),
  '&lt;', '<'),
  '&gt;', '>')
WHERE name LIKE '%&%';
