// Run P0 migration against Supabase via direct pg connection
// Usage: node scripts/run-p0-migration.mjs

import pg from 'pg';
const { Client } = pg;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hvjyfyzotqobfkakjozp.supabase.co';
const PROJECT_REF = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

// Supabase direct Postgres connection
const DATABASE_URL = process.env.DATABASE_URL || 
  `postgresql://postgres.${PROJECT_REF}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

const MIGRATION_SQL = `
-- ═══════════════════════════════════════════════════════════════
-- P0: BOOKING / PAYMENT LOOP — SCHEMA CHANGES
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

-- 5. Enable RLS on new tables
ALTER TABLE job_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_payouts
CREATE POLICY IF NOT EXISTS "Service role full access on job_payouts" ON job_payouts
  FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for job_reviews  
CREATE POLICY IF NOT EXISTS "Service role full access on job_reviews" ON job_reviews
  FOR ALL USING (true) WITH CHECK (true);
`;

async function run() {
  console.log('🔧 Running P0 Booking/Payment migration...');
  console.log(`   Project: ${PROJECT_REF}`);
  
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Connected to Postgres');
    
    await client.query(MIGRATION_SQL);
    console.log('✅ Migration applied successfully');
    
    // Verify
    const jobs = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'jobs' AND column_name IN ('stripe_payment_intent_id','payment_status','payout_status')
    `);
    console.log(`✅ Jobs columns added: ${jobs.rows.map(r => r.column_name).join(', ')}`);
    
    const payouts = await client.query(`
      SELECT count(*) FROM information_schema.tables WHERE table_name = 'job_payouts'
    `);
    console.log(`✅ job_payouts table: ${payouts.rows[0].count > 0 ? 'EXISTS' : 'MISSING'}`);
    
    const reviews = await client.query(`
      SELECT count(*) FROM information_schema.tables WHERE table_name = 'job_reviews'
    `);
    console.log(`✅ job_reviews table: ${reviews.rows[0].count > 0 ? 'EXISTS' : 'MISSING'}`);
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
