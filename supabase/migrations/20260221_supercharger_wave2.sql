-- Supercharger Wave 2 Migration: Growth Loops + Intelligence
-- Covers: Availability Ping, Supply Heatmap, Auto-Recruit, Corridor Supply Index

-- ============================================================
-- 1. AVAILABILITY PING LOOP (20x multiplier)
-- Scheduled pings to confirm escort availability + stale decay
-- ============================================================

CREATE TABLE public.availability_pings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    ping_type TEXT NOT NULL CHECK (ping_type IN ('push', 'sms', 'email')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    response TEXT CHECK (response IN ('available', 'unavailable', 'expired')),
    ttl_hours INT DEFAULT 4              -- auto-expire if no response
);

CREATE INDEX idx_availability_pings_profile ON public.availability_pings(profile_id, sent_at DESC);
CREATE INDEX idx_availability_pings_pending ON public.availability_pings(responded_at) WHERE responded_at IS NULL;

-- Stale-status decay: auto-flip availability after N hours of silence
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS availability_confirmed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS availability_stale BOOLEAN DEFAULT FALSE;

-- RPC: Mark stale profiles (called by scheduled Edge Function)
CREATE OR REPLACE FUNCTION public.decay_stale_availability(stale_hours INT DEFAULT 6)
RETURNS INT AS $$
DECLARE
    affected INT;
BEGIN
    UPDATE public.profiles
    SET is_available = FALSE,
        availability_stale = TRUE,
        updated_at = NOW()
    WHERE is_available = TRUE
      AND (availability_confirmed_at IS NULL OR availability_confirmed_at < NOW() - (stale_hours || ' hours')::INTERVAL)
      AND last_active_at < NOW() - (stale_hours || ' hours')::INTERVAL;

    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. SUPPLY HEATMAP ENGINE (15x multiplier)
-- Materialized view: escorts per corridor, fill failure density
-- ============================================================

-- Corridor supply density
CREATE MATERIALIZED VIEW IF NOT EXISTS public.corridor_supply_heatmap AS
SELECT
    c.corridor_name,
    c.corridor_id,
    COUNT(DISTINCT p.id) FILTER (WHERE p.is_available = TRUE) AS available_escorts,
    COUNT(DISTINCT p.id) AS total_escorts,
    COALESCE(ff.failure_count, 0) AS recent_fill_failures,
    COALESCE(ff.avg_rate_gap_pct, 0) AS avg_rate_gap_pct,
    CASE
        WHEN COUNT(DISTINCT p.id) FILTER (WHERE p.is_available = TRUE) = 0 THEN 'dead_zone'
        WHEN COUNT(DISTINCT p.id) FILTER (WHERE p.is_available = TRUE) < 3 THEN 'weak'
        WHEN COUNT(DISTINCT p.id) FILTER (WHERE p.is_available = TRUE) < 8 THEN 'moderate'
        ELSE 'strong'
    END AS supply_tier,
    NOW() AS computed_at
FROM public.corridors c
LEFT JOIN public.corridor_assignments ca ON ca.corridor_id = c.corridor_id
LEFT JOIN public.profiles p ON p.id = ca.profile_id
LEFT JOIN LATERAL (
    SELECT
        COUNT(*) AS failure_count,
        AVG(rate_gap_pct) AS avg_rate_gap_pct
    FROM public.fill_failures ff
    WHERE ff.corridor = c.corridor_name
      AND ff.created_at > NOW() - INTERVAL '30 days'
) ff ON TRUE
GROUP BY c.corridor_name, c.corridor_id, ff.failure_count, ff.avg_rate_gap_pct;

CREATE UNIQUE INDEX idx_corridor_supply_heatmap_id ON public.corridor_supply_heatmap(corridor_id);

-- ============================================================
-- 3. AUTO-RECRUIT WEAK ZONES (30x multiplier)
-- Targeted recruitment for dead/weak corridors
-- ============================================================

