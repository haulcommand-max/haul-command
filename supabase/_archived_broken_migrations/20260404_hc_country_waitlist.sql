-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: hc_country_waitlist — Demand capture for dormant markets
--
-- Purpose:
--   Captures pre-launch demand from /[country]/coming-soon pages.
--   Powers: launch prioritization, email notification, market readiness scoring.
--
-- When waitlist_count > 50 in hc_country_readiness → admin flag for review
-- When admin promotes country → all waitlist emails get launch notification
--
-- Run after: 20260404_country_readiness_120_topup.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Create hc_country_waitlist ──
CREATE TABLE IF NOT EXISTS public.hc_country_waitlist (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email          TEXT NOT NULL,
    country_code   TEXT NOT NULL REFERENCES public.hc_country_readiness(country_code)
                       ON DELETE CASCADE ON UPDATE CASCADE,
    country_name   TEXT,
    role           TEXT CHECK (role IN ('operator','carrier','broker','company','shipper','other','unknown')),
    tier           TEXT CHECK (tier IN ('gold','blue','silver','slate','copper','unknown')),
    source         TEXT NOT NULL DEFAULT 'coming_soon_page',
    signed_up_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notified_at    TIMESTAMPTZ,           -- Set when launch email is sent
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one signup per email per country
ALTER TABLE public.hc_country_waitlist
    DROP CONSTRAINT IF EXISTS hc_country_waitlist_email_country_key;
ALTER TABLE public.hc_country_waitlist
    ADD CONSTRAINT hc_country_waitlist_email_country_key
    UNIQUE (email, country_code);

-- ── 2. Indexes ──
CREATE INDEX IF NOT EXISTS idx_hc_country_waitlist_country
    ON public.hc_country_waitlist (country_code);
CREATE INDEX IF NOT EXISTS idx_hc_country_waitlist_email
    ON public.hc_country_waitlist (email);
CREATE INDEX IF NOT EXISTS idx_hc_country_waitlist_tier
    ON public.hc_country_waitlist (tier);
CREATE INDEX IF NOT EXISTS idx_hc_country_waitlist_role
    ON public.hc_country_waitlist (role);

-- ── 3. Add waitlist_count column to hc_country_readiness (if missing) ──
ALTER TABLE public.hc_country_readiness
    ADD COLUMN IF NOT EXISTS waitlist_count INTEGER NOT NULL DEFAULT 0;

-- ── 4. RPC: increment_waitlist_count ──
-- Called by /api/waitlist after each successful signup
-- Triggers admin flag when count crosses 50
CREATE OR REPLACE FUNCTION public.increment_waitlist_count(p_country_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.hc_country_readiness
    SET
        waitlist_count = waitlist_count + 1,
        updated_at     = NOW(),
        -- Auto-flag for admin review when threshold crossed
        notes = CASE
            WHEN waitlist_count + 1 = 50
            THEN COALESCE(notes, '') || ' | [AUTO] waitlist_count=50 — review for seed promotion'
            ELSE notes
        END
    WHERE country_code = p_country_code;
END;
$$;

-- ── 5. View: v_waitlist_demand_ranking ──
-- Powers admin dashboard: which dormant markets have highest demand
CREATE OR REPLACE VIEW public.v_waitlist_demand_ranking AS
SELECT
    r.country_code,
    r.tier,
    r.market_mode,
    r.waitlist_count,
    COUNT(w.id)                                     AS signup_count,
    COUNT(w.id) FILTER (WHERE w.role = 'operator')  AS operator_count,
    COUNT(w.id) FILTER (WHERE w.role = 'carrier')   AS carrier_count,
    COUNT(w.id) FILTER (WHERE w.role = 'broker')    AS broker_count,
    MAX(w.signed_up_at)                             AS latest_signup,
    CASE
        WHEN COUNT(w.id) >= 50  THEN 'ready_for_seed'
        WHEN COUNT(w.id) >= 20  THEN 'building_demand'
        WHEN COUNT(w.id) >= 5   THEN 'early_interest'
        ELSE                         'no_demand'
    END                                             AS demand_stage
FROM public.hc_country_readiness r
LEFT JOIN public.hc_country_waitlist w ON r.country_code = w.country_code
WHERE r.market_mode = 'dormant'
GROUP BY r.country_code, r.tier, r.market_mode, r.waitlist_count
ORDER BY signup_count DESC NULLS LAST, r.tier;

-- ── 6. RLS ──
ALTER TABLE public.hc_country_waitlist ENABLE ROW LEVEL SECURITY;

-- Admins can read all
CREATE POLICY "Admin full access to waitlist"
    ON public.hc_country_waitlist
    FOR ALL
    USING (auth.role() = 'service_role');

-- Authenticated users can see their own signups
CREATE POLICY "Users see own waitlist signups"
    ON public.hc_country_waitlist
    FOR SELECT
    USING (email = auth.email());

-- Public inserts only (the API route uses service_role for writes)
-- No public SELECT (email privacy)

-- ── Verify after migration ──
-- SELECT demand_stage, COUNT(*) FROM v_waitlist_demand_ranking GROUP BY demand_stage;
-- SELECT * FROM v_waitlist_demand_ranking LIMIT 10;
