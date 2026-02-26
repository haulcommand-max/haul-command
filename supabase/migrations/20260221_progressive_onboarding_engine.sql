-- ══════════════════════════════════════════════════════════════
-- Migration: progressive_onboarding_engine
-- Adds onboarding_state, profile_strength, visibility_tier,
-- onboarding_events, and verification_artifacts tables.
-- ══════════════════════════════════════════════════════════════

-- 1) Extend existing profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_state      jsonb    NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS profile_strength       int      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visibility_tier        text     NOT NULL DEFAULT 'hidden'
                              CHECK (visibility_tier IN ('hidden','limited','standard','featured')),
  ADD COLUMN IF NOT EXISTS soft_flags             jsonb    NOT NULL DEFAULT '{}'::jsonb,
  -- soft_flags shape: {phone_verified, insurance_uploaded, cert_uploaded, vehicle_added}
  ADD COLUMN IF NOT EXISTS joined_at              timestamptz NOT NULL DEFAULT now();

-- 2) onboarding_events — immutable audit log
CREATE TABLE IF NOT EXISTS public.onboarding_events (
  id          uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid              NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event       text              NOT NULL,        -- e.g. "step_completed", "strength_updated"
  meta        jsonb             NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS onboarding_events_user_idx ON public.onboarding_events (user_id, created_at DESC);

-- 3) verification_artifacts — document uploads for admin review
CREATE TABLE IF NOT EXISTS public.verification_artifacts (
  id          uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid              NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text              NOT NULL CHECK (type IN ('insurance','cert','id','vehicle_photo')),
  status      text              NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','approved','rejected')),
  file_url    text              NOT NULL,
  reviewer_id uuid,
  review_note text,
  meta        jsonb             NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz       NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS verification_artifacts_user_idx ON public.verification_artifacts (user_id, type);
CREATE INDEX IF NOT EXISTS verification_artifacts_status_idx ON public.verification_artifacts (status) WHERE status = 'pending';

-- 4) RLS Policies

-- Profiles: user reads/writes own; public can read non-hidden profiles (limited set of fields)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_own_profile" ON public.profiles;
CREATE POLICY "user_own_profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "public_visible_profiles" ON public.profiles;
CREATE POLICY "public_visible_profiles" ON public.profiles
  FOR SELECT USING (visibility_tier IN ('limited','standard','featured'));

-- onboarding_events: user reads/writes own only
ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_own_events" ON public.onboarding_events;
CREATE POLICY "user_own_events" ON public.onboarding_events
  FOR ALL USING (auth.uid() = user_id);

-- verification_artifacts: user reads/writes own; admin reads all
ALTER TABLE public.verification_artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_own_artifacts" ON public.verification_artifacts;
CREATE POLICY "user_own_artifacts" ON public.verification_artifacts
  FOR ALL USING (auth.uid() = user_id);

-- 5) compute_profile_strength — deterministic function
-- Called after each step to recompute and update tier.
CREATE OR REPLACE FUNCTION public.compute_profile_strength(p_user_id uuid)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  p          public.profiles%ROWTYPE;
  strength   int := 0;
  tier       text;
  flags      jsonb;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Identity (35 pts)
  IF p.full_name IS NOT NULL AND p.full_name <> ''    THEN strength := strength + 5;  END IF;
  IF p.avatar_url IS NOT NULL AND p.avatar_url <> ''  THEN strength := strength + 5;  END IF;
  IF (p.soft_flags->>'phone_verified')::bool = true   THEN strength := strength + 15; END IF;
  IF p.home_base_state IS NOT NULL                    THEN strength := strength + 10; END IF;

  -- Capability (25 pts)
  IF p.vehicle_type IS NOT NULL AND p.vehicle_type <> '' THEN strength := strength + 10; END IF;
  IF p.equipment_flags IS NOT NULL AND p.equipment_flags <> '{}'::jsonb THEN strength := strength + 5; END IF;
  IF p.coverage_radius_miles IS NOT NULL AND p.coverage_radius_miles > 0 THEN strength := strength + 10; END IF;

  -- Trust (30 pts)
  IF (p.soft_flags->>'insurance_uploaded')::bool = true THEN strength := strength + 15; END IF;
  IF (p.soft_flags->>'cert_uploaded')::bool = true       THEN strength := strength + 15; END IF;

  -- Activity (10 pts)
  IF EXISTS (
    SELECT 1 FROM public.onboarding_events
    WHERE user_id = p_user_id AND event = 'activation_mission_completed'
  ) THEN strength := strength + 10; END IF;

  -- Clamp 0-100
  strength := LEAST(strength, 100);

  -- Derive tier
  tier := CASE
    WHEN strength >= 80 THEN 'featured'
    WHEN strength >= 50 THEN 'standard'
    WHEN strength >= 25 THEN 'limited'
    ELSE 'hidden'
  END;

  -- Persist
  UPDATE public.profiles SET
    profile_strength = strength,
    visibility_tier  = tier
  WHERE id = p_user_id;

  -- Emit event
  INSERT INTO public.onboarding_events (user_id, event, meta)
  VALUES (p_user_id, 'strength_updated', jsonb_build_object('strength', strength, 'tier', tier));

  RETURN strength;
END;
$$;

-- 6) onboarding_next_step helper
CREATE OR REPLACE FUNCTION public.onboarding_next_step(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  p    public.profiles%ROWTYPE;
  step jsonb;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN '{"step":"role_select","reason":"Account setup needed","seconds":30}'::jsonb; END IF;

  IF p.full_name IS NULL OR p.full_name = '' THEN
    RETURN '{"step":"quick_profile","reason":"Add your name to appear in the directory","seconds":60}'::jsonb;
  END IF;
  IF (p.soft_flags->>'phone_verified')::bool IS NOT TRUE THEN
    RETURN '{"step":"phone_verify","reason":"Phone verification adds 15 trust points","seconds":60}'::jsonb;
  END IF;
  IF p.vehicle_type IS NULL OR p.vehicle_type = '' THEN
    RETURN '{"step":"vehicle_add","reason":"Vehicle type determines which loads you see","seconds":45}'::jsonb;
  END IF;
  IF p.coverage_radius_miles IS NULL OR p.coverage_radius_miles = 0 THEN
    RETURN '{"step":"coverage_setup","reason":"Set your corridor to appear in broker searches","seconds":45}'::jsonb;
  END IF;
  IF (p.soft_flags->>'insurance_uploaded')::bool IS NOT TRUE THEN
    RETURN '{"step":"verification_upload","reason":"Insurance upload unlocks Standard visibility tier","seconds":120}'::jsonb;
  END IF;

  RETURN '{"step":"done","reason":"Profile complete","seconds":0}'::jsonb;
END;
$$;
