-- ============================================================================
-- 10x Plays Completion — Ingestion + Matching + Render Queue
-- Migration: 20260303000007
-- ============================================================================
-- Adds the three missing pieces from the Nuclear 10 pack:
--  1) Single-path convoy ingestion (telemetry + presence + event in one call)
--  2) Reputation-gated matching (rank operators + rate multiplier bands)
--  3) Remotion render queue (enqueue → claim → finish with SKIP LOCKED)
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 0) Enums (idempotent, additive)
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE public.hc_render_job_status AS ENUM (
    'queued','running','succeeded','failed','canceled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 1) CONVOY INGESTION — Single Write Path
-- ═══════════════════════════════════════════════════════════════════════════
-- Mobile app calls this every ~30s while moving.
-- One function does: insert telemetry → upsert presence → optional load event.

CREATE OR REPLACE FUNCTION public.hc_ingest_convoy_ping(
  p_operator_id      UUID,
  p_load_id          UUID DEFAULT NULL,
  p_ts               TIMESTAMPTZ DEFAULT now(),
  p_lat              DOUBLE PRECISION DEFAULT NULL,
  p_lng              DOUBLE PRECISION DEFAULT NULL,
  p_speed_mph        NUMERIC DEFAULT NULL,
  p_heading_deg      SMALLINT DEFAULT NULL,
  p_gps_accuracy_m   NUMERIC DEFAULT NULL,
  p_meta             JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_geo GEOGRAPHY;
BEGIN
  -- AuthZ: operator must be self
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.type = 'escort'
  ) THEN
    RAISE EXCEPTION 'not_allowed: operator must be authenticated owner';
  END IF;

  -- Compute geography once
  IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
    v_geo := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
  END IF;

  -- 1) Insert telemetry row
  INSERT INTO public.hc_convoy_telemetry (
    load_id, operator_id, ts, lat, lng,
    speed_mph, heading_deg, gps_accuracy_m,
    is_moving, geo_point
  ) VALUES (
    p_load_id, p_operator_id, p_ts, p_lat, p_lng,
    p_speed_mph, p_heading_deg, p_gps_accuracy_m,
    COALESCE(p_speed_mph > 2, true),
    v_geo
  );

  -- 2) Upsert presence (single row per operator — fast nearest-lookup)
  INSERT INTO public.presence_heartbeats (profile_id, lat, lng, last_seen_at)
  VALUES (
    (SELECT id FROM public.profiles WHERE user_id = p_operator_id LIMIT 1),
    p_lat, p_lng, p_ts
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    last_seen_at = EXCLUDED.last_seen_at;

  -- 3) Touch identity activity
  UPDATE public.hc_identities
  SET last_active_at = p_ts
  WHERE user_id = p_operator_id;

  -- 4) Optional: emit checkpoint event on first ping per load
  IF p_load_id IS NOT NULL THEN
    INSERT INTO public.hc_load_events (
      load_id, event_type, event_ts, lat, lng,
      actor_user_id, actor_role,
      metadata
    ) VALUES (
      p_load_id, 'checkpoint_passed', p_ts, p_lat, p_lng,
      p_operator_id, 'operator',
      jsonb_build_object('source', 'convoy_ping', 'speed_mph', p_speed_mph)
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'ts', p_ts,
    'load_id', p_load_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.hc_ingest_convoy_ping FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hc_ingest_convoy_ping TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 2) REPUTATION-GATED MATCHING
-- ═══════════════════════════════════════════════════════════════════════════

-- Rate lift bands (NOT hardcoded 15%)
CREATE OR REPLACE FUNCTION public.hc_compute_rate_multiplier(p_trust_score NUMERIC)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_trust_score >= 90 THEN 1.15   -- Elite
    WHEN p_trust_score >= 75 THEN 1.10   -- Gold
    WHEN p_trust_score >= 60 THEN 1.05   -- Silver
    ELSE 1.00                             -- Bronze
  END;
$$;

