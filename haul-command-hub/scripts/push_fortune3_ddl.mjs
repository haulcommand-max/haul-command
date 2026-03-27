#!/usr/bin/env node
/**
 * Fortune-3 DDL Migration Runner
 * 
 * Executes CREATE TABLE statements via Supabase Management API.
 * Falls back to providing copy-paste instructions.
 * 
 * Usage: node scripts/push_fortune3_ddl.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Load env
function getEnv() {
  for (const f of ['.env', '.env.local']) {
    try {
      const raw = readFileSync(resolve(ROOT, f), 'utf8');
      const url = raw.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)/)?.[1]?.trim();
      const key = raw.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)/)?.[1]?.trim();
      if (url && key) return { url, key };
    } catch {}
  }
  return { url: null, key: null };
}

const { url: SUPABASE_URL, key: SERVICE_KEY } = getEnv();
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars'); process.exit(1);
}

const ref = SUPABASE_URL.match(/https:\/\/(\w+)\./)?.[1];
const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

// Individual DDL statements — one per table
const DDL_STEPS = [
  {
    name: 'country_market',
    sql: `CREATE TABLE IF NOT EXISTS country_market (
      country_code TEXT PRIMARY KEY,
      country_name TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'E' CHECK (tier IN ('A','B','C','D','E')),
      status TEXT NOT NULL DEFAULT 'seed_only' CHECK (status IN ('seed_only','activation_ready','expansion_now','dominate_now','monetize_now')),
      country_domination_score INTEGER NOT NULL DEFAULT 0,
      next_recommended_action TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`
  },
  {
    name: 'country_market_score_snapshot',
    sql: `CREATE TABLE IF NOT EXISTS country_market_score_snapshot (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      country_code TEXT NOT NULL REFERENCES country_market(country_code),
      snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
      alive_profile_score INTEGER NOT NULL DEFAULT 0,
      seo_indexation_visibility_score INTEGER NOT NULL DEFAULT 0,
      claim_conversion_score INTEGER NOT NULL DEFAULT 0,
      listing_density_score INTEGER NOT NULL DEFAULT 0,
      supply_liquidity_score INTEGER NOT NULL DEFAULT 0,
      monetization_readiness_score INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`
  },
  {
    name: 'country_expansion_decision_log',
    sql: `CREATE TABLE IF NOT EXISTS country_expansion_decision_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      country_code TEXT NOT NULL REFERENCES country_market(country_code),
      decision_type TEXT NOT NULL,
      trigger_reason TEXT,
      result_json JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`
  },
  {
    name: 'country_regulatory_source',
    sql: `CREATE TABLE IF NOT EXISTS country_regulatory_source (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      country_code TEXT NOT NULL REFERENCES country_market(country_code),
      source_name TEXT NOT NULL,
      source_url TEXT,
      source_type TEXT NOT NULL DEFAULT 'government_registry',
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`
  },
  {
    name: 'country_language_pack',
    sql: `CREATE TABLE IF NOT EXISTS country_language_pack (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      country_code TEXT NOT NULL REFERENCES country_market(country_code),
      primary_language TEXT NOT NULL DEFAULT 'en',
      industry_slang JSONB,
      search_phrasing JSONB,
      social_platforms JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (country_code, primary_language)
    );`
  },
  {
    name: 'canonical_role',
    sql: `CREATE TABLE IF NOT EXISTS canonical_role (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      role_slug TEXT NOT NULL UNIQUE,
      role_name TEXT NOT NULL,
      role_layer TEXT NOT NULL DEFAULT 'core_operator_layer',
      is_monetizable BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`
  },
  {
    name: 'country_role_alias',
    sql: `CREATE TABLE IF NOT EXISTS country_role_alias (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      country_code TEXT NOT NULL,
      canonical_role_id UUID NOT NULL REFERENCES canonical_role(id),
      alias_term TEXT NOT NULL,
      confidence_score INTEGER NOT NULL DEFAULT 80,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`
  },
  {
    name: 'profile_claim_funnel_snapshot',
    sql: `CREATE TABLE IF NOT EXISTS profile_claim_funnel_snapshot (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      country_code TEXT NOT NULL,
      canonical_role_id UUID REFERENCES canonical_role(id),
      snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
      total_profiles INTEGER NOT NULL DEFAULT 0,
      total_claimed INTEGER NOT NULL DEFAULT 0,
      total_verified INTEGER NOT NULL DEFAULT 0,
      claim_conversion_rate NUMERIC(5,2),
      avg_trust_score NUMERIC(5,2),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`
  },
  {
    name: 'glossary_control_term',
    sql: `CREATE TABLE IF NOT EXISTS glossary_control_term (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      term_slug TEXT NOT NULL UNIQUE,
      term_name TEXT NOT NULL,
      term_type TEXT NOT NULL DEFAULT 'general',
      classification TEXT NOT NULL DEFAULT 'pending_review' CHECK (classification IN ('confirmed_safe','pending_review','flagged','blocked')),
      definition TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`
  },
  {
    name: 'glossary_country_variant',
    sql: `CREATE TABLE IF NOT EXISTS glossary_country_variant (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      term_id UUID NOT NULL REFERENCES glossary_control_term(id),
      country_code TEXT NOT NULL,
      local_alias TEXT NOT NULL,
      seo_search_volume INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`
  },
  {
    name: 'voice_query_template',
    sql: `CREATE TABLE IF NOT EXISTS voice_query_template (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      country_code TEXT NOT NULL,
      language_code TEXT NOT NULL DEFAULT 'en-US',
      query_pattern TEXT NOT NULL,
      mapped_term_id UUID REFERENCES glossary_control_term(id),
      mapped_profile_type TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`
  },
  {
    name: 'term_risk_review_queue',
    sql: `CREATE TABLE IF NOT EXISTS term_risk_review_queue (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      term_id UUID NOT NULL REFERENCES glossary_control_term(id),
      reason TEXT NOT NULL,
      reviewer_notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`
  },
  {
    name: 'adgrid_monetization_path',
    sql: `CREATE TABLE IF NOT EXISTS adgrid_monetization_path (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      path_name TEXT NOT NULL,
      surface_type TEXT NOT NULL,
      revenue_model TEXT NOT NULL DEFAULT 'cpc',
      country_code TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`
  },
  {
    name: 'post_claim_offer_matrix',
    sql: `CREATE TABLE IF NOT EXISTS post_claim_offer_matrix (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      offer_slug TEXT NOT NULL UNIQUE,
      offer_name TEXT NOT NULL,
      offer_type TEXT NOT NULL,
      target_alive_status TEXT NOT NULL DEFAULT 'claimed',
      priority_order INTEGER NOT NULL DEFAULT 100,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`
  },
  {
    name: 'directory_listings Fortune-3 columns',
    sql: `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_listings' AND column_name = 'hc_id') THEN
        ALTER TABLE directory_listings ADD COLUMN hc_id TEXT UNIQUE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_listings' AND column_name = 'trust_score_id') THEN
        ALTER TABLE directory_listings ADD COLUMN trust_score_id UUID REFERENCES identity_scores(id);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_listings' AND column_name = 'alive_status') THEN
        ALTER TABLE directory_listings ADD COLUMN alive_status TEXT DEFAULT 'scraped' CHECK (alive_status IN ('scraped','claimed','verified','alive','deactivated'));
      END IF;
    END $$;`
  },
];

// RLS + Indexes
const RLS_STEPS = [
  `ALTER TABLE country_market ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "country_market: public read active" ON country_market;
   CREATE POLICY "country_market: public read active" ON country_market FOR SELECT USING (status IN ('activation_ready','expansion_now','dominate_now','monetize_now'));`,
  
  `ALTER TABLE canonical_role ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "canonical_role: public read" ON canonical_role;
   CREATE POLICY "canonical_role: public read" ON canonical_role FOR SELECT USING (true);`,
  
  `ALTER TABLE glossary_control_term ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "glossary_control_term: public read safe" ON glossary_control_term;
   CREATE POLICY "glossary_control_term: public read safe" ON glossary_control_term FOR SELECT USING (classification = 'confirmed_safe');`,
  
  `ALTER TABLE voice_query_template ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "voice_query_template: public read active" ON voice_query_template;
   CREATE POLICY "voice_query_template: public read active" ON voice_query_template FOR SELECT USING (status = 'active');`,
  
  `ALTER TABLE country_market_score_snapshot ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "country_market_score_snapshot: public read" ON country_market_score_snapshot;
   CREATE POLICY "country_market_score_snapshot: public read" ON country_market_score_snapshot FOR SELECT USING (true);`,
  
  `ALTER TABLE glossary_country_variant ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "glossary_country_variant: public read" ON glossary_country_variant;
   CREATE POLICY "glossary_country_variant: public read" ON glossary_country_variant FOR SELECT USING (true);`,
  
  `ALTER TABLE adgrid_monetization_path ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "adgrid_monetization_path: public read active" ON adgrid_monetization_path;
   CREATE POLICY "adgrid_monetization_path: public read active" ON adgrid_monetization_path FOR SELECT USING (is_active = true);`,
  
  `ALTER TABLE post_claim_offer_matrix ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "post_claim_offer_matrix: public read active" ON post_claim_offer_matrix;
   CREATE POLICY "post_claim_offer_matrix: public read active" ON post_claim_offer_matrix FOR SELECT USING (is_active = true);`,
  
  `ALTER TABLE country_expansion_decision_log ENABLE ROW LEVEL SECURITY;
   ALTER TABLE country_regulatory_source ENABLE ROW LEVEL SECURITY;
   ALTER TABLE country_language_pack ENABLE ROW LEVEL SECURITY;
   ALTER TABLE country_role_alias ENABLE ROW LEVEL SECURITY;
   ALTER TABLE profile_claim_funnel_snapshot ENABLE ROW LEVEL SECURITY;
   ALTER TABLE term_risk_review_queue ENABLE ROW LEVEL SECURITY;`,
  
  `CREATE INDEX IF NOT EXISTS idx_country_market_tier ON country_market(tier);
   CREATE INDEX IF NOT EXISTS idx_country_market_score ON country_market(country_domination_score DESC);
   CREATE INDEX IF NOT EXISTS idx_glossary_term_slug ON glossary_control_term(term_slug);
   CREATE INDEX IF NOT EXISTS idx_voice_query_country ON voice_query_template(country_code, status);
   CREATE INDEX IF NOT EXISTS idx_country_snapshot_date ON country_market_score_snapshot(country_code, snapshot_date DESC);`,
];

// Try to run SQL via the Management API
async function runSQL(sql) {
  // Method 1: Try pg REST query endpoint
  try {
    const r = await fetch(`https://${ref}.supabase.co/pg/query`, {
      method: 'POST',
      headers: { ...headers, 'x-connection-encrypted': 'false' },
      body: JSON.stringify({ query: sql }),
    });
    if (r.status < 400) return { ok: true, body: await r.text() };
  } catch {}

  // Method 2: Try the RPC exec_sql if it exists
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sql_query: sql }),
    });
    if (r.status < 400) return { ok: true, body: await r.text() };
  } catch {}

  return { ok: false };
}

async function main() {
  console.log(`\n🚀 Fortune-3 DDL Migration Runner`);
  console.log(`   Project: ${ref}\n`);

  // First, check if SQL API is accessible
  const test = await runSQL('SELECT 1 as test;');
  
  if (test.ok) {
    console.log('✅ SQL API accessible. Running DDL statements...\n');
    
    let success = 0;
    let failed = 0;

    // Create tables
    for (const step of DDL_STEPS) {
      process.stdout.write(`   ${step.name}... `);
      const r = await runSQL(step.sql);
      if (r.ok) {
        console.log('✅');
        success++;
      } else {
        console.log('❌');
        failed++;
      }
    }

    // RLS + Indexes
    for (let i = 0; i < RLS_STEPS.length; i++) {
      process.stdout.write(`   RLS/Index batch ${i + 1}... `);
      const r = await runSQL(RLS_STEPS[i]);
      console.log(r.ok ? '✅' : '❌');
    }

    console.log(`\n📊 ${success}/${DDL_STEPS.length} tables created`);
    if (failed > 0) {
      console.log(`⚠️ ${failed} failed. Check Supabase dashboard.`);
    }
  } else {
    // SQL API not available — output for manual execution
    console.log('⚠️  SQL API not accessible via HTTP.');
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  MANUAL MIGRATION REQUIRED                       ║');
    console.log('║                                                  ║');
    console.log('║  Your Supabase project is under resource pressure║');
    console.log('║  Run these statements ONE AT A TIME in the       ║');
    console.log('║  Supabase SQL Editor:                            ║');
    console.log(`║  https://supabase.com/dashboard/project/${ref}/sql/new`);
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
    
    console.log('=== COPY EACH BLOCK SEPARATELY ===\n');
    
    for (let i = 0; i < DDL_STEPS.length; i++) {
      console.log(`-- [${i + 1}/${DDL_STEPS.length}] ${DDL_STEPS[i].name}`);
      console.log(DDL_STEPS[i].sql);
      console.log('');
    }

    console.log('\n-- [RLS & INDEXES] Run after all tables created:\n');
    for (const rls of RLS_STEPS) {
      console.log(rls);
      console.log('');
    }
  }

  // Verify what exists now
  console.log('\n═══ VERIFICATION ═══\n');
  const tables = DDL_STEPS.filter(s => !s.name.includes('columns')).map(s => s.name);
  let exists = 0;
  for (const t of tables) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=*&limit=0`, { headers });
      const status = r.status === 200 ? '✅' : '❌';
      console.log(`   ${status} ${t}`);
      if (r.status === 200) exists++;
    } catch {
      console.log(`   ❌ ${t}`);
    }
  }
  console.log(`\n📊 ${exists}/${tables.length} tables verified\n`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
