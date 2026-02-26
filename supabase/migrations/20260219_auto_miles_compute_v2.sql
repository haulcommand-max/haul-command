-- =========================================================
-- AUTO MILES COMPUTE — Addendum v2
-- Extends 20260219_auto_miles_compute.sql with:
--   • Vehicle-per-load params (height/width/length/weight/axles/trailer/tunnel/hazmat)
--   • Route avoid profile (light / medium / heavy)
--   • route_options_version for hash stability
--   • flags_json for discrepancy flags
--   • routing_audit_log table
-- =========================================================

-- ─────────────────────────────────────────────────────────
-- 1. Additional columns on loads
-- ─────────────────────────────────────────────────────────
ALTER TABLE public.loads
  -- Route-option profile (controls avoid features sent to HERE)
  ADD COLUMN IF NOT EXISTS route_avoid_profile      text NOT NULL DEFAULT 'light'
                             CHECK (route_avoid_profile IN ('light','medium','heavy')),
  ADD COLUMN IF NOT EXISTS route_options_version    int NOT NULL DEFAULT 1,

  -- Vehicle dims per-load (override global defaults in edge function)
  ADD COLUMN IF NOT EXISTS vehicle_height_cm        int,
  ADD COLUMN IF NOT EXISTS vehicle_width_cm         int,
  ADD COLUMN IF NOT EXISTS vehicle_length_cm        int,
  ADD COLUMN IF NOT EXISTS vehicle_gross_weight_kg  int,
  ADD COLUMN IF NOT EXISTS vehicle_current_weight_kg int,
  ADD COLUMN IF NOT EXISTS vehicle_axle_count       int,
  ADD COLUMN IF NOT EXISTS vehicle_trailer_count    int,
  ADD COLUMN IF NOT EXISTS vehicle_tunnel_category  text CHECK (vehicle_tunnel_category IN ('A','B','C','D','E')),
  ADD COLUMN IF NOT EXISTS vehicle_shipped_hazardous_goods jsonb DEFAULT '[]'::jsonb,

  -- Flags array (discrepancy, hard-block, etc.)
  ADD COLUMN IF NOT EXISTS flags_json               jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS loads_avoid_profile_idx ON public.loads(route_avoid_profile);

-- ─────────────────────────────────────────────────────────
-- 2. routing_audit_log
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.routing_audit_log (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id               uuid NOT NULL,   -- FK omitted intentionally: loads may be soft-deleted
  created_at            timestamptz NOT NULL DEFAULT now(),
  action                text NOT NULL CHECK (action IN (
                           'compute_attempt','compute_success','compute_fail',
                           'manual_override','unlock_manual')),
  request_hash          text,
  request_payload_json  jsonb,     -- sanitized (no apiKey ever stored here)
  response_meta_json    jsonb,     -- distance_meters, miles, status, warnings
  actor                 text,      -- user_id or 'system'
  notes                 text
);

CREATE INDEX IF NOT EXISTS ral_load_idx    ON public.routing_audit_log(load_id);
CREATE INDEX IF NOT EXISTS ral_action_idx  ON public.routing_audit_log(load_id, action);
CREATE INDEX IF NOT EXISTS ral_created_idx ON public.routing_audit_log(created_at DESC);

ALTER TABLE public.routing_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read/insert
CREATE POLICY ral_admin_all ON public.routing_audit_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Edge fn (service_role) can insert freely
CREATE POLICY ral_service_insert ON public.routing_audit_log
  FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────
