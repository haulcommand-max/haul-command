-- =========================================================
-- COMPLIANCE BRAIN + EQUIPMENT COMPLIANCE SCANNER
-- Purpose: Mathematically model escort physics, position
-- logic, and equipment validation.
-- =========================================================

-- Feature flags
INSERT INTO public.feature_flags(key, enabled, rollout_pct, description) VALUES
  ('compliance_brain', true, 100, 'Compute escort requirements based on load physics'),
  ('equipment_scanner', true, 100, 'Track and validate non-negotiable escort equipment')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- 1. Equipment Tracking on Vendors (The "Non-Negotiables")
-- ─────────────────────────────────────────────────────────
ALTER TABLE public.vendors
  -- Core compliant equipment tracking
  ADD COLUMN IF NOT EXISTS has_amber_beacon boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_oversize_signs boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_two_way_radio boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS radio_type text CHECK (radio_type IN ('CB', 'UHF', 'VHF', 'GMRS', 'multiple', 'none')) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS has_height_pole boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_pole_height_inches int,
  ADD COLUMN IF NOT EXISTS equipment_compliance_score numeric(4,2) DEFAULT 0.00
    CHECK (equipment_compliance_score >= 0 AND equipment_compliance_score <= 1);

CREATE INDEX IF NOT EXISTS vendors_compliance_idx ON public.vendors(equipment_compliance_score DESC);

-- ─────────────────────────────────────────────────────────
-- 2. Load Compliance Requirements (The Math)
-- ─────────────────────────────────────────────────────────
-- We expand the `loads` table (from routing layer) to store computed compliance requirements.
ALTER TABLE public.loads
  -- Computed from physics (width/height/length)
  ADD COLUMN IF NOT EXISTS req_front_escorts int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS req_rear_escorts int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS req_height_pole boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS req_police_escort boolean NOT NULL DEFAULT false,
  
  -- Sourced from HERE routing & State Rules
  ADD COLUMN IF NOT EXISTS daylight_only_restricted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS curfew_restricted boolean NOT NULL DEFAULT false,
  
  -- Output Scoring
  ADD COLUMN IF NOT EXISTS route_risk_score numeric(4,2),
  ADD COLUMN IF NOT EXISTS escort_coverage_confidence numeric(4,2);