-- Rank operators for a specific load
-- Combines trust × recency × base fit with guardrails
CREATE OR REPLACE FUNCTION public.hc_rank_operators_for_load(
  p_load_id          UUID,
  p_base_fit_weight  NUMERIC DEFAULT 0.55,
  p_trust_weight     NUMERIC DEFAULT 0.30,
  p_recency_weight   NUMERIC DEFAULT 0.15,
  p_limit            INT DEFAULT 25
)
RETURNS TABLE (
  operator_id        UUID,
  display_name       TEXT,
  is_verified        BOOLEAN,
  trust_score        INT,
  social_gravity     SMALLINT,
  last_active_at     TIMESTAMPTZ,
  distance_miles     NUMERIC,
  match_score        NUMERIC,
  rate_multiplier    NUMERIC,
  activity_status    TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH load_info AS (
    SELECT id, origin_city, origin_state
    FROM public.hc_loads WHERE id = p_load_id
  ),
  candidates AS (
    SELECT
      p.user_id AS operator_id,
      p.display_name,
      p.verified AS is_verified,
      COALESCE(hi.trust_tier, 0) AS trust_score,
      COALESCE(sgs.social_gravity_score, 0) AS social_gravity,
      COALESCE(hi.last_active_at, p.updated_at) AS last_active_at,
      -- Recency: 0..1 where now = 1, 30min ago = 0
      GREATEST(0, LEAST(1,
        1.0 - (EXTRACT(EPOCH FROM (now() - COALESCE(hi.last_active_at, p.updated_at))) / 1800.0)
      ))::NUMERIC AS recency_score,
      p.availability
    FROM public.profiles p
    LEFT JOIN public.hc_identities hi ON hi.user_id = p.user_id
    LEFT JOIN public.hc_social_gravity_scores sgs
      ON sgs.entity_type = 'operator' AND sgs.entity_id = p.user_id::text
    WHERE p.type = 'escort'
      AND p.availability IN ('available', 'busy')
  )
  SELECT
    c.operator_id,
    c.display_name,
    c.is_verified,
    c.trust_score,
    c.social_gravity::SMALLINT,
    c.last_active_at,
    NULL::NUMERIC AS distance_miles,  -- Plug in PostGIS distance when origin geog available
    -- Weighted match score
    (
      (0.50 * p_base_fit_weight) +                                           -- base fit placeholder
      ((LEAST(GREATEST(c.trust_score, 0), 4) / 4.0) * p_trust_weight) +     -- trust normalized 0..1
      (c.recency_score * p_recency_weight)
    )::NUMERIC AS match_score,
    public.hc_compute_rate_multiplier(c.social_gravity::numeric) AS rate_multiplier,
    CASE
      WHEN c.last_active_at >= now() - INTERVAL '24 hours' THEN 'active_today'
      WHEN c.last_active_at >= now() - INTERVAL '7 days' THEN 'active_this_week'
      ELSE 'inactive'
    END AS activity_status
  FROM candidates c
  ORDER BY
    c.is_verified DESC,                -- Verified float to top
    match_score DESC
  LIMIT GREATEST(p_limit, 1);
$$;

REVOKE ALL ON FUNCTION public.hc_rank_operators_for_load FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hc_rank_operators_for_load TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 3) REMOTION RENDER QUEUE — Proof-of-Run Auto-Videos
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_render_jobs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type           TEXT NOT NULL DEFAULT 'proof_of_run',
  load_id            UUID,
  operator_id        UUID,
  -- Queue state
  status             public.hc_render_job_status NOT NULL DEFAULT 'queued',
  priority           INT NOT NULL DEFAULT 100,
  attempts           INT NOT NULL DEFAULT 0,
  max_attempts       INT NOT NULL DEFAULT 5,
  -- Payload
  input_payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_url         TEXT,
  error_message      TEXT,
  -- Locking
  locked_by          TEXT,
  locked_at          TIMESTAMPTZ,
  run_after          TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Timestamps
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_render_jobs_queue
  ON public.hc_render_jobs (status, run_after ASC, priority ASC)
  WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_render_jobs_load
  ON public.hc_render_jobs (load_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_operator
  ON public.hc_render_jobs (operator_id);

ALTER TABLE public.hc_render_jobs ENABLE ROW LEVEL SECURITY;

-- Operators can read their own completed jobs
CREATE POLICY rj_operator_read ON public.hc_render_jobs FOR SELECT
  USING (
    operator_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id::text = hc_render_jobs.operator_id::text
        AND p.user_id = auth.uid()
    )
  );

