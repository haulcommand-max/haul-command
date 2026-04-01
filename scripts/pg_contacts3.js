const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres' });
async function run() {
  await client.connect();
  
  try {
     const { rows: r2 } = await client.query(`SELECT source_file, count(*) as count FROM contacts_enriched GROUP BY source_file`);
     console.log('contacts_enriched sources:', r2);
  } catch(e) { console.error('Error contacts_enriched:', e.message); }

  try {
     const { rows: r3 } = await client.query(`SELECT COUNT(*) as sum FROM hc_real_operators`);
     console.log('operators (hc_real_operators):', r3[0].sum);
  } catch(e) {}
  
  try {
     const { rows: r4 } = await client.query(`SELECT COUNT(*) as sum FROM hc_brokers`);
     console.log('brokers (hc_brokers):', r4[0].sum);
  } catch(e) {}

  try {
     const { rows: r5 } = await client.query(`SELECT count(DISTINCT type) as t, count(*) as count FROM hc_contacts`);
     console.log('hc_contacts types:', r5[0]);
  } catch(e) {}

  await client.end();
}
run().catch(console.error);
