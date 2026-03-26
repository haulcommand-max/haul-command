-- ============================================================
-- HC Route — Database Schema
-- Permit-Aware Oversize Load Routing Engine
-- ============================================================
-- This migration creates the core tables for HC Route:
-- 1. road_restrictions — Physical constraints (bridges, roads, tunnels)
-- 2. vehicle_profiles — Load/vehicle dimension profiles
-- 3. permit_routes — Digitized permit routes with GPS waypoints
-- 4. hazard_reports — Crowd-sourced hazard reports (HC Waze)
-- ============================================================

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── 1. ROAD RESTRICTIONS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS road_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Location
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  osm_way_id BIGINT,
  road_name TEXT,
  state_code CHAR(2),
  county TEXT,
  
  -- Restriction Type
  restriction_type TEXT NOT NULL CHECK (restriction_type IN (
    'bridge_height', 'bridge_weight', 'road_width', 'road_weight',
    'turn_radius', 'school_zone', 'residential', 'time_restricted',
    'seasonal', 'construction', 'utility_line', 'no_oversize',
    'no_hazmat', 'grade', 'tunnel'
  )),
  
  -- Restriction Values
  max_height_ft REAL,
  max_width_ft REAL,
  max_weight_lbs INTEGER,
  max_length_ft REAL,
  max_axle_weight_lbs INTEGER,
  min_turn_radius_ft REAL,
  
  -- Time-based restrictions
  active_days TEXT[],
  active_start_time TIME,
  active_end_time TIME,
  seasonal_start DATE,
  seasonal_end DATE,
  
  -- Source & Confidence
  source TEXT NOT NULL CHECK (source IN (
    'nbi', 'osm', 'state_dot', 'crowd_sourced', 'lidar', 'manual'
  )),
  confidence_score REAL DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  photo_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for fast geo queries
CREATE INDEX IF NOT EXISTS idx_restrictions_geo 
  ON road_restrictions USING GIST (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  );

CREATE INDEX IF NOT EXISTS idx_restrictions_type ON road_restrictions(restriction_type);
CREATE INDEX IF NOT EXISTS idx_restrictions_state ON road_restrictions(state_code);
CREATE INDEX IF NOT EXISTS idx_restrictions_source ON road_restrictions(source);