-- 3. RPC: unlock_load_miles
-- Admin/ops_manager only — clears miles_locked so HERE can recompute.
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.unlock_load_miles(p_load_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Caller must be admin or ops_manager
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin','ops_manager')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  UPDATE public.loads
  SET
    miles_locked    = false,
    miles_source    = NULL,
    miles_status    = CASE WHEN (origin_lat IS NOT NULL AND dest_lat IS NOT NULL)
                           THEN 'pending' ELSE 'missing' END,
    updated_at      = now()
  WHERE id = p_load_id;

  INSERT INTO public.routing_audit_log(load_id, action, actor, notes)
  VALUES (p_load_id, 'unlock_manual', auth.uid()::text, 'manual lock cleared');

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 4. RPC: add_load_flag / clear_load_flags (used by set_load_miles_manual)
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.add_load_flag(
  p_load_id   uuid,
  p_type      text,
  p_severity  text,
  p_message   text,
  p_meta      jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.loads
  SET flags_json = flags_json || jsonb_build_array(
    jsonb_build_object(
      'type',       p_type,
      'severity',   p_severity,
      'message',    p_message,
      'meta',       p_meta,
      'flagged_at', now()
    )
  ),
  updated_at = now()
  WHERE id = p_load_id;
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 5. Drop + recreate set_load_miles_manual with richer discrepancy logic
-- Adds: hard_block flag (>25%), routing_audit_log entry
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_load_miles_manual(
  p_load_id    uuid,
  p_miles      numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_load           public.loads%ROWTYPE;
  v_variance       numeric;
  v_soft_flag      boolean := false;
  v_hard_flag      boolean := false;
BEGIN
  SELECT * INTO v_load FROM public.loads WHERE id = p_load_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'load_not_found'); END IF;
  IF p_miles IS NULL OR p_miles <= 0 THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_miles'); END IF;

  -- Discrepancy guard
  IF v_load.miles_value_here IS NOT NULL AND v_load.miles_value_here > 0 THEN
    v_variance := ABS(p_miles - v_load.miles_value_here) / v_load.miles_value_here;
    IF v_variance > 0.25 THEN v_hard_flag := true; END IF;
    IF v_variance > 0.08 THEN v_soft_flag := true; END IF;
  END IF;

  UPDATE public.loads
  SET
    miles_value        = p_miles,
    miles_value_final  = p_miles,
    miles_source       = 'manual',
    miles_status       = 'computed',
    miles_locked       = true,
    updated_at         = now()
  WHERE id = p_load_id;

  -- Soft flag (>8%)
  IF v_soft_flag THEN
    PERFORM public.add_load_flag(
      p_load_id, 'miles_discrepancy', 'review',
      'manual miles differ materially from HERE miles',
      jsonb_build_object(
        'here_miles',    v_load.miles_value_here,
        'manual_miles',  p_miles,
        'variance_pct',  ROUND(v_variance * 100, 1)
      )
    );
  END IF;

  -- Hard block flag (>25%)
  IF v_hard_flag THEN
    PERFORM public.add_load_flag(
      p_load_id, 'miles_discrepancy_hard', 'block',
      'miles mismatch too large; verify before publish',
      jsonb_build_object(
        'threshold_ratio', 0.25,
        'variance_ratio',  ROUND(v_variance, 4)
      )
    );
  END IF;

  -- Audit
  INSERT INTO public.routing_audit_log(load_id, action, actor, notes)
  VALUES (p_load_id, 'manual_override', COALESCE(auth.uid()::text, 'broker'),
          format('manual=%s miles locked=true', p_miles));

  RETURN jsonb_build_object(
    'ok',               true,
    'locked',           true,
    'soft_flag',        v_soft_flag,
    'hard_flag',        v_hard_flag
  );
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 6. Nightly stale refresh (pg_cron — optional if pg_cron installed)
-- ─────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'miles_stale_refresh',
      '0 3 * * *',
      $$
        UPDATE public.loads
        SET miles_status = 'stale', updated_at = now()
        WHERE miles_source = 'here'
          AND miles_locked = false
          AND miles_last_computed_at < now() - interval '72 hours'
          AND origin_lat IS NOT NULL AND dest_lat IS NOT NULL
          AND miles_status = 'computed'
        LIMIT 2000;
      $$
    );
  END IF;
END;
$$;
