
-- Phase 15: Structured Regulation Layer
-- Migrating from blobs to strictly structured fields for Load Intelligence.

ALTER TABLE public.state_regulations 
ADD COLUMN IF NOT EXISTS max_width_no_permit text,
ADD COLUMN IF NOT EXISTS escort_required_width text,
ADD COLUMN IF NOT EXISTS escort_required_height text,
ADD COLUMN IF NOT EXISTS max_height_absolute text, -- 10X addition for risk logic
ADD COLUMN IF NOT EXISTS night_restrictions text,
ADD COLUMN IF NOT EXISTS weekend_rules text,
ADD COLUMN IF NOT EXISTS holiday_rules text,
ADD COLUMN IF NOT EXISTS police_required_rules text,
ADD COLUMN IF NOT EXISTS mobile_home_rules text,
ADD COLUMN IF NOT EXISTS height_pole_rules text,
ADD COLUMN IF NOT EXISTS last_verified timestamptz,
ADD COLUMN IF NOT EXISTS confidence_score int default 0;

-- Ensure indexes for performance on these fields if we query them directly
CREATE INDEX IF NOT EXISTS idx_state_regulations_logic ON public.state_regulations (state_code, country);
