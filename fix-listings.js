const { Client } = require('pg');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l => {
  const [k,...v] = l.split('='); if(k&&v.length) env[k.trim()] = v.join('=').trim();
});const client = new Client({ connectionString: env['SUPABASE_DB_POOLER_URL'] });
async function run() {
  await client.connect();
  // directory_listings might just be a base table, let's delete fake sources
  let res = await client.query(`
    DELETE FROM directory_listings WHERE source IN ('global_matrix_simulation', 'ai_matrix_simulation', 'pipeline_simulation');
  `);
  console.log('Deleted fake listings:', res.rowCount);
  
  // also un-publish unverified junk that we just noticed like "CANONBIE"
  res = await client.query(`
    UPDATE directory_listings SET is_visible = false 
    WHERE profile_completeness::numeric < 0.40 OR entity_confidence_score::numeric < 0.30;
  `).catch(e => { console.log('Err updating confidence:', e.message); return {rowCount: 0}; });
  
  console.log('Hid low confidence profiles:', res.rowCount);
  
  await client.end();
}
run().catch(console.error);
