-- Pack 2: Driver Onboarding fields
-- Additive only — runs safely on top of hc_core migration

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_step int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS home_base_city text,
  ADD COLUMN IF NOT EXISTS home_base_state text,
  ADD COLUMN IF NOT EXISTS radius_miles int DEFAULT 150;

CREATE INDEX IF NOT EXISTS profiles_onboarding_idx ON public.profiles(onboarding_step)
  WHERE onboarding_completed_at IS NULL;
