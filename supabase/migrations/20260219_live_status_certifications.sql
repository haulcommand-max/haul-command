-- =========================================================
-- COMPETITIVE DOMINANCE PACK — Live Status + Trust + Certifications
-- Source: haul-command-competitive-dominance v1.0.0
--
-- Adds:
--   1. Live status toggle + availability confidence on vendor_locations
--   2. Composite trust_score on vendors
--   3. vendor_certifications table with expiry tracking
--   4. Feature flags
-- =========================================================

-- Feature flags
INSERT INTO public.feature_flags(key, enabled, rollout_pct, description) VALUES
  ('vendor_live_status',     true, 100, 'Real-time availability toggle for vendor locations'),
  ('vendor_trust_score',     true, 100, 'Composite multi-factor trust score on vendors'),
  ('vendor_certifications',  true, 100, 'Explicit certification/insurance tracking per vendor')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- 1. Live status + availability confidence on vendor_locations
-- ─────────────────────────────────────────────────────────
ALTER TABLE public.vendor_locations
  ADD COLUMN IF NOT EXISTS live_status text NOT NULL DEFAULT 'off_duty'
    CHECK (live_status IN ('available','on_job','en_route','off_duty')),
  ADD COLUMN IF NOT EXISTS live_status_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_known_lat numeric(10,7),
  ADD COLUMN IF NOT EXISTS last_known_lng numeric(10,7),
  ADD COLUMN IF NOT EXISTS availability_confidence_score numeric(4,2) DEFAULT 0.00
    CHECK (availability_confidence_score >= 0 AND availability_confidence_score <= 1),
  ADD COLUMN IF NOT EXISTS deadhead_risk_score numeric(4,2) DEFAULT 0.00
    CHECK (deadhead_risk_score >= 0 AND deadhead_risk_score <= 1);

CREATE INDEX IF NOT EXISTS vl_live_status_idx
  ON public.vendor_locations(live_status) WHERE live_status = 'available';

CREATE INDEX IF NOT EXISTS vl_last_seen_idx
  ON public.vendor_locations(last_seen_at DESC);

-- ─────────────────────────────────────────────────────────
-- 2. Composite trust score on vendors
--    Formula (from spec §7):
--      trust_score =
--        (on_time_rate * 0.25) +
--        (completion_rate * 0.20) +
--        (response_time_score * 0.15) +
--        (insurance_freshness * 0.10) +
--        (broker_rating * 0.15) +
--        (cancellation_penalty * -0.10) +
--        (corridor_experience * 0.25)
-- ─────────────────────────────────────────────────────────
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS trust_score numeric(5,2) DEFAULT 0.50
    CHECK (trust_score >= 0 AND trust_score <= 1),
  ADD COLUMN IF NOT EXISTS trust_tier text DEFAULT 'standard'
    CHECK (trust_tier IN ('elite','preferred','standard','probation')),
  ADD COLUMN IF NOT EXISTS trust_factors_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Individual factor inputs (updated by background jobs or triggers)
  ADD COLUMN IF NOT EXISTS on_time_rate numeric(4,3) DEFAULT 1.000,
  ADD COLUMN IF NOT EXISTS completion_rate numeric(4,3) DEFAULT 1.000,
  ADD COLUMN IF NOT EXISTS response_time_avg_sec int,
  ADD COLUMN IF NOT EXISTS cancellation_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS jobs_completed int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corridor_experience_json jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS vendors_trust_idx
  ON public.vendors(trust_score DESC) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS vendors_trust_tier_idx
  ON public.vendors(trust_tier) WHERE status = 'active';

-- ─────────────────────────────────────────────────────────
-- 3. vendor_certifications table
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendor_certifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  cert_type       text NOT NULL CHECK (cert_type IN (
                    'general_liability','auto_liability','cargo_insurance',
                    'workers_comp','umbrella',
                    'twic','amber_light_permit','oversize_escort_cert',
                    'state_pilot_car_license','dot_medical','hm_endorsement',
                    'first_aid_cpr','osha_10','height_pole_cert',
                    'other')),
  cert_name       text NOT NULL,
  issuing_body    text,
  cert_number     text,
  issued_at       date,
  expires_at      date,
  is_verified     boolean NOT NULL DEFAULT false,
  verified_at     timestamptz,
  verified_by     uuid REFERENCES auth.users(id),
  document_url    text,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','revoked','pending_review')),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vc_vendor_idx ON public.vendor_certifications(vendor_id);
CREATE INDEX IF NOT EXISTS vc_type_idx   ON public.vendor_certifications(cert_type);
CREATE INDEX IF NOT EXISTS vc_expiry_idx ON public.vendor_certifications(expires_at) WHERE status = 'active';

ALTER TABLE public.vendor_certifications ENABLE ROW LEVEL SECURITY;

-- Vendor can see own certs
CREATE POLICY vc_vendor_read ON public.vendor_certifications
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Vendor can insert own certs
CREATE POLICY vc_vendor_insert ON public.vendor_certifications
  FOR INSERT WITH CHECK (
    vendor_id IN (SELECT id FROM public.vendors WHERE owner_user_id = auth.uid())
  );

