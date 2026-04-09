require('dotenv').config({path: '.env.local'});
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const DB = 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

async function apply(file) {
  const c = new Client({ connectionString: DB });
  await c.connect();
  const sql = fs.readFileSync(path.join('supabase', 'migrations', file), 'utf8');
  try {
    await c.query(sql);
    console.log(`✓ ${file}`);
  } catch(e) {
    console.error(`✗ ${file}: ${e.message}`);
    throw e;
  } finally {
    await c.end();
  }
}

apply('20260408_013_glossary_haul_command.sql').catch(() => process.exit(1));
