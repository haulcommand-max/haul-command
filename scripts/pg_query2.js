const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  console.log("Connected to PostgreSQL on port 5432.");

  const tables = [
    'hc_real_operators', 'hc_escorts', 'providers',
    'brokers', 'hc_brokers', 'alert_subscribers',
    'auth.users', 'contacts', 'operator_profiles'
  ];

  for (const t of tables) {
    try {
      const { rows } = await client.query(`SELECT COUNT(*) as c FROM ${t}`);
      console.log(`Table ${t} count: ${rows[0].c}`);
    } catch(e) {
      if (!e.message.includes('does not exist')) {
        console.log(`Failed to count ${t}: ${e.message}`);
      }
    }
  }

  // Find 'role' or 'position' inside whatever table exists
  try {
     const { rows } = await client.query('SELECT role, count(*) FROM alert_subscribers GROUP BY role');
     console.log('alert_subscribers roles:', rows);
  } catch(e) {}

  await client.end();
}

run().catch(console.error);
