require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.SUPABASE_DB_POOLER_URL });

async function checkView() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.views WHERE table_name = 'v_available_escorts'");
    console.log(res.rows);
  } finally {
    pool.end();
  }
}
checkView();
