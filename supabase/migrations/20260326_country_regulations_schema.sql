-- ============================================================
-- DIESEL BLOOD USA — Country Regulations Schema
-- Run in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS country_regulations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_name TEXT NOT NULL,
  country_code CHAR(2) NOT NULL UNIQUE,
  region TEXT,
  measurement_system TEXT,
  currency_code CHAR(3),

  -- Escort Qualification
  escort_min_age INT,
  escort_license_required BOOLEAN,
  escort_training_course TEXT,
  escort_training_hours INT,
  escort_renewal_years INT,

  -- Escort Vehicle
  vehicle_min_gvwr_kg NUMERIC,
  vehicle_max_gvwr_kg NUMERIC,
  warning_light_color TEXT,
  warning_light_class TEXT,
  flag_size_cm TEXT,
  flag_colors TEXT,
  flag_angle_degrees TEXT,

  -- On-Board Equipment
  fire_extinguisher_spec TEXT,
  cone_count INT,
  cone_size_cm INT,
  height_pole_threshold_m NUMERIC,
  height_pole_clearance_cm INT,

  -- Load Dimensions
  max_width_no_escort_m NUMERIC,
  max_width_one_escort_m NUMERIC,
  max_width_two_escorts_m NUMERIC,
  max_width_le_escort_m NUMERIC,
  max_height_no_escort_m NUMERIC,
  max_height_one_escort_m NUMERIC,
  max_length_no_escort_m NUMERIC,
  max_length_one_escort_m NUMERIC,
  max_length_two_escorts_m NUMERIC,
  max_length_le_escort_m NUMERIC,

  -- Travel Restrictions
  daytime_travel_only BOOLEAN,
  travel_window TEXT,
  holiday_restrictions TEXT,
  visibility_minimum_m INT,
  weekend_movement_allowed BOOLEAN,

  -- Survey Letter
  survey_letter_width_threshold_m NUMERIC,
  survey_letter_height_threshold_m NUMERIC,
  survey_letter_height_clearance_cm INT,
  survey_letter_width_clearance_m NUMERIC,

  -- Rail Crossings
  rail_crossing_advance_required BOOLEAN,
  rail_crossing_clearance_threshold_cm INT,

  -- Permit Office
  permit_office_name TEXT,
  permit_office_phone TEXT,
  permit_office_website TEXT,
  online_permit_available BOOLEAN,

  -- Apparel
  apparel_day_class TEXT,
  apparel_night_class TEXT,

  -- Flagging
  flagging_paddle_spec TEXT,
  flagging_flag_spec TEXT,
  flagging_statute TEXT,

  -- Warning Signs
  oversize_banner_text TEXT,
  banner_min_size TEXT,

  -- Autonomous Vehicles
  av_corridors_exist BOOLEAN,
  av_regulatory_body TEXT,
  av_corridor_notes TEXT,

  -- Metadata
  data_confidence_score INT CHECK (data_confidence_score BETWEEN 1 AND 5),
  data_sources TEXT[],
  last_verified DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_country_regulations_code ON country_regulations(country_code);
CREATE INDEX IF NOT EXISTS idx_country_regulations_region ON country_regulations(region);
CREATE INDEX IF NOT EXISTS idx_country_regulations_av ON country_regulations(av_corridors_exist);
CREATE INDEX IF NOT EXISTS idx_country_regulations_confidence ON country_regulations(data_confidence_score);

-- RLS
ALTER TABLE country_regulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "country_regulations: public read" ON country_regulations FOR SELECT USING (true);
-- Only service_role can insert/update (data pipeline only)

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_country_regulations_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER country_regulations_updated_at
  BEFORE UPDATE ON country_regulations
  FOR EACH ROW EXECUTE FUNCTION update_country_regulations_timestamp();
