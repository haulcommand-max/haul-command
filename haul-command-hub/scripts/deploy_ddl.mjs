/**
 * Deploy TSAS DDL to Supabase using the pg module
 * Reads the connection string from environment or constructs it
 */
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const PROJECT_REF = 'hvjyfyzotqobfkakjozp';

// Supabase connection pooler (Transaction mode)
// Password is the database password set in Supabase dashboard
// Using session mode on port 5432 for DDL (transaction mode doesn't support DDL)
const connString = process.env.DATABASE_URL || 
  `postgresql://postgres.${PROJECT_REF}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

async function main() {
  const ddlFile = process.argv[2] || 'scripts/tsas_migration_ddl.sql';
  const ddlPath = path.resolve(__dirname, '..', ddlFile);
  
  if (!fs.existsSync(ddlPath)) {
    console.error(`❌ File not found: ${ddlPath}`);
    process.exit(1);
  }
  
  console.log(`📋 Deploying DDL from: ${ddlFile}`);
  const ddl = fs.readFileSync(ddlPath, 'utf-8');
  
  // Split into individual statements  
  const statements = ddl
    .split(';')
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 10);
  
  console.log(`   Found ${statements.length} SQL statements\n`);
  
  if (!process.env.SUPABASE_DB_PASSWORD && !process.env.DATABASE_URL) {
    console.error('❌ Set SUPABASE_DB_PASSWORD or DATABASE_URL in .env first');
    console.log('   Get the database password from:');
    console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/settings/database`);
    console.log('   Then add to .env: SUPABASE_DB_PASSWORD=<your-password>');
    process.exit(1);
  }
  
  const client = new pg.default.Client({
    connectionString: connString,
    ssl: { rejectUnauthorized: false },
  });
  
  try {
    await client.connect();
    console.log('   ✅ Connected to PostgreSQL\n');
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
      try {
        await client.query(stmt);
        console.log(`   ✅ [${i + 1}/${statements.length}] ${preview}...`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`   ⏭  [${i + 1}/${statements.length}] Already exists — skipping`);
        } else {
          console.error(`   ❌ [${i + 1}/${statements.length}] ${err.message}`);
        }
      }
    }
    
    // Reload PostgREST schema cache
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('\n   📡 PostgREST schema cache reload triggered');
    
  } catch (err) {
    console.error('   ❌ Connection failed:', err.message);
    console.log('\n   Make sure SUPABASE_DB_PASSWORD is correct.');
    console.log(`   Check: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/database`);
  } finally {
    await client.end();
    console.log('   ✅ Done\n');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
