const env = require('dotenv').config({path: '.env.local'}).parsed;
const { Client } = require('pg');

async function checkSeoTable() {
  const c = new Client({ connectionString: env.SUPABASE_DB_POOLER_URL });
  await c.connect();
  
  try {
    const res = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'seo_pages'");
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    await c.end();
  }
}
checkSeoTable();
