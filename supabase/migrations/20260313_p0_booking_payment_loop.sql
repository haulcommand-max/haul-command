-- ═══════════════════════════════════════════════════════════════
-- P0: BOOKING / PAYMENT LOOP — SCHEMA CHANGES
-- Adds payment tracking to jobs, creates job_payouts table
-- ═══════════════════════════════════════════════════════════════

-- 1. Add payment/tracking columns to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stripe_charge_id text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending'
  CHECK (payment_status IN ('pending','authorized','captured','failed','refunded','cancelled'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payout_status text NOT NULL DEFAULT 'pending'
  CHECK (payout_status IN ('pending','payout_ready','initiated','completed','failed'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS traccar_session_ids jsonb DEFAULT '[]'::jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS review_requested_at timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS platform_fee_cents integer DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS net_payout_cents integer DEFAULT 0;

-- 2. Create job_payouts table
CREATE TABLE IF NOT EXISTS job_payouts (
  payout_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL REFERENCES jobs(job_id),
  operator_id uuid NOT NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  platform_fee_cents integer NOT NULL DEFAULT 0,
  stripe_transfer_id text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','payout_ready','initiated','completed','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_job_payouts_job ON job_payouts(job_id);
CREATE INDEX IF NOT EXISTS idx_job_payouts_operator ON job_payouts(operator_id);
CREATE INDEX IF NOT EXISTS idx_job_payouts_status ON job_payouts(status);

-- 3. Index for payment lookups
CREATE INDEX IF NOT EXISTS idx_jobs_payment_intent ON jobs(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_payment_status ON jobs(payment_status);

-- 4. Create job_reviews table for review request tracking
CREATE TABLE IF NOT EXISTS job_reviews (
  review_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL REFERENCES jobs(job_id),
  reviewer_id uuid NOT NULL,
  reviewer_role text NOT NULL CHECK (reviewer_role IN ('broker','operator')),
  reviewee_id uuid NOT NULL,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  comment text,
  request_sent_at timestamptz,
  submitted_at timestamptz,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','submitted','expired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_reviews_job ON job_reviews(job_id);
CREATE INDEX IF NOT EXISTS idx_job_reviews_reviewee ON job_reviews(reviewee_id);
