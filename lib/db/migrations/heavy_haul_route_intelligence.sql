-- ============================================================================
-- HEAVY HAUL ROUTE INTELLIGENCE — Database Schema
-- Purpose-built for oversize/overweight load transport across 57 countries.
-- NOT generic GPS. Permit-enforced, clearance-aware, convoy-coordinated.
-- ============================================================================

-- 1. Permit routes — the actual approved path for a specific load
CREATE TABLE IF NOT EXISTS permit_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID REFERENCES hc_loads(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL DEFAULT 'US',
  origin_lat DECIMAL(10,8),
  origin_lng DECIMAL(11,8),
  destination_lat DECIMAL(10,8),
  destination_lng DECIMAL(11,8),
  route_geojson JSONB NOT NULL,
  total_distance_km DECIMAL,
  permit_number TEXT,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  travel_windows JSONB,
  load_dimensions JSONB, -- {width_m, height_m, length_m, weight_kg}
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_permit_routes_load ON permit_routes(load_id);
CREATE INDEX IF NOT EXISTS idx_permit_routes_country ON permit_routes(country_code);

-- 2. Bridge and overhead clearance database
CREATE TABLE IF NOT EXISTS clearance_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  geom GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography
  ) STORED,
  country_code TEXT NOT NULL DEFAULT 'US',
  clearance_posted_m DECIMAL,
  clearance_actual_m DECIMAL,
  clearance_source TEXT DEFAULT 'osm', -- osm, dot, crowdsourced, permit
  obstacle_type TEXT DEFAULT 'bridge', -- bridge, overpass, railroad, power_line, tunnel
  road_name TEXT,
  osm_way_id BIGINT,
  verified_by_count INTEGER DEFAULT 0,
  last_verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clearance_geom ON clearance_points USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_clearance_country ON clearance_points(country_code);
CREATE INDEX IF NOT EXISTS idx_clearance_type ON clearance_points(obstacle_type);

-- 3. Weight restricted roads
CREATE TABLE IF NOT EXISTS weight_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  geom GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography
  ) STORED,
  country_code TEXT NOT NULL DEFAULT 'US',
  road_name TEXT,
  max_gross_weight_kg INTEGER,
  max_axle_weight_kg INTEGER,
  restriction_type TEXT DEFAULT 'permanent', -- permanent, seasonal, emergency
  active_from DATE,
  active_until DATE,
  osm_way_id BIGINT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weight_geom ON weight_restrictions USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_weight_country ON weight_restrictions(country_code);
CREATE INDEX IF NOT EXISTS idx_weight_type ON weight_restrictions(restriction_type);

-- 4. Convoy real-time positions
CREATE TABLE IF NOT EXISTS convoy_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID REFERENCES hc_loads(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'load_driver', -- lead_pilot, rear_pilot, load_driver, supervisor
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  speed_kmh DECIMAL,
  heading_degrees INTEGER,
  accuracy_m DECIMAL,
  on_permit_route BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(load_id, operator_id)
);

CREATE INDEX IF NOT EXISTS idx_convoy_load ON convoy_positions(load_id);
CREATE INDEX IF NOT EXISTS idx_convoy_updated ON convoy_positions(updated_at);

-- 5. Route deviation alerts
CREATE TABLE IF NOT EXISTS route_deviations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID REFERENCES hc_loads(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES profiles(id),
  deviation_lat DECIMAL(10,8),
  deviation_lng DECIMAL(11,8),
  distance_from_route_m INTEGER,
  severity TEXT DEFAULT 'warning', -- info, warning, critical
  detected_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution TEXT -- returned_to_route, rerouted, emergency_stop, false_alarm
);

CREATE INDEX IF NOT EXISTS idx_deviation_load ON route_deviations(load_id);
CREATE INDEX IF NOT EXISTS idx_deviation_unresolved ON route_deviations(load_id) WHERE resolved_at IS NULL;

-- 6. Tribal knowledge checkpoints (crowdsourced)
CREATE TABLE IF NOT EXISTS route_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  geom GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography
  ) STORED,
  country_code TEXT NOT NULL DEFAULT 'US',
  checkpoint_type TEXT DEFAULT 'weigh_station', -- weigh_station, dot_checkpoint, port_of_entry, toll, low_clearance_warning, timing_issue, road_condition
  name TEXT,
  description TEXT,
  severity TEXT DEFAULT 'info', -- info, caution, warning, critical
  reported_by UUID REFERENCES profiles(id),
  verified_count INTEGER DEFAULT 0,
  last_reported_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkpoint_geom ON route_checkpoints USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_checkpoint_country ON route_checkpoints(country_code);
CREATE INDEX IF NOT EXISTS idx_checkpoint_type ON route_checkpoints(checkpoint_type);

-- 7. Post-job intel submissions
CREATE TABLE IF NOT EXISTS route_intel_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID REFERENCES hc_loads(id),
  operator_id UUID REFERENCES profiles(id),
  clearance_concerns TEXT,
  strict_checkpoints BOOLEAN,
  checkpoint_lat DECIMAL(10,8),
  checkpoint_lng DECIMAL(11,8),
  timing_issues TEXT,
  trust_points_awarded INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intel_operator ON route_intel_submissions(operator_id);

-- Enable RLS
ALTER TABLE permit_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearance_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE convoy_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_deviations ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_intel_submissions ENABLE ROW LEVEL SECURITY;

-- Public read for clearance/weight/checkpoints (crowdsourced knowledge)
CREATE POLICY "Public read clearance" ON clearance_points FOR SELECT USING (true);
CREATE POLICY "Public read weight" ON weight_restrictions FOR SELECT USING (true);
CREATE POLICY "Public read checkpoints" ON route_checkpoints FOR SELECT USING (true);

-- Authenticated write for intel submissions
CREATE POLICY "Auth insert intel" ON route_intel_submissions FOR INSERT WITH CHECK (auth.uid() = operator_id);
CREATE POLICY "Auth read own intel" ON route_intel_submissions FOR SELECT USING (auth.uid() = operator_id);

-- Enable Realtime for convoy positions
ALTER PUBLICATION supabase_realtime ADD TABLE convoy_positions;
