import { readFileSync } from 'fs';
import { resolve } from 'path';

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node apply-migration.mjs <migration-file>');
  process.exit(1);
}

const sql = readFileSync(resolve(migrationFile), 'utf-8');
const poolerUrl = process.env.SUPABASE_DB_POOLER_URL;

if (!poolerUrl) {
  console.error('SUPABASE_DB_POOLER_URL not set');
  process.exit(1);
}

// Parse the pooler URL
const url = new URL(poolerUrl);
const config = {
  host: url.hostname,
  port: parseInt(url.port || '6543'),
  database: url.pathname.slice(1),
  user: url.username,
  password: decodeURIComponent(url.password),
  ssl: { rejectUnauthorized: false },
};

// Use fetch to Supabase REST API instead since pg module may not be installed
// We'll use the service role key to execute raw SQL via the management API

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

async function run() {
  console.log(`Applying migration: ${migrationFile}`);
  console.log(`SQL length: ${sql.length} chars`);
  
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({})
  });

  // Try direct SQL execution via the pg endpoint
  // Supabase exposes sql execution through their management API
  // Alternative: use the Supabase CLI or pg module
  
  // Let's split SQL into statements and execute via RPC
  // Actually, the simplest approach is to use psql if available
  console.log('Migration SQL ready. Use Supabase Dashboard SQL Editor or psql to apply.');
  console.log('---');
  console.log('First 500 chars of SQL:');
  console.log(sql.substring(0, 500));
  console.log('---');
  console.log(`Total: ${sql.length} chars, ~${sql.split(';').length} statements`);
}

run().catch(console.error);
