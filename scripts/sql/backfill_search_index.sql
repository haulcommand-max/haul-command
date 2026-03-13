-- =============================================================================
-- BACKFILL: Insert all directory_listings into search_documents
-- =============================================================================
-- Problem: 0 out of 6,949 directory_listings are indexed in search_documents.
--          The 2,883 existing records are from legacy 'operator' (2875) and 'load' (8).
--
-- This query inserts all directory_listings into search_documents using
-- ON CONFLICT to avoid duplicates if the entity_id already exists.
--
-- Safe to rerun: Uses INSERT ... ON CONFLICT DO UPDATE.
-- Rows affected: 6,949 (verified 2026-03-13)
-- Schema verified: search_documents has UNIQUE(entity_type, entity_id)
-- Column verified: directory_listings has NO verification_status column → defaults false
-- metadata->>'services' verified: 2,339 rows have array-type, remainder NULL → safe
-- NULL metadata: 0 rows → safe
-- NULL name: 0 rows → safe
-- =============================================================================

INSERT INTO search_documents (
    entity_type,
    entity_id,
    title,
    subtitle,
    country_code,
    region,
    city,
    tags,
    is_verified,
    trust_score,
    last_active_at,
    lat,
    lng,
    body,
    updated_at
)
SELECT
    dl.entity_type,
    dl.id::text,
    dl.name,
    -- subtitle = "Entity Type in City, State"
    CASE 
        WHEN dl.city IS NOT NULL AND dl.city <> '' AND dl.region_code IS NOT NULL AND dl.region_code <> ''
            THEN INITCAP(REPLACE(dl.entity_type, '_', ' ')) || ' in ' || dl.city || ', ' || dl.region_code
        WHEN dl.region_code IS NOT NULL AND dl.region_code <> ''
            THEN INITCAP(REPLACE(dl.entity_type, '_', ' ')) || ' in ' || dl.region_code
        ELSE INITCAP(REPLACE(dl.entity_type, '_', ' '))
    END,
    dl.country_code,
    dl.region_code,
    dl.city,
    CASE 
        WHEN dl.entity_type IN ('pilot_car_operator', 'pilot_driver')
            THEN ARRAY[dl.entity_type, COALESCE(dl.source, 'unknown'), 'pilot_car_operator_family']::text[]
        ELSE ARRAY[dl.entity_type, COALESCE(dl.source, 'unknown')]::text[]
    END,
    -- No verification_status column exists → default all to false
    false,
    COALESCE(dl.rank_score, 0),
    dl.updated_at,
    dl.latitude,
    dl.longitude,
    -- body = name + city + state + entity_type + services text (for FTS)
    COALESCE(dl.name, '') || ' ' || 
    COALESCE(dl.city, '') || ' ' || 
    COALESCE(dl.region_code, '') || ' ' ||
    REPLACE(dl.entity_type, '_', ' ') || ' ' ||
    COALESCE(dl.metadata->>'services', ''),
    NOW()
FROM directory_listings dl
ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    country_code = EXCLUDED.country_code,
    region = EXCLUDED.region,
    city = EXCLUDED.city,
    tags = EXCLUDED.tags,
    is_verified = EXCLUDED.is_verified,
    trust_score = EXCLUDED.trust_score,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    body = EXCLUDED.body,
    updated_at = NOW();
