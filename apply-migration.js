const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const sqlParam = fs.readFileSync(path.join(__dirname, 'supabase', 'migrations', '20260412_wave3_typesense_sync_triggers.sql'), 'utf8');
  try {
    await client.query(sqlParam);
    console.log('Migration Applied');
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
