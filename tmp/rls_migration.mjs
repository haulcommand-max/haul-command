// tmp/rls_migration.mjs
// Applies RLS hardening to hc_country_readiness and hc_claim_pressure_state
// Skills applied: RLS hardening, migration pack design

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const DB_URL = 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

const STATEMENTS = [
  // ── hc_country_readiness RLS ──────────────────────────────
  // Public: anyone can read market state (needed for MarketModeCTA, UrgentMarketSponsor)
  // Write: service_role only
  `ALTER TABLE hc_country_readiness ENABLE ROW LEVEL SECURITY`,

  `DROP POLICY IF EXISTS "service_role_all_country" ON hc_country_readiness`,
  `CREATE POLICY "service_role_all_country" ON hc_country_readiness
    FOR ALL TO service_role USING (true) WITH CHECK (true)`,

  `DROP POLICY IF EXISTS "anon_read_country" ON hc_country_readiness`,
  `CREATE POLICY "anon_read_country" ON hc_country_readiness
    FOR SELECT TO anon USING (true)`,

  `DROP POLICY IF EXISTS "authenticated_read_country" ON hc_country_readiness`,
  `CREATE POLICY "authenticated_read_country" ON hc_country_readiness
    FOR SELECT TO authenticated USING (true)`,

  // ── hc_country_state_log RLS ──────────────────────────────
  // Read-only for authenticated (audit trail), write: service_role only
  `ALTER TABLE hc_country_state_log ENABLE ROW LEVEL SECURITY`,

  `DROP POLICY IF EXISTS "service_role_all_state_log" ON hc_country_state_log`,
  `CREATE POLICY "service_role_all_state_log" ON hc_country_state_log
    FOR ALL TO service_role USING (true) WITH CHECK (true)`,

  `DROP POLICY IF EXISTS "authenticated_read_state_log" ON hc_country_state_log`,
  `CREATE POLICY "authenticated_read_state_log" ON hc_country_state_log
    FOR SELECT TO authenticated USING (true)`,

  // ── hc_claim_pressure_state RLS ─────────────────────────
  // No public read — operator data, service_role + authenticated only
  // authenticated: can only see their own entity_id pressure state
  `ALTER TABLE hc_claim_pressure_state ENABLE ROW LEVEL SECURITY`,

  `DROP POLICY IF EXISTS "service_role_all_claim_pressure" ON hc_claim_pressure_state`,
  `CREATE POLICY "service_role_all_claim_pressure" ON hc_claim_pressure_state
    FOR ALL TO service_role USING (true) WITH CHECK (true)`,

  `DROP POLICY IF EXISTS "authenticated_read_own_pressure" ON hc_claim_pressure_state`,
  `CREATE POLICY "authenticated_read_own_pressure" ON hc_claim_pressure_state
    FOR SELECT TO authenticated USING (entity_id = auth.uid()::text)`,

  // ── Grant read on view ────────────────────────────────────
  `GRANT SELECT ON v_next_country_candidates TO service_role`,
  `GRANT SELECT ON v_next_country_candidates TO authenticated`,
];

const client = new Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log('✅ Connected');

  let passed = 0, failed = 0;
  for (let i = 0; i < STATEMENTS.length; i++) {
    const label = STATEMENTS[i].trim().slice(0, 70).replace(/\s+/g, ' ') + '...';
    try {
      await client.query(STATEMENTS[i]);
      console.log(`  ✅ [${i+1}/${STATEMENTS.length}] ${label}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [${i+1}/${STATEMENTS.length}] FAILED: ${err.message}`);
      failed++;
    }
  }

  // Verify RLS is enabled
  const check = await client.query(`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('hc_country_readiness','hc_country_state_log','hc_claim_pressure_state')
    ORDER BY tablename
  `);
  console.log('\n── RLS status ──');
  check.rows.forEach(r => console.log(`  ${r.rowsecurity ? '✅' : '❌'} ${r.tablename}: RLS=${r.rowsecurity}`));

  await client.end();
  console.log(`\n✅ Done. ${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
