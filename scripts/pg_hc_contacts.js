const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres' });
async function run() {
  await client.connect();
  
  try {
     const { rows: r1 } = await client.query(`SELECT type, COUNT(*) FROM hc_contacts GROUP BY type`);
     console.log('hc_contacts types:', r1);
  } catch(e) {}

  try {
     const { rows: cols } = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'hc_contacts'`);
     console.log('Columns in hc_contacts table:', cols.map(r => r.column_name).join(', '));
  } catch(e) {}

  await client.end();
}
run().catch(console.error);
