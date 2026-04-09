-- Migration: 20260408_011_training_florida_seed.sql
-- Seed Florida Pilot/Escort Qualification rules and curriculum modules

-- 1. Insert Florida Jurisdiction override
WITH us_base AS (
    INSERT INTO public.training_jurisdictions 
        (country_code, region_code, credential_type, is_mandatory, official_path_url, validity_years, refresher_allowed, refresher_grace_period_days)
    VALUES 
        ('US', 'US-FL', 'state-by-state', true, 'https://www.fdot.gov', 4, true, 90)
    ON CONFLICT (country_code, COALESCE(region_code, '')) DO UPDATE
        SET credential_type = EXCLUDED.credential_type
    RETURNING id
),
-- 2. Insert Florida Track
fl_track AS (
    INSERT INTO public.training_tracks
        (jurisdiction_id, track_slug, title, track_type, official_course_hours_total, hc_estimated_prep_hours_total)
    SELECT id, 'florida-pilot-escort-certification', 'Florida Pilot/Escort Qualification Prep', 'certification', 8.0, 6.0
    FROM us_base
    ON CONFLICT (track_slug, jurisdiction_id) DO UPDATE
        SET title = EXCLUDED.title
    RETURNING id
)
-- 3. Insert Florida Modules
INSERT INTO public.training_modules 
    (track_id, sequence_order, module_slug, module_title, official_session_title, official_minutes, hc_estimated_minutes, visible_text_ready, structured_data_ready, search_ready)
SELECT 
    id AS track_id, m.seq, m.slug, m.title, m.official_title, m.off_min, m.hc_min, true, true, true
FROM fl_track CROSS JOIN (
    VALUES
        (1, 'module-1-introduction', 'Introduction & Overview', 'Introduction', 60, 45),
        (2, 'module-2-the-driver', 'The Driver & Requirements', 'Driver', 90, 60),
        (3, 'module-3-the-vehicle', 'The Vehicle & Equipment', 'Vehicle', 90, 60),
        (4, 'module-4-the-load', 'The Load & Permitting', 'Load', 60, 45),
        (5, 'module-5-maneuvering', 'Maneuvering & Operations', 'Maneuvering', 90, 60),
        (6, 'module-6-final-exam', 'Final Mock Exam Prep', 'Exam', 120, 90)
) AS m(seq, slug, title, official_title, off_min, hc_min)
ON CONFLICT (module_slug, track_id) DO NOTHING;

-- Insert the Claims and Verification Rules
WITH us_base AS (
    SELECT id FROM public.training_jurisdictions WHERE country_code = 'US' AND region_code = 'US-FL'
)
INSERT INTO public.training_claim_rules
    (jurisdiction_id, allowed_claims, forbidden_claims, legal_review_status)
SELECT
    id,
    '["Prepares operators for FDOT certification", "Maps to official Florida Workbook", "8-Hour Course Requirement"]'::jsonb,
    '["FDOT Approved", "State Issued Certification", "Federally Certified"]'::jsonb,
    'approved'
FROM us_base;

