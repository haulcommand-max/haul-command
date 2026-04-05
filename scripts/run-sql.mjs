import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const connectionString = process.env.SUPABASE_DB_POOLER_URL;
  if (!connectionString) {
    console.error('Missing SUPABASE_DB_POOLER_URL in .env.local');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const sqlFile = process.argv[2] || 'supabase/migrations/20260401_capture_system.sql';
    const sql = fs.readFileSync(sqlFile, 'utf8');
    await client.connect();
    console.log('Connected to Supabase DB. Applying migration...');
    await client.query(sql);
    console.log('Migration applied successfully.');
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    await client.end();
  }
}

main();
