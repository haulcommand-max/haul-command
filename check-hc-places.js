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

  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'hc_places'
    ORDER BY ordinal_position;
  `);
  console.log("hc_places columns:");
  cols.rows.forEach(r => console.log(` - ${r.column_name}: ${r.data_type} | nullable: ${r.is_nullable} | default: ${r.column_default?.substring(0,60) ?? 'REQUIRED'}`));

  // Status breakdown
  const status = await client.query(`SELECT status, COUNT(*) FROM hc_places GROUP BY status;`);
  console.log("\nStatus breakdown:", status.rows);

  // Sample published row
  const sample = await client.query(`SELECT * FROM hc_places WHERE status='published' LIMIT 1;`);
  console.log("\nSample published row:", JSON.stringify(sample.rows[0], null, 2));

  // Check for unique constraint index  
  const idx = await client.query(`
    SELECT indexname, indexdef FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = 'hc_places';
  `);
  console.log("\nIndexes:", idx.rows.map(r => r.indexname + ': ' + r.indexdef.substring(0,80)));

  await client.end();
}

check().catch(e => console.error(e));
