-- ────────────────────────────────────────────────────────────
-- 20260302 — Wire remaining gaps: on_time, scarcity slug fix,
-- atomic job count increment, corridor_supply_snapshot DDL
-- ────────────────────────────────────────────────────────────

-- 1. Add on_time boolean to jobs (derives from completion data)
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS on_time BOOLEAN;

-- Backfill: mark all existing completed jobs as on_time = true (no late data to infer from)
UPDATE public.jobs SET on_time = true WHERE status = 'completed' AND on_time IS NULL;

-- 2. Fix corridor_scarcity_metrics: corridor_id should be TEXT (slug like "US-FL")
-- The column was defined as UUID but the match engine queries with text slugs.
ALTER TABLE public.corridor_scarcity_metrics
ALTER COLUMN corridor_id TYPE TEXT USING corridor_id::TEXT;

-- 3. Atomic increment RPC for active_job_count on operator_availability
CREATE OR REPLACE FUNCTION public.increment_active_job_count(operator_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.operator_availability
    SET active_job_count = COALESCE(active_job_count, 0) + 1,
        updated_at = now()
    WHERE operator_id = ANY(operator_ids);
END;
$$;

-- 4. Ensure corridor_supply_snapshot table exists (cron writes to it)
CREATE TABLE IF NOT EXISTS public.corridor_supply_snapshot (
    id              BIGSERIAL PRIMARY KEY,
    corridor_slug   TEXT NOT NULL,
    timestamp_bucket TIMESTAMPTZ NOT NULL,
    supply_count    INTEGER DEFAULT 0,
    available_count INTEGER DEFAULT 0,
    acceptance_velocity_24h NUMERIC DEFAULT 0,
    demand_pressure NUMERIC(4,3) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(corridor_slug, timestamp_bucket)
);

CREATE INDEX IF NOT EXISTS idx_corridor_supply_snapshot_slug
ON public.corridor_supply_snapshot(corridor_slug, timestamp_bucket DESC);

-- 5. Habit engine: streak tracking table
CREATE TABLE IF NOT EXISTS public.operator_streaks (
    user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    streak_type     TEXT NOT NULL DEFAULT 'availability',
    current_streak  INTEGER NOT NULL DEFAULT 0,
    longest_streak  INTEGER NOT NULL DEFAULT 0,
    last_check_in   TIMESTAMPTZ,
    badges          JSONB DEFAULT '[]'::JSONB,
    updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.operator_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own streaks" ON public.operator_streaks
    FOR SELECT USING (auth.uid() = user_id);

-- 6. Habit engine: scheduled_notifications table
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_loop_id   TEXT NOT NULL,
    channel         TEXT NOT NULL CHECK (channel IN ('push', 'email', 'sms', 'in_app')),
    scheduled_at    TIMESTAMPTZ NOT NULL,
    message         TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'acted')),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending
ON public.scheduled_notifications(scheduled_at) WHERE status = 'pending';

ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own scheduled notifications" ON public.scheduled_notifications
    FOR SELECT USING (auth.uid() = user_id);
