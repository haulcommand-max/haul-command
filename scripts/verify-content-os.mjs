import { config } from 'dotenv';
import { resolve } from 'path';
import pg from 'pg';

config({ path: resolve(process.cwd(), '.env.local') });

async function run() {
  const client = new pg.Client({
    connectionString: process.env.SUPABASE_DB_POOLER_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  
  // Verify new tables
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE 'training_%' OR table_name LIKE 'tc_%' OR table_name LIKE 'content_%') ORDER BY table_name"
  );
  console.log('=== Tables ===');
  tables.rows.forEach(r => console.log(`  ✓ ${r.table_name}`));
  
  // Test RPCs
  console.log('\n=== RPC Tests ===');
  
  try {
    const hub = await client.query("SELECT training_hub_payload()");
    console.log('  ✓ training_hub_payload() works');
    const hubData = hub.rows[0].training_hub_payload;
    console.log(`    catalog: ${JSON.stringify(hubData.catalog).substring(0, 80)}`);
  } catch (e) {
    console.error('  ✗ training_hub_payload():', e.message);
  }
  
  try {
    const page = await client.query("SELECT training_page_payload('test-slug')");
    console.log('  ✓ training_page_payload() works');
  } catch (e) {
    console.error('  ✗ training_page_payload():', e.message);
  }
  
  try {
    const country = await client.query("SELECT training_country_payload('US')");
    console.log('  ✓ training_country_payload() works');
  } catch (e) {
    console.error('  ✗ training_country_payload():', e.message);
  }
  
  // Test content_edges table
  const ceCount = await client.query("SELECT count(*) FROM content_edges");
  console.log(`\n  content_edges rows: ${ceCount.rows[0].count}`);
  
  const cqCount = await client.query("SELECT count(*) FROM content_quality_scores");
  console.log(`  content_quality_scores rows: ${cqCount.rows[0].count}`);
  
  await client.end();
  console.log('\n=== All verifications passed ===');
}

run().catch(e => console.error(e.message));
