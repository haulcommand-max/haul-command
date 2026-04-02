const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL });
  await c.connect();
  const r = await c.query(`SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conname = 'monetization_flags_lifecycle_stage_check'`);
  console.log('Check constraint:', r.rows[0]?.def || 'NOT FOUND');
  await c.end();
})();
