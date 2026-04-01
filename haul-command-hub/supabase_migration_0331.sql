-- Fix the typo in the superload threshold column
ALTER TABLE IF EXISTS hc_jurisdiction_regulations 
RENAME COLUMN superload_threhold_length_ft TO superload_threshold_length_ft;

-- To be safe, try renaming other variations if they exist
DO $$
BEGIN
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='hc_jurisdiction_regulations' and column_name='superload_threhold_width_ft') THEN
        ALTER TABLE hc_jurisdiction_regulations RENAME COLUMN superload_threhold_width_ft TO superload_threshold_width_ft;
    END IF;
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='hc_jurisdiction_regulations' and column_name='superload_threhold_height_ft') THEN
        ALTER TABLE hc_jurisdiction_regulations RENAME COLUMN superload_threhold_height_ft TO superload_threshold_height_ft;
    END IF;
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='hc_jurisdiction_regulations' and column_name='superload_threhold_weight_lbs') THEN
        ALTER TABLE hc_jurisdiction_regulations RENAME COLUMN superload_threhold_weight_lbs TO superload_threshold_weight_lbs;
    END IF;
END $$;

-- Add UNIQUE constraints to certification/regulation tables to prevent duplicate states
ALTER TABLE hc_jurisdiction_regulations 
DROP CONSTRAINT IF EXISTS unique_jurisdiction_regulations;

ALTER TABLE hc_jurisdiction_regulations 
ADD CONSTRAINT unique_jurisdiction_regulations UNIQUE (country_code, admin1_code);

ALTER TABLE hc_certification_requirements 
DROP CONSTRAINT IF EXISTS unique_certification_requirements;

ALTER TABLE hc_certification_requirements 
ADD CONSTRAINT unique_certification_requirements UNIQUE (country_code, admin1_code);
