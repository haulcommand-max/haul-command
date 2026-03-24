-- ============================================================
-- RUN THIS AFTER STEP0 — paste output of STEP0 in chat first
-- ============================================================
-- This migration CREATES the listings table from operator_listings
-- and activates all 7,821+ rows.
-- ============================================================

-- STEP 1: Create listings table (matches operator_listings + adds needed columns)
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

    -- Contact (private — sign-up required to view)
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

-- STEP 2: Copy data from operator_listings into listings
-- Adjust column names here if operator_listings uses different names
INSERT INTO listings (
    id, created_at, full_name, company_name,
    city, state, country_code,
    phone, email, website,
    bio, services,
    rating, review_count,
    active, claimed, featured
)
SELECT
    id,
    COALESCE(created_at, now()),
    -- Try all common name column variants
    COALESCE(
        CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operator_listings' AND column_name='full_name') 
             THEN full_name ELSE NULL END,
        CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operator_listings' AND column_name='name') 
             THEN name ELSE NULL END,
        CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operator_listings' AND column_name='company_name') 
             THEN company_name ELSE NULL END,
        'Escort Operator'
    ) as full_name,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operator_listings' AND column_name='company_name') 
         THEN company_name ELSE NULL END,
    city,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operator_listings' AND column_name='state') 
         THEN state ELSE NULL END,
    'us',
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operator_listings' AND column_name='phone') 
         THEN phone ELSE NULL END,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operator_listings' AND column_name='email') 
         THEN email ELSE NULL END,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operator_listings' AND column_name='website') 
         THEN website ELSE NULL END,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operator_listings' AND column_name='bio') 
         THEN bio ELSE NULL END,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operator_listings' AND column_name='services') 
         THEN services ELSE NULL END,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operator_listings' AND column_name='rating') 
         THEN rating ELSE NULL END,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operator_listings' AND column_name='review_count') 
         THEN review_count ELSE 0 END,
    true,  -- activate all
    COALESCE(
        CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operator_listings' AND column_name='claimed') 
             THEN claimed ELSE false END,
        false
    ),
    COALESCE(
        CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operator_listings' AND column_name='featured') 
             THEN featured ELSE false END,
        false
    )
FROM operator_listings
ON CONFLICT (id) DO NOTHING;

-- STEP 3: Post-import cleanup
UPDATE listings SET
    status = 'active',
    is_visible = true,
    active = true
WHERE active IS NULL OR active = false;

-- Generate slugs
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
    CASE WHEN full_name IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN state IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN city IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN services IS NOT NULL AND array_length(services, 1) > 0 THEN 20 ELSE 0 END +
    CASE WHEN rating IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN bio IS NOT NULL THEN 20 ELSE 0 END +
    CASE WHEN meta_description IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN claimed THEN 10 ELSE 0 END
);

-- Set claim_status
UPDATE listings SET claim_status = CASE WHEN claimed THEN 'claimed' ELSE 'unclaimed' END;

-- STEP 4: Indexes
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_listings_state_active ON listings(state, active);
CREATE INDEX IF NOT EXISTS idx_listings_rank_score ON listings(rank_score DESC);
CREATE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_claimed ON listings(claimed);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_listings_fulltext ON listings
USING GIN (to_tsvector('english',
    COALESCE(full_name, '') || ' ' ||
    COALESCE(city, '') || ' ' ||
    COALESCE(state, '') || ' ' ||
    COALESCE(bio, '')
));

-- STEP 5: RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_listings" ON listings;
CREATE POLICY "public_read_listings" ON listings
    FOR SELECT USING (active = true);

-- Service role gets full access
DROP POLICY IF EXISTS "service_full_listings" ON listings;
CREATE POLICY "service_full_listings" ON listings
    USING (auth.role() = 'service_role');

-- STEP 6: Verify
SELECT
    COUNT(*) as total_listings,
    COUNT(*) FILTER (WHERE active = true) as active,
    COUNT(*) FILTER (WHERE slug IS NOT NULL) as has_slug,
    COUNT(*) FILTER (WHERE state IS NOT NULL) as has_state,
    COUNT(*) FILTER (WHERE claimed = true) as claimed,
    COUNT(*) FILTER (WHERE profile_completeness > 0) as has_score
FROM listings;
