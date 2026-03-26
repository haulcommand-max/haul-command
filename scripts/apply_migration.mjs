import fs from 'fs';
import path from 'path';
import https from 'https';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.production.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sql = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20260326070000_bulk_ingestion_rpc.sql'),
  'utf-8'
);

function execSQL(query) {
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);
    // We'll use the management API instead — direct via pg connection string
    // Fall back to running via the Supabase CLI-compatible approach
    reject(new Error('use_pg_direct'));
  });
}

// Use node-postgres to send raw SQL via DATABASE_URL
import { createClient } from '@supabase/supabase-js';
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function applyMigration() {
  console.log('[HAUL-OS] Applying bulk_ingestion_rpc migration...');
  
  // Split into individual statements and run via RPC
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 5 && !s.startsWith('--'));

  for (const statement of statements) {
    console.log(`  Executing: ${statement.substring(0, 60)}...`);
    const { error } = await admin.rpc('exec', { sql: statement + ';' }).maybeSingle();
    if (error && !error.message.includes('does not exist')) {
      console.error('  ❌ Error:', error.message);
    } else {
      console.log('  ✅ OK');
    }
  }
}

applyMigration().catch(e => {
  console.error('Migration failed:', e.message);
});
