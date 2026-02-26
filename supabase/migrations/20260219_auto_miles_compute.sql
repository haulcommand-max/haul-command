-- =========================================================
-- AUTO MILES COMPUTE — Schema + Trigger
-- Appends routing fields to `loads`.
-- Trigger fires on coord/manual-miles changes and invokes
-- the miles-compute edge function via pg_net (async).
-- =========================================================

-- Feature flag
INSERT INTO public.feature_flags(key, enabled, rollout_pct, description) VALUES
  ('auto_miles_compute',  true,  100, 'HERE auto-compute route miles with manual fallback'),
  ('miles_discrepancy_flag', true, 100, 'Flag >8% manual vs HERE discrepancy for review')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- Schema: routing fields on loads
-- ─────────────────────────────────────────────────────────
ALTER TABLE public.loads
  ADD COLUMN IF NOT EXISTS miles_value           numeric(8,1),
  ADD COLUMN IF NOT EXISTS miles_source          text CHECK (miles_source IN ('manual','here')),
  ADD COLUMN IF NOT EXISTS miles_status          text NOT NULL DEFAULT 'missing'
                             CHECK (miles_status IN ('missing','pending','computed','failed','stale')),
  ADD COLUMN IF NOT EXISTS miles_value_here      numeric(8,1),
  ADD COLUMN IF NOT EXISTS miles_value_final     numeric(8,1),
  ADD COLUMN IF NOT EXISTS miles_locked          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS route_polyline        text,
  ADD COLUMN IF NOT EXISTS route_summary_json    jsonb,
  ADD COLUMN IF NOT EXISTS here_request_hash     text,
  ADD COLUMN IF NOT EXISTS miles_last_computed_at timestamptz,
  ADD COLUMN IF NOT EXISTS miles_failure_reason  text;

CREATE INDEX IF NOT EXISTS loads_miles_status_idx ON public.loads(miles_status);
CREATE INDEX IF NOT EXISTS loads_miles_hash_idx   ON public.loads(here_request_hash) WHERE here_request_hash IS NOT NULL;

-- ─────────────────────────────────────────────────────────
-- RPC: set_load_miles_manual
-- Called by UI when broker types manual miles.
-- Enforces manual-wins doctrine + discrepancy flag.
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
  v_load        public.loads%ROWTYPE;
  v_variance    numeric;
  v_flag        boolean := false;
BEGIN
  SELECT * INTO v_load FROM public.loads WHERE id = p_load_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'load_not_found');
  END IF;

  IF p_miles IS NULL OR p_miles <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_miles');
  END IF;

  -- Discrepancy guard: flag if manual vs HERE diverges > 8%
  IF v_load.miles_value_here IS NOT NULL AND v_load.miles_value_here > 0 THEN
    v_variance := ABS(p_miles - v_load.miles_value_here) / v_load.miles_value_here;
    IF v_variance > 0.08 THEN
      v_flag := true;
    END IF;
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

  -- Emit flag row via analytics_events for review queue
  IF v_flag THEN
    INSERT INTO public.analytics_events(user_id, event_type, properties)
    VALUES (
      auth.uid(),
      'miles_discrepancy_flag',
      jsonb_build_object(
        'load_id',            p_load_id,
        'manual_miles',       p_miles,
        'here_miles',         v_load.miles_value_here,
        'variance_pct',       ROUND(v_variance * 100, 1),
        'severity',           'review'
      )
    );
  END IF;

  RETURN jsonb_build_object('ok', true, 'locked', true, 'discrepancy_flagged', v_flag);
END;
$$;

