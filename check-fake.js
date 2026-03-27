const { Client } = require('pg');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l => {
  const [k,...v] = l.split('='); if(k&&v.length) env[k.trim()] = v.join('=').trim();
});
const client = new Client({ connectionString: env['SUPABASE_DB_POOLER_URL'] });

async function check() {
  await client.connect();
  
  console.log('--- Checking directory_listings for potential fake data ---');
  const res = await client.query(`
    SELECT id, name, entity_type, city, state, phone, source_system 
    FROM directory_listings 
    ORDER BY created_at DESC 
    LIMIT 20;
  `).catch(e => {
    console.log('Error querying directory_listings:', e.message);
    return { rows: [] };
  });

  console.log('Recent 20 listings in directory_listings:');
  res.rows.forEach(r => console.log(JSON.stringify(r)));

  console.log('\n--- Checking for "matrix" or fake patterns ---');
  // Look for our specific "Escort <ID> Pilot Car" pattern or similar
  const patternMatch = await client.query(`
    SELECT COUNT(*) 
    FROM directory_listings 
    WHERE name LIKE 'Escort % Pilot Car' OR name LIKE 'Traffic % Flagging'
  `).catch(e => ({rows: [{count: 0}]}));
  console.log(`Listings matching fake patterns: ${patternMatch.rows[0].count}`);

  await client.end();
}

check().catch(console.error);
