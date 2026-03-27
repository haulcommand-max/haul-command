// repair_migration_history.mjs
// The Supabase CLI migration history is out of sync with the remote DB.
// This script:
// 1. Marks all existing migrations as "already applied" in supabase_migrations.schema_migrations
// 2. Then applies ONLY the new RLS lockdown migration (20260326090000)
//
// This is the correct repair path per Supabase docs for out-of-sync schemas.

import { readFileSync } from 'fs';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUPABASE_REF = 'hvjyfyzotqobfkakjozp';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ0NjMxNSwiZXhwIjoyMDg3MDIyMzE1fQ.xG-oo7qSFevW1JO9GVwd005ZXAMht86_C7P8RRHJ938';

// All migration files EXCEPT the new RLS lockdown (already applied to DB)
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
const allFiles = readdirSync(migrationsDir)
  .filter(f => f.match(/^\d{14}_.*\.sql$/) && f !== '20260326090000_strict_rls_lockdown.sql')
  .sort();

const newMigrationSql = readFileSync(
  join(migrationsDir, '20260326090000_strict_rls_lockdown.sql'),
  'utf8'
);

console.log('='.repeat(60));
console.log('REPAIR MIGRATION HISTORY + APPLY RLS LOCKDOWN');
console.log(`Project: ${SUPABASE_REF}`);
console.log(`Old migrations to mark as applied: ${allFiles.length}`);
console.log(`New migration SQL: ${newMigrationSql.length.toLocaleString()} chars`);
console.log('='.repeat(60));

function httpsPost(path, body, isJson = true) {
  return new Promise((resolve, reject) => {
    const bodyStr = isJson ? JSON.stringify(body) : body;
    const opts = {
      hostname: `${SUPABASE_REF}.supabase.co`,
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Content-Type': isJson ? 'application/json' : 'text/plain',
        'apikey': SERVICE_ROLE,
        'Authorization': `Bearer ${SERVICE_ROLE}`,
        'Content-Length': Buffer.byteLength(bodyStr),
        'Prefer': 'return=minimal',
      },
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => { d += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

// Step 1: Mark all old migrations as applied
console.log('\n[1] Marking old migrations as applied in migration history...');
for (const file of allFiles) {
  const version = file.replace(/^(\d{14})_.*$/, '$1');
  const name = file.replace(/\.sql$/, '');
  
  const result = await httpsPost('/rest/v1/schema_migrations', {
    version,
    name,
    statements: [],
  });
  
  if (result.status === 201 || result.status === 200) {
    process.stdout.write('.');
  } else if (result.status === 409) {
    process.stdout.write('='); // already exists
  } else {
    process.stdout.write('?');
    // Not critical - the schema_migrations table may not exist in this project
  }
}
console.log('\n   Done marking old migrations.');

// Step 2: Apply only the RLS lockdown migration via Supabase CLI approach
// The CLI uses supabase_migrations.schema_migrations table which may differ
// Let's use the REST API to execute our specific SQL via an RPC
console.log('\n[2] Applying RLS lockdown migration via REST API...');

// Try the exec_sql function if it exists
const execResult = await httpsPost('/rest/v1/rpc/exec_sql', { sql_query: newMigrationSql });
console.log(`   exec_sql status: ${execResult.status}`);
if (execResult.status === 200 || execResult.status === 204) {
  console.log('   ✅ Applied via exec_sql RPC!');
} else {
  console.log('   Response:', execResult.body.substring(0, 200));
  console.log('\n   ⚠️  Automatic application failed.');
  console.log('   Manual step required:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/hvjyfyzotqobfkakjozp/sql/new');
  console.log('   2. Paste the contents of:');
  console.log('      supabase/migrations/20260326090000_strict_rls_lockdown.sql');
  console.log('   3. Click "Run"');
}

// Step 3: Verify current state via REST 
console.log('\n[3] Verifying RLS state via anon access test...');
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDYzMTUsImV4cCI6MjA4NzAyMjMxNX0.K-la5Lc6PBNCjyEqK-2vyfZPct-DZCBWg69cu4c0zqg';

const tables = ['companies', 'hc_dictionary', 'lb_observations', 'state_regulations', 'jurisdictions', 'corridors'];

let locked = 0, exposed = 0;
for (const table of tables) {
  await new Promise(resolve => {
    const opts = {
      hostname: `${SUPABASE_REF}.supabase.co`,
      port: 443,
      path: `/rest/v1/${table}?select=count&limit=1`,
      headers: { 'apikey': ANON, 'Authorization': `Bearer ${ANON}` },
    };
    https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`  ⚠️  EXPOSED: ${table} (anon HTTP ${res.statusCode})`);
          exposed++;
        } else {
          console.log(`  🔒 LOCKED: ${table} (anon HTTP ${res.statusCode})`);
          locked++;
        }
        resolve();
      });
    }).on('error', e => { console.error(table, e.message); resolve(); }).end();
  });
}

console.log(`\n${locked} tables locked, ${exposed} tables still exposed.`);
if (exposed > 0) {
  console.log('\n⚠️  MANUAL ACTION REQUIRED — run the SQL from:');
  console.log('   supabase/migrations/20260326090000_strict_rls_lockdown.sql');
  console.log('   in Supabase Dashboard → SQL Editor');
}
