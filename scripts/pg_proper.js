const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres' });
async function run() {
  await client.connect();
  
  // operators
  try {
     const { rows: cols } = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'hc_real_operators'`);
     const columns = cols.map(r => r.column_name);
     console.log('Operators columns:', columns.join(', '));
     
     // check if they have location
     const stateCol = columns.find(c => c.includes('state') || c.includes('loc') || c.includes('address') || c.includes('city') || c.includes('zip') || c.includes('coverage'));
     if (stateCol) {
         const { rows: valid } = await client.query(`SELECT COUNT(*) as c FROM hc_real_operators WHERE ${stateCol} IS NOT NULL AND ${stateCol} != ''`);
         console.log(`Operators with ${stateCol}: ${valid[0].c} out of 7522`);
     }
  } catch(e) { console.log(e); }

  // brokers
  try {
    const { rows: cols } = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'hc_brokers'`);
    const columns = cols.map(r => r.column_name);
    console.log('\nBrokers columns:', columns.join(', '));
    
    // check location
    const stateCol = columns.find(c => c.includes('state') || c.includes('loc') || c.includes('address') || c.includes('city') || c.includes('zip'));
    if (stateCol) {
        const { rows: valid } = await client.query(`SELECT COUNT(*) as c FROM hc_brokers WHERE ${stateCol} IS NOT NULL AND ${stateCol} != ''`);
        console.log(`Brokers with ${stateCol}: ${valid[0].c} out of 30`);
    } else {
        const { rows: valid2 } = await client.query(`SELECT COUNT(*) as c FROM hc_brokers WHERE country IS NOT NULL`);
        console.log(`Brokers with country: ${valid2[0].c} out of 30`);
    }
 } catch(e) {}
  await client.end();
}
run().catch(console.error);
