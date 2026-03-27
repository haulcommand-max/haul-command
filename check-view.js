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

  // Get the full view definition
  const viewDef = await client.query(`
    SELECT view_definition FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'listings';
  `);
  console.log("=== LISTINGS VIEW DEFINITION ===");
  console.log(viewDef.rows[0]?.view_definition);

  // Also find what tables have data that could be the source
  const tables = await client.query(`
    SELECT schemaname, tablename, 
           pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 20;
  `);
  console.log("\n=== TOP TABLES BY SIZE ===");
  tables.rows.forEach(r => console.log(` - ${r.tablename}: ${r.size}`));

  await client.end();
}

check().catch(e => console.error(e));