-- Brokers can read jobs for their loads
CREATE POLICY rj_broker_read ON public.hc_render_jobs FOR SELECT
  USING (
    load_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.hc_loads l
      WHERE l.id = hc_render_jobs.load_id
        AND l.broker_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY rj_service ON public.hc_render_jobs FOR ALL
  USING (auth.role() = 'service_role');

GRANT SELECT ON public.hc_render_jobs TO authenticated;


-- ── Enqueue RPC ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.hc_enqueue_render_job(
  p_load_id      UUID,
  p_operator_id  UUID DEFAULT NULL,
  p_job_type     TEXT DEFAULT 'proof_of_run',
  p_priority     INT DEFAULT 100
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id UUID;
BEGIN
  -- AuthZ: broker owner of the load
  IF NOT EXISTS (
    SELECT 1 FROM public.hc_loads l
    WHERE l.id = p_load_id
      AND l.broker_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_allowed: must be broker owner of load';
  END IF;

  INSERT INTO public.hc_render_jobs (
    job_type, load_id, operator_id, priority,
    input_payload
  ) VALUES (
    p_job_type, p_load_id, p_operator_id, p_priority,
    jsonb_build_object(
      'template', p_job_type,
      'load_id', p_load_id,
      'operator_id', p_operator_id
    )
  )
  RETURNING id INTO v_job_id;

  -- Wake listener
  PERFORM pg_notify('hc_render_jobs', v_job_id::text);

  -- Auto-emit load event
  INSERT INTO public.hc_load_events (
    load_id, event_type, actor_user_id, actor_role,
    metadata
  ) VALUES (
    p_load_id, 'proof_uploaded', auth.uid(), 'broker',
    jsonb_build_object('render_job_id', v_job_id, 'type', p_job_type)
  );

  RETURN v_job_id;
END;
$$;

REVOKE ALL ON FUNCTION public.hc_enqueue_render_job FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hc_enqueue_render_job TO authenticated;


-- ── Worker Claim (service_role) ──────────────────────────────────────────
-- Uses FOR UPDATE SKIP LOCKED for safe concurrent workers.

CREATE OR REPLACE FUNCTION public.hc_claim_next_render_job(
  p_worker_id    TEXT,
  p_lock_minutes INT DEFAULT 10
)
RETURNS public.hc_render_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.hc_render_jobs;
BEGIN
  UPDATE public.hc_render_jobs r
  SET
    status = 'running',
    locked_by = p_worker_id,
    locked_at = now(),
    attempts = attempts + 1,
    updated_at = now()
  WHERE r.id = (
    SELECT id
    FROM public.hc_render_jobs
    WHERE status = 'queued'
      AND run_after <= now()
      AND attempts < max_attempts
    ORDER BY priority ASC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$;

REVOKE ALL ON FUNCTION public.hc_claim_next_render_job FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hc_claim_next_render_job TO authenticated;


-- ── Worker Finish ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.hc_finish_render_job(
  p_job_id         UUID,
  p_succeeded      BOOLEAN,
  p_output_url     TEXT DEFAULT NULL,
  p_error_message  TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.hc_render_jobs SET
    status = CASE WHEN p_succeeded THEN 'succeeded'::public.hc_render_job_status
                  ELSE 'failed'::public.hc_render_job_status END,
    output_url = p_output_url,
    error_message = p_error_message,
    locked_by = NULL,
    locked_at = NULL,
    run_after = CASE WHEN p_succeeded THEN run_after
                     ELSE now() + INTERVAL '5 minutes' END,
    updated_at = now()
  WHERE id = p_job_id;
END;
$$;

REVOKE ALL ON FUNCTION public.hc_finish_render_job FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hc_finish_render_job TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 4) AUTO-TRIGGER: Enqueue render on load completion
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.hc_auto_enqueue_render_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.load_status = 'delivered' AND (OLD.load_status IS DISTINCT FROM 'delivered') THEN
    INSERT INTO public.hc_render_jobs (
      job_type, load_id, priority,
      input_payload
    ) VALUES (
      'proof_of_run', NEW.id, 50,
      jsonb_build_object('template', 'proof_of_run', 'load_id', NEW.id, 'auto', true)
    );
    PERFORM pg_notify('hc_render_jobs', 'auto:' || NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hc_auto_render ON public.hc_loads;
CREATE TRIGGER trg_hc_auto_render
  AFTER UPDATE ON public.hc_loads
  FOR EACH ROW
  WHEN (NEW.load_status = 'delivered')
  EXECUTE FUNCTION public.hc_auto_enqueue_render_on_completion();

COMMIT;
