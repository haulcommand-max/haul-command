-- Directory SEO & Unclaimed Profiles Migration
-- Adds 'is_claimed' and canonical SEO routing data

-- 1. Add fields to escort_profiles
ALTER TABLE escort_profiles
ADD COLUMN IF NOT EXISTS is_claimed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS claim_status text DEFAULT 'unclaimed', -- 'unclaimed', 'pending', 'verified'
ADD COLUMN IF NOT EXISTS claimable_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS slug text,
ADD COLUMN IF NOT EXISTS service_state text,
ADD COLUMN IF NOT EXISTS service_city text;

-- 2. Create Unique Index on Slug for canonical routing
CREATE UNIQUE INDEX IF NOT EXISTS idx_escort_profiles_slug ON escort_profiles(slug) WHERE slug IS NOT NULL;

-- 3. Update existing profiles with a basic slug and location to prevent nulls
UPDATE escort_profiles ep
SET 
    is_claimed = true,
    claim_status = 'verified',
    service_state = 'TX',
    service_city = 'Houston',
    slug = CASE 
        WHEN p.display_name IS NOT NULL THEN 
            LOWER(REGEXP_REPLACE(p.display_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(ep.id::text, 1, 6)
        ELSE 
            'escort-' || SUBSTRING(ep.id::text, 1, 8)
    END
FROM profiles p
WHERE ep.id = p.id AND ep.slug IS NULL;

-- 4. Set RLS Policies for Claim Status
-- Allow public access to read unclaimed profiles (for SEO indexability)
-- But we will obfuscate sensitive data like phone numbers at the UI layer or via DB views if needed.
-- Since escort_profiles is already readable by public via the profiles view, we don't need a strict DB-level obfuscation policy unless explicitly requested.

-- Update the public_leaderboards view to expose the slug and service location
DROP VIEW IF EXISTS public_leaderboards;
CREATE VIEW public_leaderboards AS
SELECT 
    p.id,
    p.display_name AS name,
    p.phone_e164 AS phone,
    ep.final_score,
    ep.rank_tier,
    ep.compliance_score,
    ep.slug,
    ep.service_state,
    ep.service_city,
    ep.is_claimed,
    RANK() OVER (ORDER BY ep.final_score DESC NULLS LAST) as rank
FROM profiles p
JOIN escort_profiles ep ON p.id = ep.id
WHERE 
    p.role = 'escort' 
    AND ep.final_score > 0
    AND ep.confidence_multiplier >= 0.60;
