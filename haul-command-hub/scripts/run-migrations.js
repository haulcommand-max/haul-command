/**
 * Run Supabase migrations using the Supabase Management API
 * 
 * The Supabase Management API exposes a /v1/projects/{ref}/database/query endpoint
 * that can execute arbitrary SQL. Requires a personal access token or the 
 * service role key with the correct endpoint.
 * 
 * Alternative: Uses the pooler connection string directly with pg.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://hvjyfyzotqobfkakjozp.supabase.co';
const PROJECT_REF = 'hvjyfyzotqobfkakjozp';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function runSQLViaSupabaseAPI(sql, label) {
  console.log(`\n=== ${label} ===`);
  
  // The correct SQL execution endpoint for Supabase
  // Try multiple approaches:
  
  // Approach 1: Use the project's SQL endpoint (if pg-meta is exposed)
  const endpoints = [
    // Supabase pg-meta endpoint (available on hosted projects)
    { url: `${SUPABASE_URL}/pg/query`, method: 'POST' },
    // Alternative pg endpoint
    { url: `${SUPABASE_URL}/rest/v1/rpc/exec_sql`, method: 'POST' },
  ];
  
  // Approach 2: Break into statements and use a CREATE FUNCTION + RPC approach
  // First create the exec_sql helper function
  const createHelperSQL = `
    CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
      EXECUTE sql_query;
      RETURN 'success';
    EXCEPTION WHEN OTHERS THEN
      RETURN SQLERRM;
    END;
    $$;
  `;

  // Try using the fetch API to call the SQL endpoint
  console.log('  Attempting direct SQL via pg endpoint...');
  
  // Try the Supabase SQL API (available since supabase-js v2)
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({ query: sql }),
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log(`  ✅ Success via ${endpoint.url}`);
        console.log(`  Response: ${JSON.stringify(data).substring(0, 200)}`);
        return { success: 1, errors: 0 };
      } else {
        const errText = await res.text();
        console.log(`  ❌ ${endpoint.url}: ${res.status} - ${errText.substring(0, 100)}`);
      }
    } catch (e) {
      console.log(`  ❌ ${endpoint.url}: ${e.message}`);
    }
  }

  console.log('  Direct SQL endpoints not available.');
  console.log('  ⚠️  MANUAL ACTION REQUIRED: Run this SQL in Supabase SQL Editor');
  return { success: 0, errors: 1, manual: true };
}

async function main() {
  console.log('🚀 Supabase Migration Runner v3');
  console.log(`Project: ${PROJECT_REF}`);

  const migDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = [
    '20260322_unified_infrastructure.sql',
    '20260323_system_infrastructure.sql',
  ];

  let needsManual = false;

  for (const file of files) {
    const filePath = path.join(migDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`  ❌ File not found: ${filePath}`);
      continue;
    }
    const sql = fs.readFileSync(filePath, 'utf8');
    const result = await runSQLViaSupabaseAPI(sql, file);
    if (result.manual) needsManual = true;
  }

  if (needsManual) {
    console.log('\n' + '═'.repeat(60));
    console.log('⚠️  MANUAL MIGRATION REQUIRED');
    console.log('═'.repeat(60));
    console.log('\nThe Supabase SQL API is not accessible programmatically.');
    console.log('Please run both migrations manually:');
    console.log('\n1. Go to: https://supabase.com/dashboard/project/hvjyfyzotqobfkakjozp/sql');
    console.log('2. Paste the SQL from: supabase/migrations/20260322_unified_infrastructure.sql');
    console.log('3. Click "Run"');
    console.log('4. Paste the SQL from: supabase/migrations/20260323_system_infrastructure.sql');
    console.log('5. Click "Run"');
  }
}

main().catch(console.error);
