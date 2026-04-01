const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres' });
async function run() {
  await client.connect();
  
  try {
     const { rows: r1 } = await client.query(`SELECT COUNT(*) as c FROM hc_real_operators`);
     console.log('Operators:', r1[0].c);

     const { rows: rLoc } = await client.query(`SELECT COUNT(*) as c FROM hc_real_operators WHERE base_state IS NOT NULL`);
     console.log('Operators with proper place (base_state):', rLoc[0].c);
     
     const { rows: r2 } = await client.query(`SELECT COUNT(*) as c FROM hc_brokers`);
     console.log('Brokers:', r2[0].c);
  } catch(e) {}

  try {
    const { rows: r3 } = await client.query(`SELECT COUNT(*) as c FROM hc_public_operators`);
    console.log('Public operators:', r3[0].c);
  } catch(e) {}

  await client.end();
}
run().catch(console.error);
