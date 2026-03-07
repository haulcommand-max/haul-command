-- ============================================================
-- Claim Readiness & Outreach Tracking
-- Tracks outreach sequence, readiness scores, and email state
-- ============================================================

-- Claim outreach events table
CREATE TABLE IF NOT EXISTS public.claim_outreach_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operator_id UUID REFERENCES public.operators(id),
    entity_id TEXT,
    email_step TEXT NOT NULL CHECK (email_step IN (
        'ownership_notice',
        'proof_of_presence',
        'report_card_activation',
        'competitor_pressure',
        'missed_opportunity',
        'final_reminder'
    )),
    sent_at TIMESTAMPTZ DEFAULT now(),
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    recipient_email TEXT NOT NULL,
    claim_url TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Claim readiness scores
CREATE TABLE IF NOT EXISTS public.claim_readiness_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_id TEXT NOT NULL,
    operator_id UUID REFERENCES public.operators(id),
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    readiness TEXT NOT NULL CHECK (readiness IN (
        'outreach_now',
        'outreach_normal',
        'passive_only',
        'wait'
    )),
    reasons TEXT[] DEFAULT '{}',
    -- Score components for audit
    listing_age_days INTEGER DEFAULT 0,
    country_tier TEXT DEFAULT 'slate',
    internal_impressions INTEGER DEFAULT 0,
    internal_views INTEGER DEFAULT 0,
    data_quality NUMERIC(3,2) DEFAULT 0,
    contact_quality NUMERIC(3,2) DEFAULT 0,
    business_confidence NUMERIC(3,2) DEFAULT 0,
    page_published BOOLEAN DEFAULT false,
    search_inclusion BOOLEAN DEFAULT false,
    map_inclusion BOOLEAN DEFAULT false,
    surface_linkage BOOLEAN DEFAULT false,
    corridor_linkage BOOLEAN DEFAULT false,
    -- Outreach state
    outreach_started_at TIMESTAMPTZ,
    last_email_step TEXT,
    last_email_sent_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    claim_state TEXT DEFAULT 'unclaimed',
    -- Profile completion (post-claim)
    completion_pct INTEGER DEFAULT 0,
    trust_score INTEGER,
    trust_tier TEXT,
    -- Timestamps
    scored_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint per entity
CREATE UNIQUE INDEX IF NOT EXISTS idx_claim_readiness_entity
    ON public.claim_readiness_scores (entity_id);

-- Index for finding outreach-ready listings
CREATE INDEX IF NOT EXISTS idx_claim_readiness_outreach
    ON public.claim_readiness_scores (readiness, claim_state)
    WHERE claim_state = 'unclaimed';

-- Index for finding stalled claims
CREATE INDEX IF NOT EXISTS idx_claim_readiness_stalled
    ON public.claim_readiness_scores (claim_state, completion_pct)
    WHERE claim_state IN ('claim_started', 'ownership_granted', 'profile_started');

-- Outreach events for a specific operator
CREATE INDEX IF NOT EXISTS idx_outreach_events_operator
    ON public.claim_outreach_events (operator_id, email_step);

-- Enable RLS
ALTER TABLE public.claim_outreach_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_readiness_scores ENABLE ROW LEVEL SECURITY;

-- Service-role-only policies (no client access)
-- These tables are managed by Trigger.dev background jobs only

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_claim_readiness_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_claim_readiness_updated
    BEFORE UPDATE ON public.claim_readiness_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_claim_readiness_timestamp();
