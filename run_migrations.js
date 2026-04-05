const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const dbUrl = 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log('Connected to DB.');

    // Create migration tracking table if it doesn't exist
    await client.query(`
      create table if not exists public.schema_migrations (
        filename text primary key,
        applied_at timestamptz default now()
      );
    `);

    const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    // Get already-applied migrations
    const { rows: applied } = await client.query('select filename from public.schema_migrations');
    const appliedSet = new Set(applied.map(r => r.filename));

    const pending = files.filter(f => !appliedSet.has(f));

    if (pending.length === 0) {
      console.log('All migrations already applied. Nothing to do.');
      return;
    }

    console.log(`Found ${pending.length} pending migration(s):`);
    console.log(pending.join('\n'));

    for (const file of pending) {
      console.log(`\n=> Applying ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('insert into public.schema_migrations (filename) values ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✓ successfully applied ${file}.`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`X Error applying ${file}:`, err.message);
        throw err;
      }
    }

    console.log('\nAll pending migrations applied successfully!');
  } catch (err) {
    console.error('\nFailed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
