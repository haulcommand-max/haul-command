import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node scripts/apply-sql.mjs <migration-file>');
  process.exit(1);
}

const sql = readFileSync(resolve(migrationFile), 'utf-8');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function run() {
  console.log(`Applying: ${migrationFile}`);
  console.log(`SQL: ${sql.length} chars`);

  // Use Supabase's PostgREST /rpc endpoint won't work for DDL
  // Use the pg_query method via the management API
  // Actually, the simplest: use fetch against the Supabase SQL endpoint

  // Supabase offers /pg endpoint for direct SQL in some versions
  // Let's try via the SQL endpoint / REST proxy

  // The correct approach for remote SQL: use the pooler URL with pg
  // But since we may not have pg installed, let's use the Supabase Edge Function approach
  
  // Best option: POST to supabase.co with the management API
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  console.log(`Project ref: ${projectRef}`);
  
  // Try direct SQL via the management API (requires access token)
  // Alternative: Use the REST API to call a custom RPC that executes SQL
  // Simplest: Use the pg module if available
  
  try {
    // Try importing pg
    const { default: pg } = await import('pg');
    const poolerUrl = process.env.SUPABASE_DB_POOLER_URL;
    
    if (!poolerUrl) {
      console.error('SUPABASE_DB_POOLER_URL not set');
      process.exit(1);
    }
    
    const client = new pg.Client({
      connectionString: poolerUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('Connected to database');
    
    await client.query(sql);
    console.log('Migration applied successfully!');
    
    await client.end();
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('Cannot find')) {
      console.log('pg module not found. Installing...');
      const { execSync } = await import('child_process');
      execSync('npm install pg --no-save', { stdio: 'inherit', cwd: process.cwd() });
      console.log('pg installed. Please re-run this script.');
    } else {
      console.error('Error:', err.message || err);
      // Show more detail for SQL errors
      if (err.position) {
        console.error(`SQL position: ${err.position}`);
        const pos = parseInt(err.position);
        console.error(`Near: ...${sql.substring(Math.max(0, pos - 100), pos + 100)}...`);
      }
      process.exit(1);
    }
  }
}

run().catch(console.error);
