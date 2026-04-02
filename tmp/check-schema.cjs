const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL });
  await c.connect();
  const r = await c.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='dispatch_supply' AND table_schema='public' ORDER BY ordinal_position`);
  console.log('=== dispatch_supply columns ===');
  r.rows.forEach(x => console.log(`  ${x.column_name} (${x.data_type})`));

  const m = await c.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='market_entities' AND table_schema='public' ORDER BY ordinal_position`);
  console.log('\n=== market_entities columns ===');
  m.rows.forEach(x => console.log(`  ${x.column_name} (${x.data_type})`));
  await c.end();
})();
