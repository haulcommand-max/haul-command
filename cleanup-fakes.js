const { Client } = require('pg');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l => {
  const [k,...v] = l.split('='); if(k&&v.length) env[k.trim()] = v.join('=').trim();
});
const client = new Client({ connectionString: env['SUPABASE_DB_POOLER_URL'] });

async function check() {
  await client.connect();
  
  // 1. Delete fake simulations
  let res = await client.query(`
    DELETE FROM hc_surfaces 
    WHERE source_system IN ('global_matrix_simulation', 'ai_matrix_simulation');
  `);
  console.log('Deleted fake surfaces:', res.rowCount);
  
  // 2. Search for the UK/Australia company CANONBIE1
  res = await client.query(`
    SELECT id, name, slug, source, entity_type FROM directory_listings 
    WHERE name ILIKE '%CANONBIE%' OR name ILIKE '%SQI Civil%'
  `);
  console.log('Entities matching CANONBIE or SQI:');
  console.log(res.rows);

  await client.end();
}

check().catch(console.error);