-- ─── 2. VEHICLE PROFILES ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vehicle_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID,
  
  -- Profile info
  profile_name TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN (
    'mobile_home', 'modular_building', 'heavy_equipment',
    'wind_turbine_blade', 'transformer', 'construction_beam',
    'military_vehicle', 'crane', 'house_move', 'custom'
  )),
  
  -- Dimensions (imperial for US)
  total_height_ft REAL NOT NULL,
  total_width_ft REAL NOT NULL,
  total_length_ft REAL NOT NULL,
  gross_weight_lbs INTEGER NOT NULL,
  num_axles INTEGER DEFAULT 5,
  axle_weight_lbs INTEGER,
  min_turn_radius_ft REAL,
  
  -- Safety margins
  height_buffer_ft REAL DEFAULT 0.5,
  width_buffer_ft REAL DEFAULT 1.0,
  
  -- Requirements
  requires_escort BOOLEAN DEFAULT false,
  requires_pilot_car BOOLEAN DEFAULT false,
  requires_police_escort BOOLEAN DEFAULT false,
  requires_utility_notification BOOLEAN DEFAULT false,
  hazmat BOOLEAN DEFAULT false,
  
  -- Flags
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_operator ON vehicle_profiles(operator_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_type ON vehicle_profiles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_template ON vehicle_profiles(is_template) WHERE is_template = true;

-- ─── 3. PERMIT ROUTES ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS permit_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID,
  load_id UUID,
  vehicle_profile_id UUID REFERENCES vehicle_profiles(id),
  
  -- Permit info
  permit_number TEXT NOT NULL,
  issuing_state CHAR(2) NOT NULL,
  permit_type TEXT CHECK (permit_type IN (
    'single_trip', 'annual', 'multi_trip', 'superload'
  )),
  
  -- Permitted dimensions
  permitted_height_ft REAL,
  permitted_width_ft REAL,
  permitted_length_ft REAL,
  permitted_weight_lbs INTEGER,
  
  -- Route endpoints
  origin_address TEXT,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  destination_address TEXT,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  
  -- Digitized route
  route_geometry GEOMETRY(LineString, 4326),
  waypoints JSONB,
  
  -- Validation
  route_validated BOOLEAN DEFAULT false,
  restrictions_checked BOOLEAN DEFAULT false,
  conflict_count INTEGER DEFAULT 0,
  conflicts JSONB,
  
  -- Travel restrictions from permit
  travel_time_start TIME,
  travel_time_end TIME,
  no_travel_days TEXT[],
  no_travel_dates DATE[],
  max_speed_mph INTEGER,
  
  -- Permit document
  permit_pdf_url TEXT,
  permit_raw_text TEXT,
  
  -- Validity
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permit_routes_geo 
  ON permit_routes USING GIST (route_geometry);
CREATE INDEX IF NOT EXISTS idx_permit_routes_operator ON permit_routes(operator_id);
CREATE INDEX IF NOT EXISTS idx_permit_routes_state ON permit_routes(issuing_state);
CREATE INDEX IF NOT EXISTS idx_permit_routes_valid
  ON permit_routes(valid_from, valid_until) WHERE valid_until IS NOT NULL;

-- ─── 4. HAZARD REPORTS (HC WAZE) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS hazard_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID,
  operator_id UUID,
  
  -- Location
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  road_name TEXT,
  direction TEXT,
  
  -- Hazard type
  hazard_type TEXT NOT NULL CHECK (hazard_type IN (
    -- Oversize-Specific
    'low_bridge', 'low_utility_line', 'narrow_road', 'tight_turn',
    'soft_shoulder', 'steep_grade', 'low_tree_branches', 'construction_overhead',
    -- General (Waze-style)
    'construction', 'road_closure', 'lane_closure', 'accident', 'police',
    'road_damage', 'flooding', 'weather', 'school_zone_active', 'weight_station_open',
    -- Positive Reports
    'good_route', 'clearance_verified'
  )),
  
  -- Details
  description TEXT,
  measured_height_ft REAL,
  measured_width_ft REAL,
  photo_urls TEXT[],
  
  -- Severity & Status
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  
  -- Community validation
  confirmations INTEGER DEFAULT 0,
  denials INTEGER DEFAULT 0,
  confidence_score REAL DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- Timestamps
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  last_confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hazards_geo 
  ON hazard_reports USING GIST (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  );
CREATE INDEX IF NOT EXISTS idx_hazards_active 
  ON hazard_reports(is_active, hazard_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hazards_reporter ON hazard_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_hazards_severity 
  ON hazard_reports(severity) WHERE is_active = true;

-- ─── 5. SEED: VEHICLE PROFILE TEMPLATES ───────────────────────────────

INSERT INTO vehicle_profiles (profile_name, vehicle_type, total_height_ft, total_width_ft, total_length_ft, gross_weight_lbs, num_axles, requires_escort, requires_pilot_car, is_template)
VALUES
  ('14-Wide Single-Wide Mobile Home', 'mobile_home', 14.5, 14.0, 76.0, 28000, 3, true, true, true),
  ('16-Wide Single-Wide Mobile Home', 'mobile_home', 14.5, 16.0, 76.0, 32000, 3, true, true, true),
  ('Double-Wide Mobile Home (Half)', 'mobile_home', 14.5, 14.0, 60.0, 22000, 3, true, true, true),
  ('CAT 390F Excavator', 'heavy_equipment', 13.0, 12.5, 55.0, 95000, 5, true, false, true),
  ('D8T Dozer', 'heavy_equipment', 12.0, 14.0, 50.0, 82000, 5, true, false, true),
  ('Liebherr LTM 1300 Crane', 'crane', 13.5, 10.0, 65.0, 120000, 7, true, true, true),
  ('Wind Turbine Blade (60m)', 'wind_turbine_blade', 14.0, 12.0, 200.0, 45000, 5, true, true, true),
  ('Modular Building Section', 'modular_building', 16.0, 16.0, 70.0, 50000, 5, true, true, true),
  ('Large Transformer', 'transformer', 14.0, 14.0, 45.0, 200000, 9, true, true, true),
  ('House Move (Full Structure)', 'house_move', 25.0, 30.0, 60.0, 80000, 6, true, true, true)
ON CONFLICT DO NOTHING;

-- ─── DONE ─────────────────────────────────────────────────────────────
-- HC Route schema ready. Next steps:
-- 1. Import FHWA NBI data (620K bridges) → road_restrictions
-- 2. Import OSM maxheight/maxweight tags → road_restrictions  
-- 3. Deploy GraphHopper with custom oversize vehicle profile
-- 4. Build permit PDF → OCR → route digitization pipeline
-- 5. Build HC Waze hazard reporting in driver app
