// push_rls_migration.mjs
// Executes the RLS lockdown SQL via Supabase's PostgREST /rpc/exec_sql endpoint
// or directly via the pg driver if available.
//
// Usage: node push_rls_migration.mjs

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hvjyfyzotqobfkakjozp.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const sql = readFileSync(
  new URL('../supabase/migrations/20260326090000_strict_rls_lockdown.sql', import.meta.url),
  'utf8'
);

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

async function pushMigration() {
  console.log('Pushing Phase 1 & 2 RLS Lockdown Migration...');
  console.log(`SQL length: ${sql.length} chars`);

  // Break SQL into statements (split on semicolons, preserve DO $$ blocks)
  // We'll use the Supabase rpc exec approach with raw pg if available,
  // otherwise fall back to individual statement execution via pg
  
  try {
    // Try using the Supabase Management API SQL endpoint
    const resp = await fetch(
      `https://api.supabase.com/v1/projects/hvjyfyzotqobfkakjozp/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_KEY}`
        },
        body: JSON.stringify({ query: sql })
      }
    );

    const text = await resp.text();
    console.log(`Status: ${resp.status}`);
    console.log(`Response: ${text.substring(0, 500)}`);

    if (resp.ok) {
      console.log('\n✅ Migration pushed successfully!');
    } else {
      console.log('\n⚠️  Management API failed. Trying PostgREST execute...');
      await pushViaPostgREST();
    }
  } catch (err) {
    console.error('Error:', err.message);
    await pushViaPostgREST();
  }
}

async function pushViaPostgREST() {
  // Use the pg package if available
  try {
    const { default: pg } = await import('pg');
    const { Client } = pg;
    
    // Supabase direct connection via connection pooler
    const client = new Client({
      connectionString: `postgresql://postgres.hvjyfyzotqobfkakjozp:${SERVICE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('Connected via pg driver...');
    await client.query(sql);
    await client.end();
    console.log('✅ Migration executed via pg driver!');
  } catch (pgErr) {
    console.error('pg driver failed:', pgErr.message);
    console.log('\n📋 MANUAL DEPLOYMENT REQUIRED');
    console.log('Copy the SQL from:');
    console.log('  supabase/migrations/20260326090000_strict_rls_lockdown.sql');
    console.log('And paste it into:');
    console.log('  Supabase Dashboard → SQL Editor → New Query → Run');
  }
}

pushMigration();
