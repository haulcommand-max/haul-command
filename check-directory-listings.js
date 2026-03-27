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

  // Full schema of directory_listings
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'directory_listings'
    ORDER BY ordinal_position;
  `);
  console.log("directory_listings columns:");
  cols.rows.forEach(r => console.log(` - ${r.column_name}: ${r.data_type} | nullable: ${r.is_nullable} | default: ${r.column_default?.substring(0,40) ?? 'none'}`));

  // How many are is_visible = true vs false
  const vis = await client.query(`
    SELECT is_visible, COUNT(*) FROM directory_listings GROUP BY is_visible;
  `);
  console.log("\nVisibility breakdown:", vis.rows);

  // Sample of non-visible
  const sample = await client.query(`
    SELECT id, name, city, region_code, entity_type, is_visible, rank_score 
    FROM directory_listings 
    WHERE is_visible = false 
    LIMIT 3;
  `);
  console.log("\nSample non-visible rows:", sample.rows);

  // Sample of visible
  const vis_sample = await client.query(`
    SELECT id, name, city, region_code, entity_type, is_visible, rank_score 
    FROM directory_listings 
    WHERE is_visible = true 
    LIMIT 3;
  `);
  console.log("\nSample visible rows:", vis_sample.rows);

  await client.end();
}

check().catch(e => console.error(e));
