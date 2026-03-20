-- =================================================================
-- Motive Integration Schema
-- Haul Command × GoMotive (App ID: 67348)
--
-- Tables:
--   motive_tokens          — OAuth2 tokens per HC provider
--   motive_vehicle_positions — Real-time GPS positions
--   motive_fuel_observations — Fuel price data from purchases
--   motive_safety_scores   — AI dashcam safety scores
--   motive_webhook_events  — Inbound webhook event log
--
-- Provider enrichment columns on existing 'providers' table
-- =================================================================

-- ─── Provider Enrichment ──────────────────────────────────────────

ALTER TABLE providers ADD COLUMN IF NOT EXISTS motive_company_id TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS motive_connected_at TIMESTAMPTZ;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS motive_safety_score NUMERIC;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS motive_fleet_size INTEGER;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS motive_hos_hours_remaining NUMERIC;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS motive_last_location JSONB;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS motive_last_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_providers_motive_company
  ON providers(motive_company_id)
  WHERE motive_company_id IS NOT NULL;

-- ─── OAuth Token Storage ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS motive_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL UNIQUE,
  motive_company_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT DEFAULT 'read',
  company_name TEXT,
  dot_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Only the service role can read tokens (never exposed to client)
ALTER TABLE motive_tokens ENABLE ROW LEVEL SECURITY;

-- ─── Vehicle Positions ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS motive_vehicle_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  motive_vehicle_id TEXT NOT NULL,
  provider_id UUID,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  heading NUMERIC,
  speed_mph NUMERIC,
  hos_hours_remaining NUMERIC,
  driver_name TEXT,
  vehicle_number TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mvp_provider
  ON motive_vehicle_positions(provider_id);
CREATE INDEX IF NOT EXISTS idx_mvp_recorded
  ON motive_vehicle_positions(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_mvp_vehicle
  ON motive_vehicle_positions(motive_vehicle_id);
-- Spatial-ish index for proximity queries (simple lat/lng range)
CREATE INDEX IF NOT EXISTS idx_mvp_coords
  ON motive_vehicle_positions(lat, lng);

ALTER TABLE motive_vehicle_positions ENABLE ROW LEVEL SECURITY;

-- Public read for vehicle positions (powers load board map)
CREATE POLICY "Public read vehicle positions"
  ON motive_vehicle_positions FOR SELECT
  USING (true);

-- ─── Fuel Observations ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS motive_fuel_observations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jurisdiction_code TEXT NOT NULL,
  fuel_type TEXT DEFAULT 'diesel',
  price_per_gallon NUMERIC,
  total_cost NUMERIC,
  gallons NUMERIC,
  vendor_name TEXT,
  vehicle_id TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mfo_jurisdiction
  ON motive_fuel_observations(jurisdiction_code);
CREATE INDEX IF NOT EXISTS idx_mfo_observed
  ON motive_fuel_observations(observed_at DESC);

ALTER TABLE motive_fuel_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read fuel observations"
  ON motive_fuel_observations FOR SELECT
  USING (true);

-- ─── Safety Scores ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS motive_safety_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID,
  motive_vehicle_id TEXT,
  vehicle_number TEXT,
  overall_score NUMERIC,
  harsh_braking_score NUMERIC,
  harsh_acceleration_score NUMERIC,
  speeding_score NUMERIC,
  idle_time_score NUMERIC,
  total_distance_miles NUMERIC,
  period_start DATE,
  period_end DATE,
  synced_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mss_provider
  ON motive_safety_scores(provider_id);
CREATE INDEX IF NOT EXISTS idx_mss_score
  ON motive_safety_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_mss_period
  ON motive_safety_scores(period_end DESC);

ALTER TABLE motive_safety_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read safety scores"
  ON motive_safety_scores FOR SELECT
  USING (true);

-- ─── Webhook Event Log ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS motive_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  motive_company_id TEXT,
  object_type TEXT,
  object_id TEXT,
  payload JSONB NOT NULL,
  category TEXT,        -- 'position' | 'safety' | 'compliance' | 'fuel' | 'dispatch'
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  received_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mwe_type
  ON motive_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_mwe_processed
  ON motive_webhook_events(processed)
  WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_mwe_received
  ON motive_webhook_events(received_at DESC);

ALTER TABLE motive_webhook_events ENABLE ROW LEVEL SECURITY;

-- ─── Helper: Average fuel price by jurisdiction ──────────────────

CREATE OR REPLACE FUNCTION hc_avg_fuel_price_by_jurisdiction(
  p_jurisdiction TEXT,
  p_days_back INTEGER DEFAULT 30
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(AVG(price_per_gallon), 0)
  FROM motive_fuel_observations
  WHERE jurisdiction_code = p_jurisdiction
    AND price_per_gallon IS NOT NULL
    AND observed_at >= now() - (p_days_back || ' days')::interval;
$$;

-- ─── Helper: Nearest vehicles to a point ─────────────────────────

CREATE OR REPLACE FUNCTION hc_nearest_motive_vehicles(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_radius_miles NUMERIC DEFAULT 50,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  motive_vehicle_id TEXT,
  provider_id UUID,
  lat NUMERIC,
  lng NUMERIC,
  heading NUMERIC,
  speed_mph NUMERIC,
  hos_hours_remaining NUMERIC,
  driver_name TEXT,
  vehicle_number TEXT,
  distance_miles NUMERIC,
  recorded_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    mvp.motive_vehicle_id,
    mvp.provider_id,
    mvp.lat,
    mvp.lng,
    mvp.heading,
    mvp.speed_mph,
    mvp.hos_hours_remaining,
    mvp.driver_name,
    mvp.vehicle_number,
    -- Haversine approximation (good enough for proximity)
    (3959 * acos(
      cos(radians(p_lat)) * cos(radians(mvp.lat)) *
      cos(radians(mvp.lng) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(mvp.lat))
    )) AS distance_miles,
    mvp.recorded_at
  FROM motive_vehicle_positions mvp
  WHERE mvp.recorded_at >= now() - interval '1 hour'
    -- Bounding box pre-filter (1 degree ≈ 69 miles)
    AND mvp.lat BETWEEN p_lat - (p_radius_miles / 69.0) AND p_lat + (p_radius_miles / 69.0)
    AND mvp.lng BETWEEN p_lng - (p_radius_miles / (69.0 * cos(radians(p_lat))))
                      AND p_lng + (p_radius_miles / (69.0 * cos(radians(p_lat))))
  HAVING (3959 * acos(
    cos(radians(p_lat)) * cos(radians(mvp.lat)) *
    cos(radians(mvp.lng) - radians(p_lng)) +
    sin(radians(p_lat)) * sin(radians(mvp.lat))
  )) <= p_radius_miles
  ORDER BY distance_miles ASC
  LIMIT p_limit;
$$;
