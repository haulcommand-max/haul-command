const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:EvuphRxN3zcgYSk8@db.hvjyfyzotqobfkakjozp.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  console.log("Connected to PostgreSQL direct db.");

  const queries = [
    `SELECT COUNT(*) as c FROM auth.users`,
    `SELECT raw_user_meta_data->>'role' as role, count(*) FROM auth.users GROUP BY 1`,
    `SELECT role, count(*) FROM alert_subscribers GROUP BY role`
  ];

  for (const q of queries) {
    try {
      const { rows } = await client.query(q);
      console.log(`Result of ${q}:\n`, rows);
    } catch(e) {
      console.log(`Failed query ${q}:`, e.message);
    }
  }

  // Also count operators vs brokers
  try {
     const { rows: ops } = await client.query(`SELECT COUNT(*) as c FROM hc_real_operators`);
     console.log('operators:', ops[0].c);
  } catch(e) {}
  try {
    const { rows: brks } = await client.query(`SELECT COUNT(*) as c FROM hc_brokers`);
    console.log('brokers:', brks[0].c);
  } catch(e) {}

  await client.end();
}

run().catch(console.error);
