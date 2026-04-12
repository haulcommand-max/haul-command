-- WAVE-1 S1-01, S1-02, S1-05: KYC Tier Alignment + Load Visibility Hard-Stop
-- Gemini RLS Audit (GEM-R03) flagged two critical vulnerabilities corrected here.

-- 1. Align kyc_level → kyc_tier column naming per Opus spec
--    (ADD the new tier column, preserve old kyc_level for backward compat)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_tier integer DEFAULT 0;

-- Backfill: map existing kyc_level to new tier integers
UPDATE profiles SET kyc_tier = CASE
  WHEN kyc_level IS NULL OR kyc_level = 0 THEN 0
  WHEN kyc_level = 1 THEN 1
  WHEN kyc_level = 2 THEN 2
  WHEN kyc_level >= 3 THEN 3
  ELSE 0
END
WHERE kyc_tier = 0;

-- 2. FIX: hc_escrows RLS — restrict SELECT to parties only (GEM-R03 critical vulnerability)
DROP POLICY IF EXISTS "escrow_select" ON hc_escrows;
CREATE POLICY "escrow_select" ON hc_escrows
  FOR SELECT TO authenticated
  USING (
    auth.uid() = broker_id
    OR auth.uid() = operator_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. FIX: jobs INSERT — enforce kyc_tier >= 2 for brokers posting loads (GEM-R03 high vulnerability)
DROP POLICY IF EXISTS "jobs_broker_insert" ON jobs;
CREATE POLICY "jobs_broker_insert" ON jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = posted_by
    AND (
      SELECT kyc_tier FROM profiles WHERE id = auth.uid()
    ) >= 2
  );

-- 4. Hard-stop: jobs.status 'DRAFT' never visible on load board without escrow lock
--    Enforce via RLS: only OPEN status loads are publicly selectable
DROP POLICY IF EXISTS "jobs_public_select" ON jobs;
CREATE POLICY "jobs_public_select" ON jobs
  FOR SELECT
  USING (
    status = 'OPEN'
    OR auth.uid() = posted_by
    OR auth.uid() = assigned_to
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Add idempotency_key tracking column to hc_escrows if missing
ALTER TABLE hc_escrows ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE hc_escrows ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
CREATE UNIQUE INDEX IF NOT EXISTS hc_escrows_idempotency_key_uidx ON hc_escrows(idempotency_key) WHERE idempotency_key IS NOT NULL;
