const { Client } = require('pg');
const dbUrl = 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

async function go() {
  const c = new Client(dbUrl);
  await c.connect();
  const res = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' and table_name in ('hc_device_tokens', 'hc_notif_preferences', 'hc_notif_events')");
  console.log('Existing tables:', res.rows.map(r => r.table_name));
  await c.end();
}
go();
