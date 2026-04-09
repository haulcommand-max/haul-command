import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function query() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_POOLER_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  // Get all table names
  const res = await client.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
  console.log(res.rows.map(r => r.tablename));
  await client.end();
}
query();
