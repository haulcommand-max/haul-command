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

  // Count listings
  const cnt = await client.query(`SELECT COUNT(*) FROM listings;`);
  console.log("Total listings:", cnt.rows[0].count);

  // Listings table columns
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'listings'
    ORDER BY ordinal_position;
  `);
  console.log("\nlistings columns:");
  cols.rows.forEach(r => console.log(` - ${r.column_name}: ${r.data_type} | nullable: ${r.is_nullable}`));

  // Sample rows
  const sample = await client.query(`SELECT id, full_name, city, state, active, rank_score, claimed FROM listings LIMIT 3;`);
  console.log("\nSample rows:", sample.rows);

  // Check if listings is a view or table
  const type = await client.query(`
    SELECT table_type FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'listings';
  `);
  console.log("\nlistings type:", type.rows[0]?.table_type);

  await client.end();
}

check().catch(e => console.error(e));