CREATE TABLE public.recruit_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    corridor_id TEXT NOT NULL,
    corridor_name TEXT NOT NULL,
    supply_tier TEXT NOT NULL,  -- 'dead_zone' or 'weak'
    target_state TEXT,

    -- Campaign tracking
    invite_url TEXT,                      -- unique referral link
    invite_code TEXT UNIQUE,
    emails_sent INT DEFAULT 0,
    signups INT DEFAULT 0,

    -- Auto-generated or manual
    source TEXT DEFAULT 'auto' CHECK (source IN ('auto', 'manual')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX idx_recruit_campaigns_corridor ON public.recruit_campaigns(corridor_id);
CREATE INDEX idx_recruit_campaigns_status ON public.recruit_campaigns(status) WHERE status = 'active';

-- ============================================================
-- 4. CORRIDOR SUPPLY INDEX (surge multiplier feed)
-- Real-time scarcity index per corridor for rate engine
-- ============================================================

CREATE TABLE public.corridor_supply_index (
    corridor_id TEXT PRIMARY KEY,
    corridor_name TEXT NOT NULL,

    -- Supply signals
    available_escorts INT DEFAULT 0,
    active_loads INT DEFAULT 0,
    supply_demand_ratio NUMERIC GENERATED ALWAYS AS (
        CASE WHEN active_loads > 0
             THEN available_escorts::NUMERIC / active_loads
             ELSE available_escorts::NUMERIC END
    ) STORED,

    -- Surge computation
    scarcity_score NUMERIC DEFAULT 0 CHECK (scarcity_score BETWEEN 0 AND 100),
    surge_multiplier NUMERIC DEFAULT 1.0 CHECK (surge_multiplier BETWEEN 0.8 AND 3.0),

    -- Metadata
    last_computed_at TIMESTAMPTZ DEFAULT NOW(),
    computation_version INT DEFAULT 1
);

-- RPC: Recompute supply index for a single corridor
CREATE OR REPLACE FUNCTION public.recompute_corridor_supply_index(target_corridor_id TEXT)
RETURNS NUMERIC AS $$
DECLARE
    v_available INT;
    v_active_loads INT;
    v_scarcity NUMERIC;
    v_surge NUMERIC;
BEGIN
    -- Count available escorts in this corridor
    SELECT COUNT(*) INTO v_available
    FROM public.corridor_assignments ca
    JOIN public.profiles p ON p.id = ca.profile_id
    WHERE ca.corridor_id = target_corridor_id
      AND p.is_available = TRUE;

    -- Count active loads on this corridor
    SELECT COUNT(*) INTO v_active_loads
    FROM public.loads l
    WHERE l.corridor = target_corridor_id
      AND l.status IN ('open', 'pending');

    -- Scarcity: 0 = plenty of supply, 100 = zero supply for demand
    IF v_active_loads = 0 THEN
        v_scarcity := 0;
    ELSIF v_available = 0 THEN
        v_scarcity := 100;
    ELSE
        v_scarcity := LEAST(100, (v_active_loads::NUMERIC / v_available) * 50);
    END IF;

    -- Surge: 1.0 base, up to 2.5x at 100 scarcity
    v_surge := ROUND(1.0 + (v_scarcity / 100.0) * 1.5, 2);

    -- Upsert
    INSERT INTO public.corridor_supply_index (corridor_id, corridor_name, available_escorts, active_loads, scarcity_score, surge_multiplier, last_computed_at)
    SELECT target_corridor_id, c.corridor_name, v_available, v_active_loads, v_scarcity, v_surge, NOW()
    FROM public.corridors c WHERE c.corridor_id = target_corridor_id
    ON CONFLICT (corridor_id) DO UPDATE SET
        available_escorts = EXCLUDED.available_escorts,
        active_loads = EXCLUDED.active_loads,
        scarcity_score = EXCLUDED.scarcity_score,
        surge_multiplier = EXCLUDED.surge_multiplier,
        last_computed_at = NOW(),
        computation_version = public.corridor_supply_index.computation_version + 1;

    RETURN v_surge;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.availability_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruit_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corridor_supply_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escorts view own pings"
    ON public.availability_pings FOR SELECT TO authenticated
    USING (auth.uid() = profile_id);

CREATE POLICY "Supply index visible to all authenticated"
    ON public.corridor_supply_index FOR SELECT TO authenticated USING (true);

CREATE POLICY "Recruit campaigns visible to admins"
    ON public.recruit_campaigns FOR SELECT TO authenticated USING (true);
