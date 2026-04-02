const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL });
  await c.connect();
  
  const r = await c.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`);
  console.log('=== TABLES (' + r.rows.length + ') ===');
  r.rows.forEach(x => console.log('  ' + x.tablename));
  
  const v = await c.query(`SELECT viewname FROM pg_views WHERE schemaname='public' ORDER BY viewname`);
  console.log('\n=== VIEWS (' + v.rows.length + ') ===');
  v.rows.forEach(x => console.log('  ' + x.viewname));

  const f = await c.query(`SELECT routine_name FROM information_schema.routines WHERE routine_schema='public' AND routine_type='FUNCTION' ORDER BY routine_name`);
  console.log('\n=== FUNCTIONS (' + f.rows.length + ') ===');
  f.rows.forEach(x => console.log('  ' + x.routine_name));

  // Row counts for key tables
  const keyTables = ['countries','canonical_roles','country_roles','market_entities','dispatch_supply',
    'intake_events','monetization_flags','hc_global_operators','glossary_terms','directory_views',
    'jobs','invoices','profiles','subscriptions','bookings'];
  console.log('\n=== ROW COUNTS ===');
  for (const t of keyTables) {
    try {
      const rc = await c.query(`SELECT count(*) as cnt FROM public."${t}"`);
      console.log(`  ${t}: ${rc.rows[0].cnt}`);
    } catch { console.log(`  ${t}: (not found)`); }
  }

  await c.end();
})();
