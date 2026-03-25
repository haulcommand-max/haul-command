-- Create country_regulations table for global escort and dimension rules
CREATE TABLE IF NOT EXISTS public.country_regulations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_name TEXT NOT NULL,
    country_code CHAR(2) NOT NULL UNIQUE,
    region TEXT,
    measurement_system TEXT,
    currency_code CHAR(3),
    escort_min_age INT,
    escort_license_required BOOLEAN,
    escort_training_hours INT,
    escort_renewal_years INT,
    vehicle_min_gvwr_kg NUMERIC,
    vehicle_max_gvwr_kg NUMERIC,
    warning_light_color TEXT,
    warning_light_class TEXT,
    flag_size_cm TEXT,
    flag_colors TEXT,
    fire_extinguisher_spec TEXT,
    cone_count INT,
    cone_size_cm INT,
    height_pole_threshold_m NUMERIC,
    height_pole_clearance_cm INT,
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
    daytime_travel_only BOOLEAN,
    holiday_restrictions TEXT,
    visibility_minimum_m INT,
    weekend_movement_allowed BOOLEAN,
    survey_letter_width_threshold_m NUMERIC,
    survey_letter_height_threshold_m NUMERIC,
    permit_office_name TEXT,
    permit_office_phone TEXT,
    permit_office_website TEXT,
    online_permit_available BOOLEAN,
    apparel_day_class TEXT,
    apparel_night_class TEXT,
    oversize_banner_text TEXT,
    banner_min_size TEXT,
    av_corridors_exist BOOLEAN,
    av_regulatory_body TEXT,
    av_corridor_notes TEXT,
    data_confidence_score INT CHECK (data_confidence_score BETWEEN 1 AND 5),
    data_sources TEXT[],
    last_verified DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.country_regulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to country_regulations"
    ON public.country_regulations
    FOR SELECT
    USING (true);

-- Trigger to update 'updated_at' column automatically
CREATE OR REPLACE FUNCTION update_country_regulations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();    
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_country_regulations_updated_at
BEFORE UPDATE ON public.country_regulations
FOR EACH ROW
EXECUTE FUNCTION update_country_regulations_updated_at();
