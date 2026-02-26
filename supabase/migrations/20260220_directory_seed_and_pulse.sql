-- Directory Seed & Activation Funnel (Email-First Acceleration)
-- Migration: 20260220_directory_seed_and_pulse.sql

-- 1. Extend driver_profiles and auth for seeding
ALTER TABLE public.driver_profiles
    ADD COLUMN IF NOT EXISTS is_seeded boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS claim_hash text UNIQUE,
    ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

-- Ensure seeded profiles have the 'unverified' claim status natively mapped
CREATE INDEX IF NOT EXISTS idx_driver_profiles_seeded ON public.driver_profiles(is_seeded);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_claim_hash ON public.driver_profiles(claim_hash);

-- Allow anonymous access to read minimal profile data by claim_hash
-- The endpoint will look this up to pre-fill the claim page securely
CREATE POLICY "Anon can view seeded profile by hash" ON public.driver_profiles
    FOR SELECT USING (is_seeded = true AND claim_hash IS NOT NULL);

-- 2. Morning Pulse Engine Cron
-- Runs every day at 11:00 UTC (6:00 AM EST)
SELECT cron.schedule(
  'morning-pulse-dispatch',
  '0 11 * * *',
  $$
  SELECT net.http_post(
      url:='https://your-project-ref.supabase.co/functions/v1/morning-pulse-dispatch',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body:='{}'::jsonb
  );
  $$
);
