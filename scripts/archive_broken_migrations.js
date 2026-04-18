const fs = require('fs');
const path = require('path');
const pg = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_POOLER_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const res = await client.query("SELECT filename FROM _migration_log WHERE status = 'failed'");
  console.log('Found failed files:', res.rowCount);
  
  if (!fs.existsSync('supabase/_archived_broken_migrations')) {
    fs.mkdirSync('supabase/_archived_broken_migrations');
  }

  for (const row of res.rows) {
    const file = row.filename;
    const src = path.join('supabase/migrations', file);
    const dest = path.join('supabase/_archived_broken_migrations', file);
    if (fs.existsSync(src)) {
      fs.renameSync(src, dest);
      console.log('Moved:', file);
    }
  }
  
  await client.query("DELETE FROM _migration_log WHERE status = 'failed'");
  console.log('Cleared failed log state.');
  
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