-- ─────────────────────────────────────────────────────────
-- 3. The Requirement Prediction Engine (RPC)
-- Mathematically calculates escort needs securely on DB.
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.compute_load_compliance(p_load_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l_load     public.loads%ROWTYPE;
  v_front    int := 0;
  v_rear     int := 0;
  v_pole     boolean := false;
  v_police   boolean := false;
  v_daylight boolean := false;
  v_risk     numeric := 0.00;
BEGIN
  -- 1. Fetch the load physics
  SELECT * INTO l_load FROM public.loads WHERE id = p_load_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'load_not_found'); END IF;

  -- 2. Core Operational Reality Math (Baseline Generic Heuristics)
  -- Real system would query state-by-state dimensions, this establishes the engine structure.
  
  -- Width triggers
  IF COALESCE(l_load.width_inches, 0) > 144 THEN -- 12ft
    v_front := GREATEST(v_front, 1);
    v_rear  := GREATEST(v_rear, 1);
    v_risk  := v_risk + 0.3;
  ELSIF COALESCE(l_load.width_inches, 0) > 120 THEN -- 10ft
    v_rear  := GREATEST(v_rear, 1);
    v_risk  := v_risk + 0.1;
  END IF;

  -- Height triggers
  IF COALESCE(l_load.height_inches, 0) > 174 THEN -- 14'6"
    v_pole  := true;
    v_front := GREATEST(v_front, 1);
    v_risk  := v_risk + 0.4;
  END IF;

  -- Length triggers
  IF COALESCE(l_load.length_inches, 0) > 1080 THEN -- 90ft
    v_rear  := GREATEST(v_rear, 1);
    v_risk  := v_risk + 0.2;
    IF COALESCE(l_load.length_inches, 0) > 1440 THEN -- 120ft
       v_police := true;
       v_daylight := true;
    END IF;
  END IF;

  -- Clamp risk
  v_risk := GREATEST(0, LEAST(1, v_risk));

  -- 3. Write back to loads table
  UPDATE public.loads
  SET 
    req_front_escorts   = v_front,
    req_rear_escorts    = v_rear,
    req_height_pole     = v_pole,
    req_police_escort   = v_police,
    daylight_only_restricted = v_daylight,
    route_risk_score    = ROUND(v_risk, 2),
    updated_at          = now()
  WHERE id = p_load_id;

  -- 4. Return the physics layout logic
  RETURN jsonb_build_object(
    'ok', true,
    'req_front', v_front,
    'req_rear', v_rear,
    'req_height_pole', v_pole,
    'req_police', v_police,
    'route_risk_score', ROUND(v_risk, 2)
  );
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 4. Equipment Compliance Scanner (RPC)
-- Computes an exact compliance confidence score based on equipment presence.
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.compute_vendor_equipment_compliance(p_vendor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v public.vendors%ROWTYPE;
  v_score numeric := 0.00;
BEGIN
  SELECT * INTO v FROM public.vendors WHERE id = p_vendor_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'vendor_not_found'); END IF;

  -- Base safety requirements (30% each)
  IF v.has_amber_beacon THEN v_score := v_score + 0.30; END IF;
  IF v.has_oversize_signs THEN v_score := v_score + 0.30; END IF;
  IF v.has_two_way_radio AND v.radio_type != 'none' THEN v_score := v_score + 0.30; END IF;
  
  -- Specialized equipment bonus (+10%)
  IF v.has_height_pole THEN v_score := v_score + 0.10; END IF;

  v_score := GREATEST(0, LEAST(1, v_score));

  UPDATE public.vendors
  SET equipment_compliance_score = ROUND(v_score, 2), updated_at = now()
  WHERE id = p_vendor_id;

  RETURN jsonb_build_object('ok', true, 'equipment_compliance_score', ROUND(v_score, 2));
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 5. Trigger Physics Update on Load Dimensions Change
-- Automatically runs the compliance brain when load stats map.
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_load_physics_compliance()
RETURNS trigger AS $$
BEGIN
  -- Check if dimensions changed
  IF (TG_OP = 'INSERT') OR 
     (OLD.width_inches IS DISTINCT FROM NEW.width_inches OR 
      OLD.height_inches IS DISTINCT FROM NEW.height_inches OR 
      OLD.length_inches IS DISTINCT FROM NEW.length_inches) THEN
      
      -- We must defer the direct RPC call to avoid endless loops 
      -- or just compute inline for performance. Computing inline here:
      NEW.req_front_escorts := 0;
      NEW.req_rear_escorts := 0;
      NEW.req_height_pole := false;
      NEW.req_police_escort := false;
      NEW.route_risk_score := 0.0;
      
      IF COALESCE(NEW.width_inches, 0) > 144 THEN
        NEW.req_front_escorts := GREATEST(NEW.req_front_escorts, 1);
        NEW.req_rear_escorts  := GREATEST(NEW.req_rear_escorts, 1);
        NEW.route_risk_score  := NEW.route_risk_score + 0.3;
      ELSIF COALESCE(NEW.width_inches, 0) > 120 THEN
        NEW.req_rear_escorts  := GREATEST(NEW.req_rear_escorts, 1);
        NEW.route_risk_score  := NEW.route_risk_score + 0.1;
      END IF;

      IF COALESCE(NEW.height_inches, 0) > 174 THEN
        NEW.req_height_pole := true;
        NEW.req_front_escorts := GREATEST(NEW.req_front_escorts, 1);
        NEW.route_risk_score  := NEW.route_risk_score + 0.4;
      END IF;

      IF COALESCE(NEW.length_inches, 0) > 1080 THEN
        NEW.req_rear_escorts  := GREATEST(NEW.req_rear_escorts, 1);
        NEW.route_risk_score  := NEW.route_risk_score + 0.2;
        IF COALESCE(NEW.length_inches, 0) > 1440 THEN
           NEW.req_police_escort := true;
           NEW.daylight_only_restricted := true;
        END IF;
      END IF;
      
      NEW.route_risk_score := GREATEST(0, LEAST(1, NEW.route_risk_score));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_load_physics_compliance ON public.loads;
CREATE TRIGGER trg_load_physics_compliance
  BEFORE INSERT OR UPDATE ON public.loads
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_load_physics_compliance();
