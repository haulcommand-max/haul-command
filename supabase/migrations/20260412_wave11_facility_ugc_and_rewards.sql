-- 20260412_wave11_facility_ugc_and_rewards.sql
-- Haul Command Wave 11: Facility UGC rating engine and early-visibility moats

DROP TABLE IF EXISTS public.facility_reviews CASCADE;
DROP TABLE IF EXISTS public.facilities CASCADE;

-- 1. FACILITIES (Drop yards, warehouses, ports, heavy haul checkpoints)
CREATE TABLE public.facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'port', 'warehouse', 'drop_yard', 'weigh_station', 'rest_stop'
    address TEXT,
    city TEXT,
    state_province TEXT,
    country_code TEXT DEFAULT 'US',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facilities_location ON public.facilities(country_code, state_province, city);

-- 2. FACILITY REVIEWS (The UGC Moat)
CREATE TABLE public.facility_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    operator_id UUID NOT NULL REFERENCES auth.users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    wait_time_mins INTEGER, -- e.g., 30, 60, 120
    easy_heavy_haul_access BOOLEAN,
    night_parking_available BOOLEAN,
    amenities JSONB DEFAULT '[]'::jsonb, -- e.g., ["Food", "Showers", "Wide Turning Radius"]
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facility_reviews_facility ON public.facility_reviews(facility_id);

-- 3. EARLY-LOAD VISIBILITY & REWARDS PATH (Marketplace Tiers)
-- We extend operators or use a read-model for tiers to gate load visibilty.
-- A new table to define the perks a user has earned based on their trust score.
CREATE TABLE IF NOT EXISTS public.operator_reward_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name TEXT NOT NULL UNIQUE, -- 'standard', 'silver', 'gold', 'platinum'
    min_trust_score INTEGER NOT NULL,
    early_load_access_mins INTEGER NOT NULL DEFAULT 0, -- e.g., platinum gets loads 30 mins before standard
    fuel_discount_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.operator_reward_tiers (tier_name, min_trust_score, early_load_access_mins, fuel_discount_enabled)
VALUES 
    ('STANDARD', 0, 0, false),
    ('SILVER', 60, 5, false),
    ('GOLD', 80, 15, true),
    ('PLATINUM', 95, 30, true)
ON CONFLICT (tier_name) DO NOTHING;

-- 4. MODIFY LOADS TO SUPPORT EARLY VISIBILITY
-- Add a published_at column to loads if not exists, which controls when it "goes live".
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
UPDATE public.loads SET published_at = created_at WHERE published_at IS NULL;

-- Create an RPC to fetch loads that respects the operator's early access perk
/* CREATE OR REPLACE FUNCTION get_available_loads_for_operator(p_operator_id UUID)
RETURNS SETOF public.loads AS $$
DECLARE
    v_trust_score INTEGER;
    v_early_access_mins INTEGER;
BEGIN
    SELECT COALESCE(composite_score, 0) INTO v_trust_score 
    FROM public.operator_trust_scores 
    WHERE profile_id = p_operator_id;

    IF NOT FOUND THEN
        v_trust_score := 0;
    END IF;

    SELECT early_load_access_mins INTO v_early_access_mins
    FROM public.operator_reward_tiers
    WHERE min_trust_score <= v_trust_score
    ORDER BY min_trust_score DESC 
    LIMIT 1;

    IF v_early_access_mins IS NULL THEN
        v_early_access_mins := 0;
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.loads
    WHERE status = 'open'
    AND published_at - (v_early_access_mins || ' minutes')::interval <= now()
    ORDER BY published_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; */

-- 5. RLS
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Facilities are readable by all authenticated users" ON public.facilities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Facilities can be inserted by authenticated users" ON public.facilities FOR INSERT TO authenticated WITH CHECK (true);

ALTER TABLE public.facility_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Facility reviews are readable by all authenticated users" ON public.facility_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operators can insert reviews" ON public.facility_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = operator_id);
