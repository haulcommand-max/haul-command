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
  
  // Find all triggers on providers table
  const triggers = await client.query(`
    SELECT trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'providers' AND event_object_schema = 'public'
    ORDER BY trigger_name;
  `);
  console.log("Triggers on providers:");
  triggers.rows.forEach(t => console.log(' -', t.trigger_name, '|', t.event_manipulation, '|', t.action_statement.substring(0, 100)));
  
  // Check the sitemap_urls table structure  
  const sitemap = await client.query(`
    SELECT column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sitemap_urls'
    ORDER BY ordinal_position;
  `);
  console.log("\nsitemap_urls columns:");
  sitemap.rows.forEach(r => console.log(' -', r.column_name, '| nullable:', r.is_nullable, '| default:', r.column_default?.substring(0, 40)));
  
  await client.end();
}

check().catch(e => console.error(e));
