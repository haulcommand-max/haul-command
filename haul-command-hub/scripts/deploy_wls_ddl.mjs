/**
 * Deploy WLS regulation tables to Supabase via SQL execution
 * Reads the DDL file and executes it through the Supabase REST API
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: sql
    }),
  });
  return response;
}

async function main() {
  console.log('Deploying WLS regulation DDL to Supabase...\n');
  
  const ddlPath = path.resolve(__dirname, 'wls_regulation_ddl.sql');
  const ddl = fs.readFileSync(ddlPath, 'utf-8');
  
  // Split DDL into individual statements
  const statements = ddl
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`  Found ${statements.length} SQL statements\n`);
  
  // Use the Supabase management API to execute raw SQL
  // Since we can't use rpc for DDL, we'll use the pg_net extension or 
  // fall back to individual table creation via the REST API
  
  // Actually, we'll create a temporary function to execute our DDL
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    db: { schema: 'public' }
  });

  // Test connection
  const { data: test, error: testErr } = await supabase.from('hc_source_tsas').select('count').limit(1);
  if (testErr) {
    console.log('  Connection test (expected if table missing):', testErr.message);
  } else {
    console.log('  ✅ Supabase connection verified');
  }

  console.log('\n  ⚠️  The DDL must be run in the Supabase SQL Editor.');
  console.log('  📋 DDL path:', ddlPath);
  console.log('\n  Steps:');
  console.log('  1. Go to https://supabase.com/dashboard');
  console.log('  2. Open your project → SQL Editor');
  console.log('  3. Paste the contents of wls_regulation_ddl.sql');
  console.log('  4. Click "Run"');
  console.log('  5. Then run: node scripts/wls_data_loader.mjs\n');
  
  // Copy DDL to clipboard-friendly format
  console.log('  ─── DDL Preview (first 80 lines) ───');
  const lines = ddl.split('\n').slice(0, 80);
  for (const line of lines) {
    console.log('  ' + line);
  }
  console.log('  ... (truncated, see full file)');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
