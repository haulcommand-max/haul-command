-- ═══════════════════════════════════════════════════════════════
-- HAUL COMMAND — Operator Location & Offline Support Tables
-- Migration: 20260322_operator_locations.sql
-- ═══════════════════════════════════════════════════════════════

-- ── Operator Live Locations (Phone GPS) ──
CREATE TABLE IF NOT EXISTS operator_locations (
  operator_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL,
  heading DECIMAL,
  speed DECIMAL,
  source TEXT DEFAULT 'phone_gps' CHECK (source IN ('phone_gps', 'motive', 'traccar')),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE operator_locations IS 'Real-time operator GPS positions from phone, Motive ELD, or Traccar. Auto-expires after 5min of no update.';

-- Index for time-based queries (active operators)
CREATE INDEX IF NOT EXISTS idx_operator_locations_updated
  ON operator_locations (updated_at DESC);

-- Spatial index for geo-proximity queries (nearby operators)
CREATE INDEX IF NOT EXISTS idx_operator_locations_geo
  ON operator_locations (lat, lng);

-- ── Row Level Security ──
ALTER TABLE operator_locations ENABLE ROW LEVEL SECURITY;

-- Operators can update their own location
CREATE POLICY operator_locations_self_update ON operator_locations
  FOR ALL
  USING (auth.uid() = operator_id)
  WITH CHECK (auth.uid() = operator_id);

-- Authenticated users (brokers) can read all live positions
CREATE POLICY operator_locations_read_all ON operator_locations
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Service role can do everything
CREATE POLICY operator_locations_service ON operator_locations
  FOR ALL
  USING (auth.role() = 'service_role');

-- ── Add GPS columns to gps_breadcrumbs if missing ──
ALTER TABLE gps_breadcrumbs
  ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS lat DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS lng DECIMAL(11,8),
  ADD COLUMN IF NOT EXISTS accuracy DECIMAL,
  ADD COLUMN IF NOT EXISTS heading DECIMAL,
  ADD COLUMN IF NOT EXISTS speed DECIMAL,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'phone_gps';

-- ── ELD Verified flag on profiles ──
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS eld_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS motive_connected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_sharing_enabled BOOLEAN DEFAULT true;

-- ── Create index for ELD verified operators (directory filtering) ──
CREATE INDEX IF NOT EXISTS idx_profiles_eld_verified
  ON profiles (eld_verified) WHERE eld_verified = true;

-- ═══════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════
