// Run P0 migration using Supabase Management API
// Uses the service role key to call the Management API directly

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'hvjyfyzotqobfkakjozp';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// The Supabase Management API endpoint for running SQL
// This is what the Supabase MCP server and Dashboard use internally
const MGMT_API = `https://api.supabase.com`;

const MIGRATION_SQL = `
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stripe_charge_id text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payout_status text NOT NULL DEFAULT 'pending';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS traccar_session_ids jsonb DEFAULT '[]'::jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS review_requested_at timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS platform_fee_cents integer DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS net_payout_cents integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS job_payouts (
  payout_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL,
  operator_id uuid NOT NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  platform_fee_cents integer NOT NULL DEFAULT 0,
  stripe_transfer_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS job_reviews (
  review_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL,
  reviewer_id uuid NOT NULL,
  reviewer_role text NOT NULL,
  reviewee_id uuid NOT NULL,
  rating integer,
  comment text,
  request_sent_at timestamptz,
  submitted_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_payouts_job ON job_payouts(job_id);
CREATE INDEX IF NOT EXISTS idx_job_payouts_operator ON job_payouts(operator_id);
CREATE INDEX IF NOT EXISTS idx_job_payouts_status ON job_payouts(status);
CREATE INDEX IF NOT EXISTS idx_jobs_payment_intent ON jobs(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_payment_status ON jobs(payment_status);
CREATE INDEX IF NOT EXISTS idx_job_reviews_job ON job_reviews(job_id);
CREATE INDEX IF NOT EXISTS idx_job_reviews_reviewee ON job_reviews(reviewee_id);

ALTER TABLE job_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_reviews ENABLE ROW LEVEL SECURITY;
`;

async function tryEndpoint(name, url, method, headers, body) {
  try {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    console.log(`${name}: ${res.status} ${text.substring(0, 200)}`);
    return { status: res.status, text };
  } catch (e) {
    console.log(`${name}: ERROR ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('=== Trying all known Supabase SQL execution endpoints ===\n');

  // Method 1: Management API /v1/projects/{ref}/database/query
  await tryEndpoint('Mgmt API /database/query',
    `${MGMT_API}/v1/projects/${PROJECT_REF}/database/query`,
    'POST',
    { 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    { query: MIGRATION_SQL }
  );

  // Method 2: Direct SQL via PostgREST supautils
  await tryEndpoint('PostgREST /rpc/exec_sql',
    `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql`,
    'POST',
    { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    { sql_string: MIGRATION_SQL }
  );

  // Method 3: Supabase SQL API (newer)
  await tryEndpoint('SQL API /sql', 
    `https://${PROJECT_REF}.supabase.co/sql`,
    'POST',
    { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    { query: MIGRATION_SQL }
  );

  // Method 4: pg-meta
  await tryEndpoint('pg-meta /query',
    `https://${PROJECT_REF}.supabase.co/pg-meta/default/query`,
    'POST',
    { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    { query: MIGRATION_SQL }
  );

  // Verify
  console.log('\n=== Verification ===');
  for (const table of ['job_payouts', 'job_reviews']) {
    const res = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/${table}?select=*&limit=0`, {
      headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
    });
    console.log(`${table}: ${res.status === 200 ? '✅ EXISTS' : '❌ MISSING ('+res.status+')'}`);
  }
  const colCheck = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/jobs?select=payment_status&limit=0`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
  });
  console.log(`jobs.payment_status: ${colCheck.status === 200 ? '✅ EXISTS' : '❌ MISSING'}`);
}

main();
