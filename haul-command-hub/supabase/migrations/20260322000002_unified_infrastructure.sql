-- ═══════════════════════════════════════════════════════════════
-- Stripe Webhook Events Dedup Table
-- Prevents processing the same Stripe event twice.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_id
  ON stripe_webhook_events (stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type
  ON stripe_webhook_events (event_type);

-- ═══════════════════════════════════════════════════════════════
-- Corridor Sponsors Table
-- Tracks which corridors have active sponsors via Stripe subscription.
-- ═══════════════════════════════════════════════════════════════

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

CREATE INDEX IF NOT EXISTS idx_corridor_sponsors_slug
  ON corridor_sponsors (corridor_slug);
CREATE INDEX IF NOT EXISTS idx_corridor_sponsors_status
  ON corridor_sponsors (status);

-- ═══════════════════════════════════════════════════════════════
-- Operator Locations Table (GPS Tracking)
-- Stores real-time operator positions from phone GPS or Motive ELD.
-- ═══════════════════════════════════════════════════════════════

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

CREATE INDEX IF NOT EXISTS idx_operator_locations_operator
  ON operator_locations (operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_locations_updated
  ON operator_locations (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_operator_locations_geo
  ON operator_locations (lat, lng);

-- Cleanup function: purge stale locations older than 5 minutes
CREATE OR REPLACE FUNCTION cleanup_stale_locations()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM operator_locations
  WHERE updated_at < now() - interval '5 minutes';
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- Motive Webhook Events Log
-- Logs all incoming Motive webhook events for debugging and replay.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS motive_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  motive_company_id TEXT,
  object_type TEXT,
  object_id TEXT,
  payload JSONB,
  category TEXT,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_motive_webhook_events_type
  ON motive_webhook_events (event_type);
CREATE INDEX IF NOT EXISTS idx_motive_webhook_events_company
  ON motive_webhook_events (motive_company_id);
CREATE INDEX IF NOT EXISTS idx_motive_webhook_events_created
  ON motive_webhook_events (created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- Motive Vehicle Positions
-- Latest GPS positions from Motive-connected fleet vehicles.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS motive_vehicle_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  motive_vehicle_id TEXT NOT NULL,
  provider_id TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed_mph DOUBLE PRECISION,
  driver_name TEXT,
  vehicle_number TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_motive_vehicle_positions_vehicle
  ON motive_vehicle_positions (motive_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_motive_vehicle_positions_provider
  ON motive_vehicle_positions (provider_id);
CREATE INDEX IF NOT EXISTS idx_motive_vehicle_positions_recorded
  ON motive_vehicle_positions (recorded_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- Motive Fuel Observations
-- Fuel purchase data from Motive for rate intelligence.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS motive_fuel_observations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jurisdiction_code TEXT NOT NULL,
  fuel_type TEXT DEFAULT 'diesel',
  price_per_gallon DOUBLE PRECISION,
  total_cost DOUBLE PRECISION,
  gallons DOUBLE PRECISION,
  vendor_name TEXT,
  vehicle_id TEXT,
  observed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_motive_fuel_observations_jurisdiction
  ON motive_fuel_observations (jurisdiction_code);
CREATE INDEX IF NOT EXISTS idx_motive_fuel_observations_observed
  ON motive_fuel_observations (observed_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- Motive OAuth Tokens
-- Stored per-provider OAuth tokens for Motive API access.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS motive_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id TEXT UNIQUE NOT NULL,
  motive_company_id TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  company_name TEXT,
  dot_number TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_motive_tokens_provider
  ON motive_tokens (provider_id);
CREATE INDEX IF NOT EXISTS idx_motive_tokens_company
  ON motive_tokens (motive_company_id);

-- ═══════════════════════════════════════════════════════════════
-- GPS Breadcrumbs (Offline Queue)
-- Stores breadcrumbs recorded while device was offline.
-- ═══════════════════════════════════════════════════════════════

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

CREATE INDEX IF NOT EXISTS idx_gps_breadcrumbs_operator
  ON gps_breadcrumbs (operator_id);
CREATE INDEX IF NOT EXISTS idx_gps_breadcrumbs_recorded
  ON gps_breadcrumbs (recorded_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════

-- Stripe events: service role only (no public access)
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE corridor_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE motive_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE motive_vehicle_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE motive_fuel_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE motive_tokens ENABLE ROW LEVEL SECURITY;

-- Operator locations: write own, read all (for live map)
ALTER TABLE operator_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operator_locations_read_all" ON operator_locations
  FOR SELECT USING (true);

-- GPS breadcrumbs: write own, read own
ALTER TABLE gps_breadcrumbs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gps_breadcrumbs_read_all" ON gps_breadcrumbs
  FOR SELECT USING (true);

-- Corridor sponsors: public read, service write
CREATE POLICY "corridor_sponsors_read_all" ON corridor_sponsors
  FOR SELECT USING (true);
