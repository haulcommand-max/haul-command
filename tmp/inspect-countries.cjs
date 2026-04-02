const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function inspect() {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL });
  await c.connect();
  
  // country_tiers schema
  const r = await c.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='country_tiers' AND table_schema='public' ORDER BY ordinal_position`);
  console.log('country_tiers schema:');
  r.rows.forEach(x => console.log(`  ${x.column_name} (${x.data_type})`));
  
  // Sample data
  const r2 = await c.query('SELECT * FROM public.country_tiers LIMIT 3');
  console.log('\nSample country_tiers data:');
  console.log(JSON.stringify(r2.rows, null, 2));
  
  // countries current columns
  const r3 = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name='countries' AND table_schema='public' ORDER BY ordinal_position`);
  console.log('\ncountries columns:', r3.rows.map(x => x.column_name).join(', '));
  
  // countries sample
  const r4 = await c.query('SELECT * FROM public.countries LIMIT 2');
  console.log('\nSample countries data:');
  console.log(JSON.stringify(r4.rows, null, 2));
  
  // hc_countries schema
  const r5 = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name='hc_countries' AND table_schema='public' ORDER BY ordinal_position`);
  console.log('\nhc_countries columns:', r5.rows.map(x => x.column_name).join(', '));
  
  const r6 = await c.query('SELECT * FROM public.hc_countries LIMIT 2');
  console.log('\nSample hc_countries data:');
  console.log(JSON.stringify(r6.rows, null, 2));
  
  await c.end();
}
inspect().catch(e => { console.error(e); process.exit(1); });
