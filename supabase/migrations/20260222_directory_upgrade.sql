-- ══════════════════════════════════════════════════════════════
-- Haul Command — Directory Upgrade Migration
-- Adds: operator_reviews, profile gallery, equipment fields,
--       claim listings flow, featured column
-- ══════════════════════════════════════════════════════════════

-- ── 1. operator_reviews ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.operator_reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escort_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewer_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    job_id          UUID REFERENCES public.loads(id) ON DELETE SET NULL,

    -- 3-axis scores (1.0–5.0)
    score_punctuality   NUMERIC(2,1) NOT NULL CHECK (score_punctuality BETWEEN 1 AND 5),
    score_communication NUMERIC(2,1) NOT NULL CHECK (score_communication BETWEEN 1 AND 5),
    score_equipment     NUMERIC(2,1) NOT NULL CHECK (score_equipment BETWEEN 1 AND 5),

    -- Content
    body            TEXT,
    photo_url       TEXT,
    job_corridor    TEXT,                    -- e.g. "I-10 TX→NM"
    verified_job    BOOLEAN NOT NULL DEFAULT false,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One review per broker per job
    UNIQUE (reviewer_id, job_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_operator_reviews_escort_id ON public.operator_reviews(escort_id);
CREATE INDEX IF NOT EXISTS idx_operator_reviews_reviewer_id ON public.operator_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_operator_reviews_created ON public.operator_reviews(created_at DESC);

-- RLS
ALTER TABLE public.operator_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews visible to all" ON public.operator_reviews
    FOR SELECT USING (true);

CREATE POLICY "Brokers can insert their own reviews" ON public.operator_reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update their own reviews" ON public.operator_reviews
    FOR UPDATE USING (auth.uid() = reviewer_id);

-- ── 2. Extend profiles for directory features ─────────────────

-- Gallery photos (up to 6, stored as JSONB array)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS gallery_photos JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS video_url TEXT,
    ADD COLUMN IF NOT EXISTS equipment_types TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS certified_states TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'both'
        CHECK (service_type IN ('lead', 'chase', 'both')),
    ADD COLUMN IF NOT EXISTS superload_qualified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS has_high_pole BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS availability_schedule JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS years_experience INT;

-- Index for featured filter (hot path)
CREATE INDEX IF NOT EXISTS idx_profiles_featured ON public.profiles(featured)
    WHERE featured = true;

-- Index for equipment filtering
CREATE INDEX IF NOT EXISTS idx_profiles_equipment ON public.profiles
    USING GIN(equipment_types);

-- Index for certified states filtering
CREATE INDEX IF NOT EXISTS idx_profiles_states ON public.profiles
    USING GIN(certified_states);

-- ── 3. listing_claims ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.listing_claims (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    claimant_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    claimant_name   TEXT,
    claimant_phone  TEXT,
    claimant_email  TEXT,
    status          TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_listing_claims_profile ON public.listing_claims(profile_id);
CREATE INDEX IF NOT EXISTS idx_listing_claims_status ON public.listing_claims(status)
    WHERE status = 'pending';

ALTER TABLE public.listing_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage claims" ON public.listing_claims
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Claimants can see own claims" ON public.listing_claims
    FOR SELECT USING (auth.uid() = claimant_id);

CREATE POLICY "Anyone can submit a claim" ON public.listing_claims
    FOR INSERT WITH CHECK (true);

-- ── 4. broker_rosters (saved/bookmarked pilots) ───────────────
CREATE TABLE IF NOT EXISTS public.broker_rosters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    escort_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    list_name       TEXT NOT NULL DEFAULT 'My Roster',
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (broker_id, escort_id, list_name)
);

CREATE INDEX IF NOT EXISTS idx_broker_rosters_broker ON public.broker_rosters(broker_id);

ALTER TABLE public.broker_rosters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers manage own roster" ON public.broker_rosters
    FOR ALL USING (auth.uid() = broker_id);

-- ── 5. RPC — aggregate review scores onto profile ─────────────
CREATE OR REPLACE FUNCTION public.compute_operator_review_scores(p_escort_id UUID)
RETURNS TABLE (
    avg_punctuality     NUMERIC,
    avg_communication   NUMERIC,
    avg_equipment       NUMERIC,
    avg_overall         NUMERIC,
    review_count        BIGINT
)
LANGUAGE SQL STABLE AS $$
    SELECT
        ROUND(AVG(score_punctuality)::NUMERIC, 2),
        ROUND(AVG(score_communication)::NUMERIC, 2),
        ROUND(AVG(score_equipment)::NUMERIC, 2),
        ROUND(((AVG(score_punctuality) + AVG(score_communication) + AVG(score_equipment)) / 3)::NUMERIC, 2),
        COUNT(*)
    FROM public.operator_reviews
    WHERE escort_id = p_escort_id;
$$;

-- ── 6. Auto-expire featured listings ──────────────────────────
CREATE OR REPLACE FUNCTION public.expire_featured_listings()
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.profiles
    SET featured = false, featured_until = NULL
    WHERE featured = true
      AND featured_until IS NOT NULL
      AND featured_until < now();
END;
$$;

-- This function would be called daily by a cron edge function.
-- Schedule: select cron.schedule('expire-featured', '0 0 * * *', 'SELECT public.expire_featured_listings()');
