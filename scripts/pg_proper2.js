const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres' });
async function run() {
  await client.connect();
  try {
     const { rows: r1 } = await client.query(`SELECT COUNT(*) as c FROM hc_real_operators WHERE state_code IS NOT NULL AND state_code != ''`);
     console.log('Operators with state_code:', r1[0].c);
     
     const { rows: r2 } = await client.query(`SELECT COUNT(*) as c FROM contacts_enriched WHERE state_inferred IS NOT NULL OR city_inferred IS NOT NULL OR address IS NOT NULL`);
     console.log('Enriched Contacts with inferred location:', r2[0].c);

  } catch(e) { }
  await client.end();
}
run().catch(console.error);
