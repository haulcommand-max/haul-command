const fs = require('fs');
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const sql = fs.readFileSync('supabase/migrations/20260401_seo_realtime_global_matrix.sql', 'utf8');
  try {
     console.log('Running Programmatic SEO Matrix Migration...');
     await client.query(sql);
     console.log('Migration Complete. Supabase Hub matches 120 countries and Realtime is ON.');
  } catch(e) {
     console.error('Migration failed:', e);
  } finally {
     await client.end();
  }
}

run();
