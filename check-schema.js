const { Client } = require('pg');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const client = new Client({ connectionString: env['SUPABASE_DB_POOLER_URL'] });

async function check() {
  await client.connect();
  
  // Check if provider_directory exists
  const res1 = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'provider_directory'
    ORDER BY ordinal_position;
  `);
  
  console.log("provider_directory columns:", res1.rows.length ? res1.rows.map(r => r.column_name + ':' + r.data_type).join(', ') : 'TABLE DOES NOT EXIST');
  
  // Check providers table actual structure
  const res2 = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'providers'
    ORDER BY ordinal_position;
  `);
  console.log("providers columns:", res2.rows.map(r => r.column_name + ':' + r.data_type).join(', '));
  
  // Count of existing providers
  const res3 = await client.query(`SELECT COUNT(*) as count FROM providers;`);
  console.log("Existing providers count:", res3.rows[0].count);
  
  await client.end();
}

check().catch(e => { console.error(e); process.exit(1); });
