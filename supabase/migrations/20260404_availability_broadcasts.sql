-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: availability_broadcasts + v_available_escorts
--
-- Purpose:
--   Powers the /available-now live broker feed and operator broadcast system.
--   Operators set status from dashboard → appears in broker's feed instantly.
--
-- Tables:
--   availability_broadcasts — one active row per operator (upsert on broadcast)
--
-- Views:
--   v_available_escorts — broker-readable, joined with operator profile data
--
-- Required by:
--   POST /api/availability/broadcast
--   GET  /api/availability/broadcast
--   /available-now page (fallback query)
--   /dashboard/operator AvailabilityQuickSet → /api/capture/set-availability
-- ═══════════════════════════════════════════════════════════════════════

-- ── Table: availability_broadcasts ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.availability_broadcasts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id             UUID NOT NULL,                    -- auth.users.id
    city                    TEXT,
    state_code              TEXT,                             -- 2-char: TX, CA
    country_code            TEXT NOT NULL DEFAULT 'US',
    lat                     DOUBLE PRECISION,
    lng                     DOUBLE PRECISION,
    radius_miles            INTEGER DEFAULT 50,
    status                  TEXT NOT NULL DEFAULT 'available_now'
                              CHECK (status IN ('available_now','available_today','available_this_week','booked','offline')),
    available_until         TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '48 hours',
    service_types           TEXT[] DEFAULT '{}',
    equipment_notes         TEXT,
    certifications          TEXT[] DEFAULT '{}',
    corridor_id             UUID,                             -- optional: links to hc_corridors
    willing_to_deadhead_miles INTEGER DEFAULT 100,
    phone                   TEXT,
    contact_note            TEXT,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_availability_broadcasts_operator
    ON public.availability_broadcasts (operator_id, is_active);

CREATE INDEX IF NOT EXISTS idx_availability_broadcasts_geo
    ON public.availability_broadcasts (country_code, state_code, is_active);

CREATE INDEX IF NOT EXISTS idx_availability_broadcasts_expires
    ON public.availability_broadcasts (expires_at) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_availability_broadcasts_status
    ON public.availability_broadcasts (status, is_active);

-- ── Auto-expire: mark records expired when expires_at has passed ──
-- Schedule via Supabase pg_cron or call manually:
-- UPDATE availability_broadcasts SET is_active = FALSE WHERE expires_at < NOW() AND is_active = TRUE;

-- ── RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE public.availability_broadcasts ENABLE ROW LEVEL SECURITY;

-- Operators can manage their own broadcasts
CREATE POLICY "Operators manage own broadcasts"
    ON public.availability_broadcasts
    FOR ALL
    USING (auth.uid() = operator_id)
    WITH CHECK (auth.uid() = operator_id);

-- Brokers and public can read active broadcasts
CREATE POLICY "Anyone can read active broadcasts"
    ON public.availability_broadcasts
    FOR SELECT
    USING (is_active = TRUE AND expires_at > NOW());

-- Service role full access (for admin and cron)
CREATE POLICY "Service role full access to broadcasts"
    ON public.availability_broadcasts
    FOR ALL
    USING (auth.role() = 'service_role');

-- ── View: v_available_escorts ─────────────────────────────────────────────
-- Broker-readable view: joins broadcasts with operator profile for the /available-now feed.
-- Falls back gracefully if hc_global_operators doesn't have user_id match.

CREATE OR REPLACE VIEW public.v_available_escorts AS
SELECT
    ab.id,
    ab.operator_id,
    ab.city,
    ab.state_code,
    ab.country_code,
    ab.status,
    ab.service_types,
    ab.equipment_notes,
    ab.phone,
    ab.contact_note,
    ab.willing_to_deadhead_miles,
    ab.expires_at,
    ab.created_at,
    ab.updated_at,
    -- Operator profile fields (joined from hc_global_operators via user_id)
    hgo.id                          AS operator_record_id,
    hgo.business_name               AS operator_name,
    hgo.slug                        AS operator_slug,
    hgo.trust_score,
    hgo.claim_status,
    hgo.verification_tier,
    hgo.rating_avg,
    hgo.review_count,
    hgo.profile_completeness_pct,
    hgo.certification_flags
FROM public.availability_broadcasts ab
LEFT JOIN public.hc_global_operators hgo
    ON hgo.user_id = ab.operator_id
WHERE ab.is_active = TRUE
  AND ab.expires_at > NOW()
  AND ab.status != 'offline'
ORDER BY
    CASE ab.status
        WHEN 'available_now'       THEN 1
        WHEN 'available_today'     THEN 2
        WHEN 'available_this_week' THEN 3
        WHEN 'booked'              THEN 4
        ELSE 5
    END,
    COALESCE(hgo.trust_score, 0) DESC,
    ab.created_at DESC;

-- ── availability_status on hc_global_operators (optional column) ──────────
-- Tracks the operator's last-known status for directory display without requiring
-- a join to availability_broadcasts on every directory query.

ALTER TABLE public.hc_global_operators
    ADD COLUMN IF NOT EXISTS availability_status  TEXT DEFAULT 'unknown'
        CHECK (availability_status IN ('available_now','available_today','available_this_week','booked','offline','unknown')),
    ADD COLUMN IF NOT EXISTS availability_updated_at TIMESTAMPTZ;

-- Trigger: keep hc_global_operators.availability_status in sync with broadcasts
CREATE OR REPLACE FUNCTION public.sync_operator_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- When a broadcast is inserted or updated, sync to operator profile
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.hc_global_operators
        SET
            availability_status = NEW.status,
            availability_updated_at = NOW()
        WHERE user_id = NEW.operator_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_operator_availability ON public.availability_broadcasts;

CREATE TRIGGER trg_sync_operator_availability
    AFTER INSERT OR UPDATE OF status, is_active ON public.availability_broadcasts
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_operator_availability();

-- ── Verify ────────────────────────────────────────────────────────────────
-- SELECT * FROM v_available_escorts LIMIT 10;
-- SELECT COUNT(*) FROM availability_broadcasts WHERE is_active = TRUE;
