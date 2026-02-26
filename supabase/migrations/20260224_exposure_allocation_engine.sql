-- =============================================================================
-- Phase 8: Exposure Allocation Engine
-- Tracks operator visibility events and powers the 5-Factor ranking model.
-- =============================================================================

-- ── Exposure event log ────────────────────────────────────────────────────────
-- Records every time an operator is shown, selected, or skipped by a broker.
-- This is the core input for the broker_feedback_loop layer.
CREATE TABLE IF NOT EXISTS public.operator_exposure_logs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id     uuid NOT NULL REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
    broker_id       uuid REFERENCES public.driver_profiles(id) ON DELETE SET NULL,
    event_type      text NOT NULL CHECK (event_type IN ('impression', 'selected', 'skipped', 'contact_initiated')),

    -- Context captured at impression time
    corridor_id     text,                           -- e.g. "I-10_TX_LA"
    load_type       text,                           -- e.g. "superload", "overdimensional"
    origin_state    text,
    dest_state      text,
    search_session  uuid,                           -- groups events from same broker search

    -- Factor snapshot at time of exposure (for audit / model feedback)
    trust_score_at_exposure     numeric(5,2),
    context_fit_score           numeric(5,2),
    activity_freshness_score    numeric(5,2),
    cold_start_boost_applied    boolean DEFAULT false,
    paid_boost_applied          boolean DEFAULT false,
    final_exposure_score        numeric(7,4),       -- The computed ExposureScore
    rank_position               integer,            -- Position in result set

    created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes for time-series queries and per-operator aggregation
CREATE INDEX IF NOT EXISTS idx_exposure_logs_operator   ON public.operator_exposure_logs(operator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exposure_logs_corridor   ON public.operator_exposure_logs(corridor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exposure_logs_type       ON public.operator_exposure_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exposure_logs_session    ON public.operator_exposure_logs(search_session);

-- ── Per-operator rolling exposure aggregates ─────────────────────────────────
-- Pre-computed for fast reads during ranking.  Refreshed on a schedule.
CREATE TABLE IF NOT EXISTS public.operator_exposure_stats (
    operator_id         uuid PRIMARY KEY REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
    impressions_7d      integer DEFAULT 0,
    selections_7d       integer DEFAULT 0,
    skips_7d            integer DEFAULT 0,
    selection_rate_7d   numeric(5,4) GENERATED ALWAYS AS (
                          CASE WHEN COALESCE(impressions_7d, 0) = 0 THEN 0
                               ELSE selections_7d::numeric / impressions_7d END
                        ) STORED,
    last_selected_at    timestamptz,
    exposure_cap_hit    boolean DEFAULT false,      -- soft cap to enforce diversity
    updated_at          timestamptz DEFAULT now()
);

-- ── Exposure weight config (allow runtime tuning without re-deploy) ───────────
CREATE TABLE IF NOT EXISTS public.exposure_allocation_config (
    id              integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- singleton row
    w_trust_score   numeric(4,3) DEFAULT 0.45,
    w_context_fit   numeric(4,3) DEFAULT 0.25,
    w_freshness     numeric(4,3) DEFAULT 0.12,
    w_cold_start    numeric(4,3) DEFAULT 0.08,
    w_paid_boost    numeric(4,3) DEFAULT 0.10,
    min_trust_gate  numeric(5,2) DEFAULT 40.0,     -- operators below this score are suppressed
    diversity_cap   integer      DEFAULT 3,         -- max same operator in top-N per session
    updated_at      timestamptz DEFAULT now()
);

-- Seed the default config row
INSERT INTO public.exposure_allocation_config DEFAULT VALUES
ON CONFLICT (id) DO NOTHING;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.operator_exposure_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_exposure_stats       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exposure_allocation_config    ENABLE ROW LEVEL SECURITY;

-- Public cannot read exposure logs (broker/enterprise only)
CREATE POLICY "No public exposure logs"
    ON public.operator_exposure_logs FOR SELECT
    USING (false);

-- Service role has full access (Next.js API uses service role)
CREATE POLICY "Service role full access on exposure logs"
    ON public.operator_exposure_logs FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on exposure stats"
    ON public.operator_exposure_stats FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on exposure config"
    ON public.exposure_allocation_config FOR ALL
    USING (auth.role() = 'service_role');

-- ── Helper RPC: upsert exposure stats from log ────────────────────────────────
CREATE OR REPLACE FUNCTION public.refresh_operator_exposure_stats(p_operator_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_impressions   integer;
    v_selections    integer;
    v_skips         integer;
    v_last_selected timestamptz;
BEGIN
    SELECT
        COUNT(*) FILTER (WHERE event_type = 'impression')    INTO v_impressions,
        COUNT(*) FILTER (WHERE event_type = 'selected')      INTO v_selections,
        COUNT(*) FILTER (WHERE event_type = 'skipped')       INTO v_skips,
        MAX(created_at) FILTER (WHERE event_type = 'selected') INTO v_last_selected
    FROM public.operator_exposure_logs
    WHERE operator_id = p_operator_id
      AND created_at > now() - interval '7 days';

    INSERT INTO public.operator_exposure_stats
        (operator_id, impressions_7d, selections_7d, skips_7d, last_selected_at, updated_at)
    VALUES
        (p_operator_id, v_impressions, v_selections, v_skips, v_last_selected, now())
    ON CONFLICT (operator_id) DO UPDATE SET
        impressions_7d   = EXCLUDED.impressions_7d,
        selections_7d    = EXCLUDED.selections_7d,
        skips_7d         = EXCLUDED.skips_7d,
        last_selected_at = EXCLUDED.last_selected_at,
        updated_at       = now();
END;
$$;
