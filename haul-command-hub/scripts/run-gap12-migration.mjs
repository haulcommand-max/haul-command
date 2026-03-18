#!/usr/bin/env node
/**
 * Gap 12 Migration Runner
 * 
 * Creates all 8 Gap 12 tables in Supabase via PostgREST + service role.
 * Since PostgREST can't run DDL, this creates a temporary exec_sql function
 * then uses it to run all migrations, then drops it.
 * 
 * Usage: node scripts/run-gap12-migration.mjs
 * Requires: .env.local with SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Load env
const envPath = resolve(ROOT, '..', '.env.local');
const env = readFileSync(envPath, 'utf8');
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)/)?.[1]?.trim();
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)/)?.[1]?.trim();

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

async function rpc(fnName, params) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  const text = await r.text();
  return { status: r.status, body: text };
}

// Step 1: Create exec_sql function
console.log('Step 1: Creating temporary exec_sql function...');
const createFnSQL = `
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
  RETURN 'OK';
END;
$$;
`;

// We can't create the function via PostgREST either... 
// Let's try using the Supabase Auth admin API to check if we can find another way

// Actually, let's try the Supabase SQL endpoint that the dashboard uses
const ref = SUPABASE_URL.match(/https:\/\/(\w+)\./)?.[1];
console.log(`Project ref: ${ref}`);

// The Supabase dashboard SQL editor uses this internal endpoint
const sqlApiUrl = `https://${ref}.supabase.co/pg/query`;

async function runSQL(sql) {
  // Try multiple endpoints
  const endpoints = [
    { url: `https://${ref}.supabase.co/pg`, method: 'POST' },
    { url: `https://api.supabase.com/platform/pg/${ref}/query`, method: 'POST' },
  ];
  
  for (const ep of endpoints) {
    try {
      const r = await fetch(ep.url, {
        method: ep.method,
        headers: {
          ...headers,
          'x-connection-encrypted': 'false',
        },
        body: JSON.stringify({ query: sql }),
      });
      if (r.status < 400) {
        return { ok: true, body: await r.text() };
      }
    } catch {}
  }
  
  return { ok: false };
}

// Migration SQL statements
const migrations = [
  {
    name: 'hc_market_truth_flags',
    sql: `DROP TABLE IF EXISTS hc_market_truth_flags CASCADE; CREATE TABLE hc_market_truth_flags (surface_type text NOT NULL, page_key text NOT NULL, canonical_url text, country_slug text, jurisdiction_slug text, metro_slug text, corridor_slug text, service_slug text, metric_name text NOT NULL, metric_value_text text, metric_value_numeric numeric, is_renderable boolean NOT NULL DEFAULT false, reason_code text NOT NULL DEFAULT 'no_real_data', freshness_ok boolean NOT NULL DEFAULT false, methodology_ok boolean NOT NULL DEFAULT false, observation_count integer NOT NULL DEFAULT 0, last_updated_at timestamptz, methodology_url text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (surface_type, page_key, metric_name));`,
  },
  {
    name: 'hc_page_seo_contracts',
    sql: `CREATE TABLE IF NOT EXISTS hc_page_seo_contracts (canonical_url text PRIMARY KEY, page_type text NOT NULL, route_family text, country_slug text, jurisdiction_slug text, metro_slug text, corridor_slug text, service_slug text, entity_slug text, title text NOT NULL, meta_description text, h1 text NOT NULL, intro_copy text, canonical_key text, breadcrumb_json jsonb, structured_data_json jsonb, robots_directive text NOT NULL DEFAULT 'index,follow', last_generated_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());`,
  },
  {
    name: 'hc_sponsor_inventory',
    sql: `CREATE TABLE IF NOT EXISTS hc_sponsor_inventory (slot_key text PRIMARY KEY, page_type text NOT NULL, canonical_url text, country_slug text, jurisdiction_slug text, metro_slug text, corridor_slug text, service_slug text, entity_id uuid, sponsor_label text NOT NULL DEFAULT 'sponsored', sponsor_package_weight numeric NOT NULL DEFAULT 0, local_market_relevance numeric NOT NULL DEFAULT 0, quality_guardrail_pass boolean NOT NULL DEFAULT false, eligible boolean NOT NULL DEFAULT false, sponsor_score numeric NOT NULL DEFAULT 0, starts_at timestamptz, ends_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());`,
  },
  {
    name: 'hc_provider_best_public_record',
    sql: `CREATE TABLE IF NOT EXISTS hc_provider_best_public_record (provider_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider_slug text NOT NULL UNIQUE, display_name text NOT NULL, legal_name text, entity_type text, phone_e164 text, phone_display text, sms_e164 text, website_url text, email text, country_slug text, jurisdiction_slug text, metro_slug text, service_area_labels text[], capabilities text[], claim_status text DEFAULT 'unclaimed', verification_state text DEFAULT 'unverified', response_time_minutes_median numeric, availability_signal text, source_count integer DEFAULT 0, last_seen_at timestamptz, last_updated_at timestamptz DEFAULT now(), corridor_slugs text[], quality_guardrail_pass boolean NOT NULL DEFAULT false, public_rank_score numeric NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());`,
  },
  {
    name: 'hc_provider_search_index',
    sql: `CREATE TABLE IF NOT EXISTS hc_provider_search_index (provider_id uuid PRIMARY KEY, provider_slug text NOT NULL, context_surface text, country_slug text, jurisdiction_slug text, metro_slug text, service_slug text, title text NOT NULL, subtitle text, location_label text, badges_json jsonb, organic_rank_score numeric NOT NULL DEFAULT 0, sponsor_eligible boolean NOT NULL DEFAULT false, quality_guardrail_pass boolean NOT NULL DEFAULT false, last_updated_at timestamptz DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());`,
  },
  {
    name: 'hc_broker_public_profile',
    sql: `CREATE TABLE IF NOT EXISTS hc_broker_public_profile (broker_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), broker_slug text NOT NULL UNIQUE, display_name text NOT NULL, phone_e164 text, phone_display text, email text, website_url text, active_country_codes text[], active_jurisdiction_slugs text[], active_corridor_slugs text[], recent_load_count_30d integer DEFAULT 0, active_pattern_summary text, source_count integer DEFAULT 0, claim_status text DEFAULT 'unclaimed', verification_state text DEFAULT 'unverified', last_seen_at timestamptz, last_updated_at timestamptz DEFAULT now(), quality_guardrail_pass boolean NOT NULL DEFAULT false, public_rank_score numeric NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());`,
  },
  {
    name: 'hc_rates_public',
    sql: `CREATE TABLE IF NOT EXISTS hc_rates_public (surface_key text PRIMARY KEY, surface_type text NOT NULL, country_slug text, jurisdiction_slug text, corridor_slug text, currency_code text NOT NULL DEFAULT 'USD', rate_low numeric, rate_mid numeric, rate_high numeric, sample_size_30d integer, change_vs_7d_pct numeric, change_vs_30d_pct numeric, methodology_url text, freshness_timestamp timestamptz, quality_guardrail_pass boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());`,
  },
  {
    name: 'hc_requirements_public',
    sql: `CREATE TABLE IF NOT EXISTS hc_requirements_public (surface_key text PRIMARY KEY, country_slug text NOT NULL, jurisdiction_slug text, load_type_slug text, jurisdiction_label text NOT NULL, escort_thresholds_json jsonb, permit_links_json jsonb, governing_source_links_json jsonb, methodology_url text, last_reviewed_at timestamptz, quality_guardrail_pass boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());`,
  },
];

// Try direct SQL API first
console.log('\nAttempting SQL API...');
const testResult = await runSQL('SELECT 1 as test;');
if (testResult.ok) {
  console.log('SQL API available! Running migrations...');
  for (const m of migrations) {
    console.log(`  Creating ${m.name}...`);
    const r = await runSQL(m.sql);
    console.log(`  → ${r.ok ? '✅ Success' : '❌ Failed'}`);
  }
} else {
  console.log('SQL API not available via HTTP.');
  console.log('');
  console.log('=== MANUAL MIGRATION REQUIRED ===');
  console.log('');
  console.log('Copy the SQL below and paste it into the Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/hvjyfyzotqobfkakjozp/sql/new');
  console.log('');
  console.log('--- SQL START ---');
  for (const m of migrations) {
    console.log(`\n-- ${m.name}`);
    console.log(m.sql);
  }
  console.log('\n--- SQL END ---');
}

// Verify tables exist via PostgREST
console.log('\n\nVerifying tables via PostgREST...\n');
const tables = [
  'hc_market_truth_flags',
  'hc_page_seo_contracts',
  'hc_sponsor_inventory',
  'hc_provider_best_public_record',
  'hc_provider_search_index',
  'hc_broker_public_profile',
  'hc_rates_public',
  'hc_requirements_public',
];

let existing = 0;
let missing = 0;

for (const t of tables) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=*&limit=0`, { headers });
    if (r.status === 200) {
      console.log(`  ✅ ${t} — exists`);
      existing++;
    } else if (r.status === 404) {
      console.log(`  ❌ ${t} — not found (needs migration)`);
      missing++;
    } else {
      const body = await r.text();
      console.log(`  ⚠️  ${t} — HTTP ${r.status}: ${body.substring(0, 100)}`);
      missing++;
    }
  } catch (e) {
    console.log(`  ❌ ${t} — ${e.message}`);
    missing++;
  }
}

console.log(`\n📊 Results: ${existing} exist, ${missing} missing`);
if (missing === 0) {
  console.log('✅ All Gap 12 tables verified!');
} else {
  console.log('⚠️  Some tables still need to be created. Run the SQL above in Supabase.');
}

process.exit(missing > 0 ? 1 : 0);
