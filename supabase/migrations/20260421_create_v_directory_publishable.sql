-- =============================================================================
-- HAUL COMMAND: v_directory_publishable VIEW
-- Creates the publishable directory view that the app's directory grid,
-- dossier page, and search components depend on.
-- 
-- Maps directory_listings columns → app-expected column aliases:
--   id             → contact_id
--   name           → company, name
--   region_code    → state_inferred, state_code
--   country_code   → country_code_inferred
--   entity_confidence_score → confidence_score
-- =============================================================================

-- Drop if exists to allow re-running
DROP VIEW IF EXISTS public.v_directory_publishable;

CREATE OR REPLACE VIEW public.v_directory_publishable AS
SELECT
    dl.id                           AS contact_id,
    dl.entity_id,
    dl.name                         AS company,
    dl.name,
    dl.slug,
    dl.city,
    dl.city_slug,
    dl.region_code                  AS state_inferred,
    dl.region_code                  AS state_code,
    dl.country_code                 AS country_code_inferred,
    dl.latitude,
    dl.longitude,
    dl.source,
    dl.claim_status,
    dl.rank_score,
    dl.is_visible,
    dl.entity_confidence_score      AS confidence_score,
    dl.profile_completeness,
    dl.claim_priority_score,
    dl.metadata,
    -- Derived fields the UI expects
    CASE 
        WHEN dl.entity_confidence_score >= 90 THEN 'Diamond Verified'
        WHEN dl.entity_confidence_score >= 75 THEN 'Gold Verified'
        WHEN dl.entity_confidence_score >= 50 THEN 'Standard Verified'
        ELSE 'Unverified'
    END AS confidence_tier,
    -- Extract certifications from metadata if present
    CASE 
        WHEN dl.metadata ? 'certifications' THEN 
            ARRAY(SELECT jsonb_array_elements_text(dl.metadata->'certifications'))
        ELSE NULL
    END AS certifications,
    -- Extract primary_service_area from metadata
    dl.metadata->>'primary_service_area' AS primary_service_area,
    dl.metadata->>'company_name' AS company_name,
    dl.created_at,
    dl.updated_at
FROM 
    public.directory_listings dl
WHERE 
    dl.is_visible = true;

-- Grant read access to anon and authenticated roles
GRANT SELECT ON public.v_directory_publishable TO anon;
GRANT SELECT ON public.v_directory_publishable TO authenticated;

-- Comment for documentation
COMMENT ON VIEW public.v_directory_publishable IS 
    'Publishable directory view - filters to visible operators and aliases columns for the frontend app. Used by /directory, /directory/dossier/[id], and DirectoryGrid.tsx';
