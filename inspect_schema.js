require('dotenv').config({path: '.env.local'});
const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:5432/postgres' });

async function run() {
  await c.connect();
  const tables = ['hc_available_now', 'hc_trust_profiles', 'hc_route_requests', 'loads', 'hc_device_tokens'];
  for (const t of tables) {
    const res = await c.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
      [t]
    );
    console.log(`\n=== ${t} ===`);
    res.rows.forEach(r => console.log(` ${r.column_name} (${r.data_type})`));
  }
  await c.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