-- Admin full access
CREATE POLICY vc_admin_all ON public.vendor_certifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ─────────────────────────────────────────────────────────
-- 4. RPC: toggle_vendor_location_status
-- Vendor sets their live status (available/on_job/en_route/off_duty)
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.toggle_vendor_location_status(
  p_location_id uuid,
  p_status      text,
  p_lat         numeric DEFAULT NULL,
  p_lng         numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('available','on_job','en_route','off_duty') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_status');
  END IF;

  UPDATE public.vendor_locations
  SET
    live_status            = p_status,
    live_status_updated_at = now(),
    last_seen_at           = now(),
    last_known_lat         = COALESCE(p_lat, last_known_lat),
    last_known_lng         = COALESCE(p_lng, last_known_lng),
    updated_at             = now()
  WHERE id = p_location_id
    AND vendor_id IN (SELECT id FROM public.vendors WHERE owner_user_id = auth.uid());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'location_not_found_or_unauthorized');
  END IF;

  RETURN jsonb_build_object('ok', true, 'status', p_status);
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 5. RPC: compute_vendor_trust_score
-- Recomputes trust score from factor inputs.
-- Called by admin or background cron.
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.compute_vendor_trust_score(p_vendor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v          public.vendors%ROWTYPE;
  v_resp     numeric;
  v_cancel   numeric;
  v_ins      numeric;
  v_corridor numeric;
  v_broker   numeric;
  v_score    numeric;
  v_tier     text;
BEGIN
  SELECT * INTO v FROM public.vendors WHERE id = p_vendor_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'vendor_not_found'); END IF;

  -- Response time score (0-1): 300s = 1.0, 3600s+ = 0.0
  v_resp := CASE
    WHEN v.response_time_avg_sec IS NULL THEN 0.5
    WHEN v.response_time_avg_sec <= 300  THEN 1.0
    ELSE GREATEST(0, 1.0 - (v.response_time_avg_sec - 300.0) / 3300.0)
  END;

  -- Cancellation penalty (0-1): 0 cancels = 0, 10+ = 1.0
  v_cancel := CASE
    WHEN v.cancellation_count = 0       THEN 0
    WHEN v.cancellation_count >= 10     THEN 1.0
    ELSE v.cancellation_count / 10.0
  END;

  -- Insurance freshness score: % of active non-expired certs
  SELECT CASE
    WHEN COUNT(*) = 0 THEN 0.5
    ELSE COUNT(*) FILTER (WHERE status = 'active' AND (expires_at IS NULL OR expires_at > CURRENT_DATE))::numeric / COUNT(*)
  END INTO v_ins
  FROM public.vendor_certifications WHERE vendor_id = p_vendor_id;

  -- Corridor experience: number of unique corridors (capped at 10 → 1.0)
  v_corridor := LEAST(1.0, COALESCE(jsonb_array_length(v.corridor_experience_json), 0) / 10.0);

  -- Broker rating: avg from vendor_reviews (0-1 scale, reviews are 1-5)
  SELECT COALESCE(AVG(rating) / 5.0, 0.5) INTO v_broker
  FROM public.vendor_reviews WHERE vendor_id = p_vendor_id;

  -- Composite formula (spec §7)
  v_score :=
    (COALESCE(v.on_time_rate, 1.0) * 0.25) +
    (COALESCE(v.completion_rate, 1.0) * 0.20) +
    (v_resp * 0.15) +
    (v_ins * 0.10) +
    (v_broker * 0.15) +
    (v_cancel * -0.10) +
    (v_corridor * 0.25);

  -- Clamp 0-1
  v_score := GREATEST(0, LEAST(1, v_score));

  -- Tier
  v_tier := CASE
    WHEN v_score >= 0.85 THEN 'elite'
    WHEN v_score >= 0.65 THEN 'preferred'
    WHEN v_score >= 0.35 THEN 'standard'
    ELSE 'probation'
  END;

  UPDATE public.vendors
  SET
    trust_score        = ROUND(v_score, 2),
    trust_tier         = v_tier,
    trust_factors_json = jsonb_build_object(
      'on_time_rate',         v.on_time_rate,
      'completion_rate',      v.completion_rate,
      'response_time_score',  ROUND(v_resp, 3),
      'insurance_freshness',  ROUND(v_ins, 3),
      'broker_rating',        ROUND(v_broker, 3),
      'cancellation_penalty', ROUND(v_cancel, 3),
      'corridor_experience',  ROUND(v_corridor, 3),
      'computed_at',          now()
    ),
    updated_at         = now()
  WHERE id = p_vendor_id;

  RETURN jsonb_build_object('ok', true, 'trust_score', ROUND(v_score, 2), 'tier', v_tier);
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 6. Auto-expire certifications (pg_cron, optional)
-- ─────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cert_auto_expire',
      '0 4 * * *',
      $$
        UPDATE public.vendor_certifications
        SET status = 'expired', updated_at = now()
        WHERE status = 'active'
          AND expires_at IS NOT NULL
          AND expires_at < CURRENT_DATE;
      $$
    );
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 7. Add owner_user_id to vendors (needed for RLS on certs)
-- ─────────────────────────────────────────────────────────
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id);
