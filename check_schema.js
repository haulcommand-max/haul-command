require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.SUPABASE_DB_POOLER_URL });

async function checkSchema() {
  try {
    console.log("Checking schema cache error...");
    const res = await pool.query(`
      SELECT tablename, policyname, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename IN ('country_ingest_queue', 'regulation_sources')
    `);
    console.log('--- Policies ---');
    console.log(res.rows);
    
    const accessRes = await pool.query(`
      SELECT grantee, privilege_type 
      FROM information_schema.role_table_grants 
      WHERE table_name IN ('country_ingest_queue', 'regulation_sources')
    `);
    console.log('--- Grants ---');
    console.log(accessRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
checkSchema();
