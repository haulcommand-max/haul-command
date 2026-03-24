-- ============================================================
-- MASTER FIX: Create unified 'listings' table
-- ============================================================
-- Consolidates data from BOTH:
-- 1. directory_listings (7,821 legacy rows)
-- 2. operator_listings (135 newer rows)
-- ============================================================

-- STEP 1: Create the unified listings table
CREATE TABLE IF NOT EXISTS listings (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at              timestamptz DEFAULT now(),
    updated_at              timestamptz DEFAULT now(),

    -- Identity
    full_name               text,
    company_name            text,
    slug                    text UNIQUE,

    -- Location
    city                    text,
    state                   text,
    country_code            text DEFAULT 'us',
    zip_code                text,
    latitude                numeric,
    longitude               numeric,

    -- Business info
    bio                     text,
    meta_description        text,
    services                text[],
    certifications          text[],
    equipment               text[],

    -- Contact
    phone                   text,
    email                   text,
    website                 text,

    -- Status
    active                  boolean DEFAULT true,
    is_visible              boolean DEFAULT true,
    status                  text DEFAULT 'active',
    claimed                 boolean DEFAULT false,
    claim_status            text DEFAULT 'unclaimed'
                            CHECK (claim_status IN ('unclaimed', 'pending', 'claimed')),
    featured                boolean DEFAULT false,
    verified                boolean DEFAULT false,

    -- Scoring
    rating                  numeric(3,2),
    review_count            int DEFAULT 0,
    rank_score              numeric DEFAULT 0,
    profile_completeness    int DEFAULT 0,
    view_count              int DEFAULT 0,
    contact_count           int DEFAULT 0,
    response_time_minutes   int,
    runs_completed          int DEFAULT 0
);

-- STEP 2A: Import the 7,821 rows from directory_listings
INSERT INTO listings (
    id, full_name, slug, city, state, country_code, latitude, longitude,
    claim_status, claimed, active, is_visible, status
)
SELECT 
    id,
    name as full_name,
    slug,
    city,
    region_code as state,
    COALESCE(country_code, 'us'),
    latitude,
    longitude,
    COALESCE(claim_status, 'unclaimed'),
    CASE WHEN claim_status = 'claimed' THEN true ELSE false END as claimed,
    true as active,
    true as is_visible,
    'active' as status
FROM directory_listings
ON CONFLICT (id) DO NOTHING;

-- STEP 2B: Import the 135 rows from operator_listings
-- operator_listings has: operator_id, owner_id, business_name, phone, website_url, categories, verified, rating, response_time_sec_avg
INSERT INTO listings (
    id, company_name, phone, website, services, verified, rating, response_time_minutes,
    active, is_visible, status
)
SELECT 
    operator_id as id,
    business_name as company_name,
    phone,
    website_url as website,
    categories as services,
    verified,
    rating,
    response_time_sec_avg / 60 as response_time_minutes,
    true as active,
    true as is_visible,
    'active' as status
FROM operator_listings
ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    services = EXCLUDED.services,
    verified = EXCLUDED.verified,
    rating = EXCLUDED.rating,
    response_time_minutes = EXCLUDED.response_time_minutes;

-- STEP 3: Fallback slugs and default data
UPDATE listings
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(COALESCE(full_name, company_name, 'operator'), '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
    )
) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;

-- Compute rank_score
UPDATE listings SET rank_score = (
    COALESCE(rating, 0) * 20 +
    COALESCE(review_count, 0) * 2 +
    CASE WHEN claimed THEN 30 ELSE 0 END +
    CASE WHEN featured THEN 50 ELSE 0 END
);

-- Compute profile completeness
UPDATE listings SET profile_completeness = (
    CASE WHEN full_name IS NOT NULL OR company_name IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN state IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN city IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN services IS NOT NULL AND array_length(services, 1) > 0 THEN 20 ELSE 0 END +
    CASE WHEN rating IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN bio IS NOT NULL THEN 20 ELSE 0 END +
    CASE WHEN meta_description IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN claimed THEN 10 ELSE 0 END
);

-- STEP 4: Indexes & RLS
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_listings_state_active ON listings(state, active);
CREATE INDEX IF NOT EXISTS idx_listings_rank_score ON listings(rank_score DESC);
CREATE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_claimed ON listings(claimed);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_listings_fulltext ON listings
USING GIN (to_tsvector('english',
    COALESCE(full_name, company_name, '') || ' ' ||
    COALESCE(city, '') || ' ' ||
    COALESCE(state, '') || ' ' ||
    COALESCE(bio, '')
));

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_listings" ON listings;
CREATE POLICY "public_read_listings" ON listings
    FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "service_full_listings" ON listings;
CREATE POLICY "service_full_listings" ON listings
    USING (auth.role() = 'service_role');

-- STEP 5: Verify Final Counts
SELECT
    COUNT(*) as total_listings,
    COUNT(*) FILTER (WHERE active = true) as active,
    COUNT(*) FILTER (WHERE slug IS NOT NULL) as has_slug,
    COUNT(*) FILTER (WHERE state IS NOT NULL) as has_state,
    COUNT(*) FILTER (WHERE claimed = true) as claimed,
    COUNT(*) FILTER (WHERE profile_completeness > 0) as has_score
FROM listings;
