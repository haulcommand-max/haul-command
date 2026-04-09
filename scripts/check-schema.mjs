import { config } from 'dotenv';
import { resolve } from 'path';
import pg from 'pg';

config({ path: resolve(process.cwd(), '.env.local') });

async function run() {
  const client = new pg.Client({
    connectionString: process.env.SUPABASE_DB_POOLER_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  
  // Check existing training tables
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'training%' ORDER BY table_name"
  );
  console.log('Existing training tables:', JSON.stringify(tables.rows));
  
  // Check existing content tables
  const content = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'content%' ORDER BY table_name"
  );
  console.log('Existing content tables:', JSON.stringify(content.rows));
  
  // Check column structure of training_modules if it exists
  if (tables.rows.some(r => r.table_name === 'training_modules')) {
    const cols = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'training_modules' ORDER BY ordinal_position"
    );
    console.log('training_modules columns:', JSON.stringify(cols.rows));
  }
  
  // Check training_catalog
  if (tables.rows.some(r => r.table_name === 'training_catalog')) {
    const cols = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'training_catalog' ORDER BY ordinal_position"
    );
    console.log('training_catalog columns:', JSON.stringify(cols.rows));
  }
  
  await client.end();
}

run().catch(e => console.error(e.message));
