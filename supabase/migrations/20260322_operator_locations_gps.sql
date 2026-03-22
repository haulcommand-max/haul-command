-- ══════════════════════════════════════════════════════════════
-- HAUL COMMAND — Operator Locations + GPS Tracking
-- Migration: 20260322_operator_locations_gps
-- ══════════════════════════════════════════════════════════════

-- Live operator positions (phone GPS or Motive ELD)
CREATE TABLE IF NOT EXISTS operator_locations (
  operator_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL,
  heading DECIMAL,
  speed DECIMAL,
  source TEXT DEFAULT 'phone' CHECK (source IN ('phone','motive','manual')),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operator_locations_updated ON operator_locations(updated_at);
CREATE INDEX IF NOT EXISTS idx_operator_locations_geo ON operator_locations(lat, lng);

-- RLS
ALTER TABLE operator_locations ENABLE ROW LEVEL SECURITY;

-- Operators can upsert their own location
CREATE POLICY operator_locations_own_write ON operator_locations
  FOR ALL USING (auth.uid() = operator_id)
  WITH CHECK (auth.uid() = operator_id);

-- Authenticated users can read all locations (brokers need this)
CREATE POLICY operator_locations_read ON operator_locations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Service role bypass
CREATE POLICY operator_locations_service ON operator_locations
  FOR ALL USING (auth.role() = 'service_role');

-- Auto-expire: cleanup function for stale locations (>5 min)
CREATE OR REPLACE FUNCTION cleanup_stale_operator_locations()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM operator_locations WHERE updated_at < now() - interval '5 minutes';
END;
$$;
