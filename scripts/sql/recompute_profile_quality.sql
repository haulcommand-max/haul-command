-- =============================================================================
-- RECOMPUTE: profile_completeness and entity_confidence_score
-- =============================================================================
-- Problem: avg profile_completeness = 0.6/100, avg confidence = 0.4/100
--          These near-zero scores make ranking and quality signals meaningless.
--
-- This query computes real scores based on actual data presence:
--   - profile_completeness: 0-100 based on filled fields
--   - entity_confidence_score: 0-100 based on data trustworthiness signals
--   - rank_score: weighted composite for directory sorting
--
-- Safe to rerun: UPDATE only, no inserts, idempotent.
-- Rows affected: 6,949 (verified 2026-03-13)
-- Edge cases verified:
--   NULL metadata: 0 rows → safe
--   NULL name: 0 rows → safe
--   metadata->'services' type: 2,339 array, 4,610 NULL → safe
--   No non-array services values exist → jsonb_array_length is safe
-- Expected score ranges (dry-run verified):
--   pilot_car_operator: completeness 54.8, rank 41.5 (up from 0.5 / 12.8)
--   pilot_driver:       completeness 55.6, rank 55.4 (up from 0.8 / 24.3)
--   truck_stop:         completeness 55.0, rank 29.8 (up from 0.4 / 0.0)
--   place:              completeness 30.0, rank 14.9 (up from 0.4 / 10.0)
-- =============================================================================

UPDATE directory_listings SET
    profile_completeness = (
        -- Each filled field contributes to completeness (max 100)
        CASE WHEN name IS NOT NULL AND name <> '' THEN 10 ELSE 0 END +
        CASE WHEN city IS NOT NULL AND city <> '' THEN 10 ELSE 0 END +
        CASE WHEN region_code IS NOT NULL AND region_code <> '' THEN 10 ELSE 0 END +
        CASE WHEN country_code IS NOT NULL AND country_code <> '' THEN 5 ELSE 0 END +
        CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 15 ELSE 0 END +
        CASE WHEN metadata->>'phone' IS NOT NULL AND metadata->>'phone' <> '' THEN 15 ELSE 0 END +
        CASE WHEN metadata->>'email' IS NOT NULL AND metadata->>'email' <> '' THEN 10 ELSE 0 END +
        CASE WHEN metadata->>'website' IS NOT NULL AND metadata->>'website' <> '' THEN 10 ELSE 0 END +
        CASE WHEN metadata->>'services' IS NOT NULL AND jsonb_array_length(COALESCE(metadata->'services', '[]'::jsonb)) > 0 THEN 10 ELSE 0 END +
        CASE WHEN source IS NOT NULL AND source <> '' THEN 5 ELSE 0 END
    ),
    entity_confidence_score = (
        -- Confidence = trustworthiness of the data
        CASE WHEN name IS NOT NULL AND LENGTH(name) >= 3 THEN 15 ELSE 0 END +
        CASE WHEN metadata->>'phone' IS NOT NULL AND metadata->>'phone' <> '' THEN 20 ELSE 0 END +
        CASE WHEN metadata->>'email' IS NOT NULL AND metadata->>'email' <> '' THEN 15 ELSE 0 END +
        CASE WHEN metadata->>'website' IS NOT NULL AND metadata->>'website' <> '' THEN 15 ELSE 0 END +
        CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 15 ELSE 0 END +
        CASE WHEN city IS NOT NULL AND city <> '' THEN 10 ELSE 0 END +
        CASE WHEN region_code IS NOT NULL AND region_code <> '' THEN 5 ELSE 0 END +
        CASE WHEN source IS NOT NULL AND source <> '' THEN 5 ELSE 0 END
    ),
    rank_score = (
        -- Rank composite: weighted sum for directory listing order
        -- Phone presence is the strongest signal (real business vs stub)
        CASE WHEN metadata->>'phone' IS NOT NULL AND metadata->>'phone' <> '' THEN 30 ELSE 0 END +
        CASE WHEN metadata->>'email' IS NOT NULL AND metadata->>'email' <> '' THEN 15 ELSE 0 END +
        CASE WHEN metadata->>'website' IS NOT NULL AND metadata->>'website' <> '' THEN 15 ELSE 0 END +
        CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN city IS NOT NULL AND city <> '' THEN 10 ELSE 0 END +
        CASE WHEN metadata->>'services' IS NOT NULL AND jsonb_array_length(COALESCE(metadata->'services', '[]'::jsonb)) > 0 THEN 10 ELSE 0 END +
        CASE WHEN name IS NOT NULL AND LENGTH(name) >= 5 THEN 5 ELSE 0 END +
        CASE WHEN region_code IS NOT NULL AND region_code <> '' THEN 5 ELSE 0 END
    ),
    updated_at = NOW()
WHERE TRUE;
