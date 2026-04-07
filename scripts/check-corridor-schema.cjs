const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function run() {
  const { Client } = require('pg');
  const client = new Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL });
  await client.connect();

  // Get actual columns of hc_corridors
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'hc_corridors' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  console.log('=== hc_corridors columns ===');
  cols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}) ${r.is_nullable === 'NO' ? 'NOT NULL' : ''} ${r.column_default ? 'DEFAULT ' + r.column_default.substring(0,40) : ''}`));

  // Check what's there
  const rowCount = await client.query(`SELECT count(*) FROM public.hc_corridors`);
  console.log(`\nRow count: ${rowCount.rows[0].count}`);

  // Sample data
  const sample = await client.query(`SELECT * FROM public.hc_corridors LIMIT 2`);
  if (sample.rows.length > 0) {
    console.log('\nSample row keys:', Object.keys(sample.rows[0]));
    console.log('Sample:', JSON.stringify(sample.rows[0]).substring(0, 500));
  }

  await client.end();
}

run().catch(err => { console.error(err.message); process.exit(1); });
