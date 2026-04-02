const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL });
  await c.connect();
  const r = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name='hc_global_operators' AND column_name='is_public'`);
  console.log('is_public:', r.rows.length > 0 ? 'EXISTS' : 'MISSING');
  
  const s = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name='hc_global_operators' AND column_name='slug'`);
  console.log('slug:', s.rows.length > 0 ? 'EXISTS' : 'MISSING');
  await c.end();
})();
