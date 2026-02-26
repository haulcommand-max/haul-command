-- ops_job_runs: structured telemetry for all automated data jobs
-- Tracks execution history, rows written, duration, and failure context.
-- Used by watchdog for freshness SLA monitoring.

CREATE TABLE IF NOT EXISTS public.ops_job_runs (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_name    TEXT NOT NULL,
    status      TEXT NOT NULL CHECK (status IN ('success', 'fail', 'partial', 'running')),
    started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    rows_written INTEGER DEFAULT 0,
    duration_ms  INTEGER,
    sha          TEXT,                -- git commit SHA for traceability
    meta         JSONB DEFAULT '{}'::jsonb,
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- Index for watchdog queries (latest run per job)
CREATE INDEX IF NOT EXISTS idx_ops_job_runs_job_finished
    ON public.ops_job_runs (job_name, finished_at DESC);

-- RLS: no anon access, service role can insert/read
ALTER TABLE public.ops_job_runs ENABLE ROW LEVEL SECURITY;

-- Service role bypass (full access)
CREATE POLICY ops_job_runs_service_all
    ON public.ops_job_runs
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Block anon
CREATE POLICY ops_job_runs_anon_deny
    ON public.ops_job_runs
    FOR SELECT
    USING (false);
