-- Migration 021: Claim flow fields on hc_trust_profiles
-- Adds claim_pending, claim_submitted_at, claim_company_name, claim_phone, claim_user_id
-- Required by: app/api/claim/submit/route.ts
-- Safe: additive only, IF NOT EXISTS guards throughout

-- Add claim_pending flag (true while under review, flipped to false when approved/rejected)
ALTER TABLE public.hc_trust_profiles
  ADD COLUMN IF NOT EXISTS claim_pending        boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS claim_submitted_at   timestamptz,
  ADD COLUMN IF NOT EXISTS claim_company_name   text,
  ADD COLUMN IF NOT EXISTS claim_phone          text,
  ADD COLUMN IF NOT EXISTS claim_user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for admin review queue: show all pending claims newest-first
CREATE INDEX IF NOT EXISTS idx_hc_trust_profiles_claim_pending
  ON public.hc_trust_profiles (claim_pending, claim_submitted_at DESC)
  WHERE claim_pending = true;

-- Index for looking up by the claimer's user ID (claim status page, push reminders)
CREATE INDEX IF NOT EXISTS idx_hc_trust_profiles_claim_user_id
  ON public.hc_trust_profiles (claim_user_id)
  WHERE claim_user_id IS NOT NULL;

-- RLS: operators can read their own trust profile row via claim_user_id
-- (service-role already bypasses RLS; this covers authenticated operator reads)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hc_trust_profiles'
      AND policyname = 'trust_profiles_claimer_select'
  ) THEN
    CREATE POLICY trust_profiles_claimer_select
      ON public.hc_trust_profiles
      FOR SELECT
      TO authenticated
      USING (claim_user_id = auth.uid());
  END IF;
END;
$$;

-- View: admin claim queue (service-role only)
CREATE OR REPLACE VIEW public.v_claim_review_queue AS
SELECT
  tp.id,
  tp.entity_id,
  tp.entity_type,
  tp.claimed,
  tp.claim_pending,
  tp.claim_submitted_at,
  tp.claim_company_name,
  tp.claim_phone,
  tp.claim_user_id,
  au.email   AS claimer_email
FROM public.hc_trust_profiles tp
LEFT JOIN auth.users au ON au.id = tp.claim_user_id
WHERE tp.claim_pending = true
ORDER BY tp.claim_submitted_at DESC;

COMMENT ON VIEW public.v_claim_review_queue IS
  'Admin review queue for pending operator profile claims. Service-role only.';
