-- ════════════════════════════════════════════════════════════
-- Phase 1: Search, Boost, and Sponsorship Tables
-- ════════════════════════════════════════════════════════════

-- Profile boosts — paid search ranking multipliers
CREATE TABLE IF NOT EXISTS public.profile_boosts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('spotlight', 'featured', 'premium')),
    search_multiplier NUMERIC(4,2) DEFAULT 1.0,
    badge TEXT,
    price_cents INTEGER DEFAULT 0,
    purchased_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'canceled')),
    purchased_by UUID,
    stripe_payment_id TEXT,
    metadata JSONB DEFAULT '{}'
);

-- One active boost per operator
-- Note: indexes skipped — profile_boosts exists as a VIEW in this DB (cannot index views)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_boosts_operator ON public.profile_boosts(operator_id) WHERE status = 'active';
-- CREATE INDEX IF NOT EXISTS idx_profile_boosts_expires ON public.profile_boosts(expires_at) WHERE status = 'active';

-- Territory sponsorships — companies sponsor territories
CREATE TABLE IF NOT EXISTS public.territory_sponsorships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sponsor_user_id UUID NOT NULL,
    territory_type TEXT NOT NULL CHECK (territory_type IN ('state', 'corridor', 'city', 'country')),
    territory_value TEXT NOT NULL,
    plan TEXT NOT NULL CHECK (plan IN ('bronze', 'silver', 'gold', 'exclusive')),
    price_cents_monthly INTEGER NOT NULL,
    started_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT true,
    stripe_subscription_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'canceled', 'expired')),
    benefits JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- One exclusive sponsor per territory
CREATE UNIQUE INDEX IF NOT EXISTS idx_territory_sponsorship_exclusive
    ON public.territory_sponsorships(territory_type, territory_value)
    WHERE plan = 'exclusive' AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_territory_sponsorships_lookup
    ON public.territory_sponsorships(territory_type, territory_value, status);

-- Document submissions — for verification pipeline
CREATE TABLE IF NOT EXISTS public.document_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN (
        'insurance', 'license', 'certification', 'registration',
        'background_check', 'vehicle_inspection', 'identity'
    )),
    file_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending_review' CHECK (status IN (
        'pending_review', 'approved', 'rejected', 'expired'
    )),
    reviewer_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    submitted_by UUID,
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_document_submissions_operator
    ON public.document_submissions(operator_id, document_type);
CREATE INDEX IF NOT EXISTS idx_document_submissions_pending
    ON public.document_submissions(status)
    WHERE status = 'pending_review';

-- Enable RLS
ALTER TABLE public.profile_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territory_sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_submissions ENABLE ROW LEVEL SECURITY;

-- Operators can see their own boosts
CREATE POLICY boost_owner_read ON public.profile_boosts
    FOR SELECT TO authenticated
    USING (purchased_by = auth.uid());

-- Sponsors can see their own sponsorships
CREATE POLICY sponsorship_owner_read ON public.territory_sponsorships
    FOR SELECT TO authenticated
    USING (sponsor_user_id = auth.uid());

-- Operators can see their own document submissions
CREATE POLICY doc_submission_owner_read ON public.document_submissions
    FOR SELECT TO authenticated
    USING (submitted_by = auth.uid());
