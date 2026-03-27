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

  // Replicate EXACTLY what the listings API does
  // SELECT * FROM listings WHERE active = true (i.e. is_visible = true from directory_listings)
  const total = await client.query(`SELECT COUNT(*) FROM listings WHERE active = true;`);
  console.log("listings WHERE active=true:", total.rows[0].count);

  // What does the phone probably see? Check if there's a hc_places or vendors
  const hcplaces = await client.query(`SELECT COUNT(*) FROM hc_places;`).catch(() => ({ rows: [{ count: 'TABLE MISSING' }] }));
  console.log("hc_places count:", hcplaces.rows[0].count);

  // The 1,397 might be coming from vendors table
  const vendors = await client.query(`SELECT COUNT(*) FROM vendors;`).catch(() => ({ rows: [{ count: 'TABLE MISSING' }] }));
  console.log("vendors count:", vendors.rows[0].count);

  // Check if there's a different directory endpoint for mobile
  // entity_type breakdown in directory_listings
  const types = await client.query(`
    SELECT entity_type, COUNT(*) as cnt 
    FROM directory_listings 
    WHERE is_visible = true
    GROUP BY entity_type 
    ORDER BY cnt DESC 
    LIMIT 15;
  `);
  console.log("\nEntity types in directory_listings (is_visible=true):");
  types.rows.forEach(r => console.log(` - ${r.entity_type}: ${r.cnt}`));

  // What entity types are showing on mobile — check hc_places  
  const hcplaces_columns = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'hc_places'
    LIMIT 10;
  `).catch(() => ({ rows: [] }));
  console.log("\nhc_places columns:", hcplaces_columns.rows.map(r => r.column_name));

  // Check what the old /api/directory endpoint does (not /api/directory/listings)
  const vendors_sample = await client.query(`
    SELECT id, business_name, city, state, is_active FROM vendors LIMIT 3;
  `).catch(e => ({ rows: [{ error: e.message }] }));
  console.log("\nvendors sample:", vendors_sample.rows);

  await client.end();
}

check().catch(e => console.error(e));
