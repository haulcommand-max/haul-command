const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL });
  await c.connect();
  // Check what entity_type values are allowed
  const r = await c.query(`
    SELECT pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = 'public.market_entities'::regclass AND contype = 'c'
  `);
  r.rows.forEach(x => console.log(x.def));
  await c.end();
})();
