-- ============================================================
-- DIRECTORY FIX: Activate all listings + unify schemas
-- ============================================================

-- 1. Bulk-activate ALL listings (this is the main bug — most had active=NULL)
--    7,745 rows had active=NULL, only ~60 had explicit active=true
UPDATE listings SET active = true WHERE active IS NULL OR active = false;

-- 2. Add missing columns to listings that directory_listings had
ALTER TABLE listings ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rank_score numeric DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS profile_completeness int DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS country_code text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS response_time_minutes int;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS runs_completed int DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS claim_status text DEFAULT 'unclaimed'
    CHECK (claim_status IN ('unclaimed', 'pending', 'claimed'));

-- 3. Sync status and is_visible from active flag
UPDATE listings SET
    status = CASE WHEN active THEN 'active' ELSE 'inactive' END,
    is_visible = active
WHERE status IS NULL OR is_visible IS NULL;

-- 4. Sync claim_status from claimed column
UPDATE listings SET claim_status = CASE WHEN claimed THEN 'claimed' ELSE 'unclaimed' END;

-- 5. Generate slugs from full_name + id suffix (for SEO URLs)
UPDATE listings
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(COALESCE(full_name, 'operator'), '[^a-zA-Z0-9\s-]', '', 'g'),
        '\\s+', '-', 'g'
    )
) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;

-- 6. Compute rank_score from existing data
UPDATE listings SET rank_score = (
    COALESCE(rating, 0) * 20 +
    COALESCE(review_count, 0) * 2 +
    CASE WHEN claimed THEN 30 ELSE 0 END +
    CASE WHEN featured THEN 50 ELSE 0 END
);

-- 7. Compute profile completeness
UPDATE listings SET profile_completeness = (
    CASE WHEN full_name IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN state IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN city IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN services IS NOT NULL AND array_length(services, 1) > 0 THEN 20 ELSE 0 END +
    CASE WHEN rating IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN bio IS NOT NULL THEN 20 ELSE 0 END +
    CASE WHEN meta_description IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN claimed THEN 10 ELSE 0 END
);

-- 8. Sync country_code from state (all US listings get 'us')
UPDATE listings
SET country_code = 'us'
WHERE country_code IS NULL AND state IS NOT NULL;

-- 9. Add indexes for fast directory queries
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_is_visible ON listings(is_visible) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_listings_rank_score ON listings(rank_score DESC);
CREATE INDEX IF NOT EXISTS idx_listings_state_active ON listings(state, active);
CREATE INDEX IF NOT EXISTS idx_listings_country_active ON listings(country_code, active);
CREATE INDEX IF NOT EXISTS idx_listings_claimed ON listings(claimed);
CREATE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(featured) WHERE featured = true;

-- Text search index
CREATE INDEX IF NOT EXISTS idx_listings_fulltext ON listings
USING GIN (to_tsvector('english',
    COALESCE(full_name, '') || ' ' ||
    COALESCE(city, '') || ' ' ||
    COALESCE(state, '') || ' ' ||
    COALESCE(bio, '')
));

-- 10. RLS: Allow public reads for directory (critical for SSR + SEO)
DROP POLICY IF EXISTS "public_read_listings" ON listings;
CREATE POLICY "public_read_listings" ON listings
    FOR SELECT
    USING (active = true AND is_visible = true);

-- 11. Create a unified directory VIEW that both old and new code can use
--     Aliases fields from listings to match directory_listings schema
CREATE OR REPLACE VIEW directory_listings_unified AS
SELECT
    l.id,
    l.slug,
    l.full_name AS name,
    l.full_name AS company_name,
    l.city,
    l.state,
    l.state AS region_code,
    l.country_code,
    l.services AS corridors,
    l.claimed AS verified,
    l.rating,
    l.review_count,
    l.bio,
    l.meta_description,
    l.featured,
    l.rank_score,
    l.profile_completeness,
    l.claim_status,
    l.is_visible,
    l.active,
    l.status,
    l.response_time_minutes,
    l.runs_completed,
    l.view_count,
    l.contact_count
FROM listings l
WHERE l.active = true AND l.is_visible = true;

-- Grant public select on the view too
GRANT SELECT ON directory_listings_unified TO anon, authenticated;

-- Verify the fix
DO $$
DECLARE
    total_count int;
    active_count int;
BEGIN
    SELECT COUNT(*) INTO total_count FROM listings;
    SELECT COUNT(*) INTO active_count FROM listings WHERE active = true;
    RAISE NOTICE 'Total listings: %, Active listings: %', total_count, active_count;
END $$;
