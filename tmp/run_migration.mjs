// tmp/run_migration.mjs
// One-shot Node.js script — runs country_readiness_engine migration via pg direct connection
// Uses: node_modules/pg (already installed in project)

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const DB_URL = 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

const STATEMENTS = [
  // ── 1. hc_country_readiness ──────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS hc_country_readiness (
    country_code TEXT PRIMARY KEY,
    country_name TEXT NOT NULL,
    market_state TEXT NOT NULL DEFAULT 'dormant'
      CHECK (market_state IN ('dormant', 'prepared', 'seed', 'live')),
    previous_state TEXT,
    state_changed_at TIMESTAMPTZ DEFAULT now(),
    supply_depth_score NUMERIC(5,4) DEFAULT 0,
    demand_pull_score NUMERIC(5,4) DEFAULT 0,
    claimable_surface_density_score NUMERIC(5,4) DEFAULT 0,
    law_readiness_score NUMERIC(5,4) DEFAULT 0,
    trust_signal_density_score NUMERIC(5,4) DEFAULT 0,
    monetization_readiness_score NUMERIC(5,4) DEFAULT 0,
    cross_border_leverage_score NUMERIC(5,4) DEFAULT 0,
    localization_strength_score NUMERIC(5,4) DEFAULT 0,
    law_pack_gate BOOLEAN DEFAULT false,
    supply_gate BOOLEAN DEFAULT false,
    demand_gate BOOLEAN DEFAULT false,
    localization_gate BOOLEAN DEFAULT false,
    support_gate BOOLEAN DEFAULT false,
    payments_gate BOOLEAN DEFAULT false,
    trust_gate BOOLEAN DEFAULT false,
    currency_code TEXT DEFAULT 'USD',
    language_primary TEXT DEFAULT 'en',
    measurement_system TEXT DEFAULT 'imperial'
      CHECK (measurement_system IN ('imperial','metric')),
    legal_source_pack JSONB DEFAULT '{}',
    first_metros JSONB DEFAULT '[]',
    first_corridors JSONB DEFAULT '[]',
    cross_border_adjacency JSONB DEFAULT '[]',
    autonomous_freight_score NUMERIC(3,2) DEFAULT 0,
    av_regulatory_maturity TEXT DEFAULT 'none'
      CHECK (av_regulatory_maturity IN ('none','exploring','framework','active','commercial')),
    last_scored_at TIMESTAMPTZ,
    last_promotion_reason TEXT,
    last_demotion_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_country_readiness_state
    ON hc_country_readiness (market_state)`,

  // ── 2. hc_country_state_log ──────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS hc_country_state_log (
    id BIGSERIAL PRIMARY KEY,
    country_code TEXT NOT NULL,
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    reason TEXT,
    score_snapshot JSONB,
    triggered_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT now()
  )`,

  // ── 3. hc_claim_pressure_state ───────────────────────────────────
  `CREATE TABLE IF NOT EXISTS hc_claim_pressure_state (
    entity_id TEXT PRIMARY KEY,
    country_code TEXT NOT NULL,
    shell_published_at TIMESTAMPTZ DEFAULT now(),
    pressure_stage INTEGER DEFAULT 0 CHECK (pressure_stage BETWEEN 0 AND 4),
    page_indexed BOOLEAN DEFAULT false,
    organic_impressions INTEGER DEFAULT 0,
    profile_views INTEGER DEFAULT 0,
    nearby_competitor_claims INTEGER DEFAULT 0,
    claim_status TEXT DEFAULT 'unclaimed'
      CHECK (claim_status IN ('unclaimed','nudged','invited','claimed','verified')),
    claimed_at TIMESTAMPTZ,
    nudge_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_claim_pressure_stage
    ON hc_claim_pressure_state (pressure_stage, claim_status)`,

  `CREATE INDEX IF NOT EXISTS idx_claim_pressure_country
    ON hc_claim_pressure_state (country_code)`,

  // ── 4. Seed countries ────────────────────────────────────────────
  `INSERT INTO hc_country_readiness
    (country_code, country_name, market_state, currency_code, measurement_system, language_primary)
  VALUES
    ('US','United States','live','USD','imperial','en'),
    ('CA','Canada','seed','CAD','metric','en'),
    ('AU','Australia','seed','AUD','metric','en'),
    ('GB','United Kingdom','prepared','GBP','imperial','en'),
    ('NZ','New Zealand','prepared','NZD','metric','en'),
    ('ZA','South Africa','prepared','ZAR','metric','en'),
    ('DE','Germany','prepared','EUR','metric','de'),
    ('NL','Netherlands','prepared','EUR','metric','nl'),
    ('AE','United Arab Emirates','prepared','AED','metric','ar'),
    ('BR','Brazil','prepared','BRL','metric','pt'),
    ('IE','Ireland','dormant','EUR','metric','en'),
    ('SE','Sweden','dormant','SEK','metric','sv'),
    ('NO','Norway','dormant','NOK','metric','nb'),
    ('DK','Denmark','dormant','DKK','metric','da'),
    ('FI','Finland','dormant','EUR','metric','fi'),
    ('BE','Belgium','dormant','EUR','metric','nl'),
    ('AT','Austria','dormant','EUR','metric','de'),
    ('CH','Switzerland','dormant','CHF','metric','de'),
    ('ES','Spain','dormant','EUR','metric','es'),
    ('FR','France','dormant','EUR','metric','fr'),
    ('IT','Italy','dormant','EUR','metric','it'),
    ('PT','Portugal','dormant','EUR','metric','pt'),
    ('SA','Saudi Arabia','dormant','SAR','metric','ar'),
    ('QA','Qatar','dormant','QAR','metric','ar'),
    ('MX','Mexico','dormant','MXN','metric','es'),
    ('SG','Singapore','dormant','SGD','metric','en'),
    ('JP','Japan','dormant','JPY','metric','ja'),
    ('KR','South Korea','dormant','KRW','metric','ko'),
    ('IN','India','dormant','INR','metric','hi'),
    ('MY','Malaysia','dormant','MYR','metric','ms'),
    ('PL','Poland','dormant','PLN','metric','pl'),
    ('CZ','Czech Republic','dormant','CZK','metric','cs'),
    ('TR','Turkey','dormant','TRY','metric','tr'),
    ('CL','Chile','dormant','CLP','metric','es'),
    ('CO','Colombia','dormant','COP','metric','es'),
    ('AR','Argentina','dormant','ARS','metric','es'),
    ('ID','Indonesia','dormant','IDR','metric','id'),
    ('TH','Thailand','dormant','THB','metric','th'),
    ('VN','Vietnam','dormant','VND','metric','vi'),
    ('PH','Philippines','dormant','PHP','metric','en')
  ON CONFLICT (country_code) DO NOTHING`,

  // ── 5. Cross-border adjacency ────────────────────────────────────
  `UPDATE hc_country_readiness
    SET cross_border_adjacency = '["CA","MX"]'::jsonb
    WHERE country_code = 'US'`,

  `UPDATE hc_country_readiness
    SET cross_border_adjacency = '["US"]'::jsonb
    WHERE country_code = 'CA'`,

  `UPDATE hc_country_readiness
    SET cross_border_adjacency = '["NZ"]'::jsonb
    WHERE country_code = 'AU'`,

  // ── 6. v_next_country_candidates view ───────────────────────────
  `CREATE OR REPLACE VIEW v_next_country_candidates AS
  SELECT
    country_code, country_name, market_state,
    (0.24*supply_depth_score + 0.20*demand_pull_score
     + 0.14*claimable_surface_density_score + 0.14*law_readiness_score
     + 0.08*trust_signal_density_score + 0.08*monetization_readiness_score
     + 0.06*cross_border_leverage_score + 0.06*localization_strength_score) AS total_score,
    (law_pack_gate AND supply_gate AND demand_gate AND localization_gate
     AND support_gate AND payments_gate AND trust_gate) AS all_gates_passed,
    CASE
      WHEN market_state='dormant' AND law_pack_gate AND localization_gate THEN 'promote_to_prepared'
      WHEN market_state='prepared' AND supply_gate AND demand_gate THEN 'promote_to_seed'
      WHEN market_state='seed' AND law_pack_gate AND supply_gate AND demand_gate
           AND localization_gate AND support_gate AND payments_gate AND trust_gate THEN 'promote_to_live'
      ELSE 'hold'
    END AS recommendation,
    autonomous_freight_score, av_regulatory_maturity, last_scored_at
  FROM hc_country_readiness
  WHERE market_state != 'live'
  ORDER BY total_score DESC`,
];

const client = new Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log('✅ Connected to Supabase DB');

  let passed = 0, failed = 0;
  for (let i = 0; i < STATEMENTS.length; i++) {
    const label = STATEMENTS[i].trim().slice(0, 60).replace(/\s+/g, ' ') + '...';
    try {
      await client.query(STATEMENTS[i]);
      console.log(`  ✅ [${i+1}/${STATEMENTS.length}] ${label}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [${i+1}/${STATEMENTS.length}] ${label}`);
      console.error(`     ${err.message}`);
      failed++;
    }
  }

  // Verify tables exist
  const check = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('hc_country_readiness','hc_country_state_log','hc_claim_pressure_state')
    ORDER BY table_name
  `);
  console.log('\n── Table verification ──');
  check.rows.forEach(r => console.log(`  ✅ ${r.table_name}`));

  // Row count
  const count = await client.query('SELECT COUNT(*) FROM hc_country_readiness');
  console.log(`\n── hc_country_readiness rows: ${count.rows[0].count} ──`);

  await client.end();
  console.log(`\n✅ Migration complete. ${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
