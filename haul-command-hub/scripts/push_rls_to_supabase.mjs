// push_rls_to_supabase.mjs
// Applies the RLS lockdown migration directly via pg driver

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));

const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ0NjMxNSwiZXhwIjoyMDg3MDIyMzE1fQ.xG-oo7qSFevW1JO9GVwd005ZXAMht86_C7P8RRHJ938';
const SUPABASE_REF = 'hvjyfyzotqobfkakjozp';

const sqlPath = join(__dirname, '..', 'supabase', 'migrations', '20260326090000_strict_rls_lockdown.sql');
const sql = readFileSync(sqlPath, 'utf8');

console.log('='.repeat(60));
console.log('HAUL COMMAND — RLS Phase 1 & 2 Lockdown Migration');
console.log(`Project: ${SUPABASE_REF}`);
console.log(`SQL: ${sql.length.toLocaleString()} chars`);
console.log('='.repeat(60));

const client = new Client({
  connectionString: `postgresql://postgres.${SUPABASE_REF}:${SERVICE_ROLE}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000,
  query_timeout: 60000,
});

try {
  await client.connect();
  console.log('\n✅ Connected to Supabase (Transaction Pooler)');

  await client.query(sql);
  console.log('✅ Migration applied successfully!\n');

  // Verify RLS status
  const result = await client.query(`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'companies', 'hc_dictionary', 'hc_semantic_index',
        'lb_observations', 'lb_organizations', 'lb_corridors',
        'lb_daily_volume', 'state_regulations', 'jurisdictions',
        'corridors', 'identities', 'global_countries', 'hc_places',
        'users', 'blog_articles'
      )
    ORDER BY tablename
  `);

  console.log('RLS STATUS VERIFICATION:');
  console.log('─'.repeat(40));
  let locked = 0, exposed = 0;
  result.rows.forEach(r => {
    if (r.rowsecurity) {
      console.log(`  🔒 ${r.tablename}`);
      locked++;
    } else {
      console.log(`  🚨 ${r.tablename} — STILL EXPOSED!`);
      exposed++;
    }
  });
  console.log('─'.repeat(40));
  console.log(`  ${locked} tables locked | ${exposed} tables still exposed`);

  // Verify key policies exist
  const policies = await client.query(`
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('companies', 'users', 'hc_dictionary')
    ORDER BY tablename, policyname
  `);
  console.log('\nKEY POLICY VERIFICATION:');
  console.log('─'.repeat(40));
  policies.rows.forEach(p => {
    console.log(`  ${p.tablename} → "${p.policyname}" [${p.cmd}]`);
  });

  await client.end();
  console.log('\n✅ Migration verification complete.');

} catch (err) {
  console.error('\n❌ Migration failed:', err.message);
  if (err.detail) console.error('   Detail:', err.detail);
  if (err.hint) console.error('   Hint:', err.hint);
  await client.end().catch(() => {});
  process.exit(1);
}
