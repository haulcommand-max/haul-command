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
  const res = await client.query("SELECT DISTINCT surface_category_key FROM hc_places LIMIT 20");
  console.log('surface_category_key values:', res.rows.map(r => r.surface_category_key));
  
  const res2 = await client.query("SELECT DISTINCT surface_subcategory_key FROM hc_places LIMIT 20");
  console.log('surface_subcategory_key values:', res2.rows.map(r => r.surface_subcategory_key));
  await client.end();
}
query();
