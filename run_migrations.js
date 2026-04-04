const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const dbUrl = 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log('Connected to DB.');
    
    const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    
    // Find files matching 016 through 024 pattern
    const targetFiles = files.filter(f => {
      return (
        f.startsWith('20260404_016') ||
        f.startsWith('20260404_017') ||
        f.startsWith('20260404_018') ||
        f.startsWith('20260404_019') ||
        f.startsWith('20260404_020') ||
        f.startsWith('20260404_021') ||
        f.startsWith('20260404_022') ||
        f.startsWith('20260404_023') ||
        f.startsWith('20260404_024')
      );
    });

    console.log(`Found ${targetFiles.length} migration files to apply:`);
    console.log(targetFiles.join('\n'));

    for (const file of targetFiles) {
      console.log(`\n=> Applying ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`✓ successfully applied ${file}.`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`X Error applying ${file}:`, err.message);
        throw err;
      }
    }
    
    console.log('\nAll migrations applied successfully!');
  } catch (err) {
    console.error('\nFailed:', err.message);
  } finally {
    await client.end();
  }
}

run();
