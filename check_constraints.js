require('dotenv').config({path: '.env.local'});
const { Client } = require('pg');
const DB = 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

async function run() {
  const c = new Client({ connectionString: DB });
  await c.connect();
  const res = await c.query(`
    SELECT conname, pg_get_constraintdef(c.oid) as def
    FROM pg_constraint c
    WHERE conrelid = 'public.hc_available_now'::regclass AND contype='c'
  `);
  console.log('Constraints:');
  res.rows.forEach(r => console.log(r.conname, ':', r.def));
  await c.end();
}
run().catch(e => console.error(e.message));