-- ─────────────────────────────────────────────────────────
-- RPC: set_load_miles_here  (called by edge function)
-- Writes HERE result; respects miles_locked.
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_load_miles_here(
  p_load_id          uuid,
  p_miles            numeric,
  p_hash             text,
  p_polyline         text       DEFAULT NULL,
  p_route_summary    jsonb      DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.loads
  SET
    miles_value_here         = p_miles,
    miles_source             = CASE WHEN miles_locked THEN miles_source ELSE 'here' END,
    miles_value_final        = CASE WHEN miles_locked THEN miles_value_final ELSE p_miles END,
    miles_status             = 'computed',
    here_request_hash        = p_hash,
    miles_last_computed_at   = now(),
    route_polyline           = COALESCE(p_polyline, route_polyline),
    route_summary_json       = COALESCE(p_route_summary, route_summary_json),
    miles_failure_reason     = NULL,
    updated_at               = now()
  WHERE id = p_load_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ─────────────────────────────────────────────────────────
-- RPC: set_load_miles_failed  (called by edge function)
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_load_miles_failed(
  p_load_id      uuid,
  p_reason       text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.loads
  SET
    miles_status         = 'failed',
    miles_failure_reason = p_reason,
    updated_at           = now()
  WHERE id = p_load_id
    AND miles_locked = false;   -- never overwrite a locked manual entry

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ─────────────────────────────────────────────────────────
-- Trigger: On coord change OR miles_value (manual entry) →
--   • If manual miles entered → call set_load_miles_manual logic inline
--   • If coords complete and not locked → set pending + enqueue edge fn
-- pg_net is used for async HTTP; if not available, raise notice and set pending.
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_auto_miles_compute()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_has_coords   boolean;
  v_new_hash     text;
BEGIN
  -- CASE 1: Manual miles entered (broker typed a value)
  -- Handled in UI via set_load_miles_manual RPC — trigger just ensures consistency
  IF (NEW.miles_value IS DISTINCT FROM OLD.miles_value)
     AND NEW.miles_value IS NOT NULL
     AND NEW.miles_source = 'manual' THEN
    -- Already handled by the RPC; nothing to override here
    RETURN NEW;
  END IF;

  -- CASE 2: Coords changed → evaluate auto-compute
  v_has_coords := (
    NEW.origin_lat  IS NOT NULL AND
    NEW.origin_lng  IS NOT NULL AND
    NEW.dest_lat    IS NOT NULL AND
    NEW.dest_lng    IS NOT NULL
  );

  IF NOT v_has_coords THEN
    IF NEW.miles_status NOT IN ('computed') OR NEW.miles_locked = false THEN
      NEW.miles_status := 'missing';
    END IF;
    RETURN NEW;
  END IF;

  -- If manual locked, don't touch
  IF NEW.miles_locked = true THEN
    RETURN NEW;
  END IF;

  -- Build dedup hash
  v_new_hash := md5(
    NEW.origin_lat::text || '|' ||
    NEW.origin_lng::text || '|' ||
    NEW.dest_lat::text   || '|' ||
    NEW.dest_lng::text
  );

  -- Redundancy smash: same hash + already computed → skip
  IF NEW.here_request_hash = v_new_hash AND NEW.miles_status = 'computed' THEN
    RETURN NEW;
  END IF;

  -- Mark pending — edge function will call set_load_miles_here when done
  NEW.miles_status      := 'pending';
  NEW.here_request_hash := v_new_hash;

  -- Async invoke via pg_net if extension is available
  -- (miles-compute edge function reads the pending row and calls HERE)
  BEGIN
    PERFORM net.http_post(
      url     := current_setting('app.edge_base_url', true) || '/miles-compute',
      body    := jsonb_build_object('load_id', NEW.id, 'hash', v_new_hash),
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- pg_net not configured or edge URL missing — pending row is enough;
    -- the edge function can poll or be invoked externally.
    RAISE NOTICE 'miles-compute: pg_net invoke skipped (%), load % queued as pending', SQLERRM, NEW.id;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_miles_compute ON public.loads;
CREATE TRIGGER trg_auto_miles_compute
BEFORE UPDATE OF origin_lat, origin_lng, dest_lat, dest_lng, miles_value
ON public.loads
FOR EACH ROW EXECUTE FUNCTION public._trg_auto_miles_compute();
