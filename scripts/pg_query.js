const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  console.log("Connected to PostgreSQL using pg pooler.");

  // Get table names related to contacts
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND (table_name ILIKE '%contact%' 
        OR table_name ILIKE '%user%' 
        OR table_name ILIKE '%broker%' 
        OR table_name ILIKE '%operator%'
        OR table_name ILIKE '%subscriber%')
  `);
  
  const tables = res.rows.map(r => r.table_name);
  console.log("Candidate Tables:", tables);

  // For each candidate, get count
  for (const t of tables) {
    try {
      const { rows } = await client.query(`SELECT COUNT(*) as c FROM ${t}`);
      console.log(`Table ${t} count: ${rows[0].c}`);
    } catch(e) {
      console.log(`Failed to count ${t}: ${e.message}`);
    }
  }

  // Look for auth.users
  try {
    const { rows } = await client.query('SELECT COUNT(*) as c FROM auth.users');
    console.log(`Table auth.users count: ${rows[0].c}`);
    
    // Check if roles exist
    const { rows: roles } = await client.query(`SELECT raw_user_meta_data->>'role' as role, count(*) FROM auth.users GROUP BY 1`);
    console.log('auth.users roles:', roles);
  } catch(e) {
    console.log(`auth.users count failed: ${e.message}`);
  }

  // Look at alert_subscribers role breakdown
  if (tables.includes('alert_subscribers')) {
    try {
      const { rows } = await client.query(`SELECT role, count(*) FROM alert_subscribers GROUP BY role`);
      console.log('alert_subscribers roles:', rows);
    } catch(e) {}
  }

  await client.end();
}

run().catch(console.error);
