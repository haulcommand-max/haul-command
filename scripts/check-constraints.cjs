const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL, ssl: { rejectUnauthorized: false } });
client.connect().then(async () => {
  try {
    const chk = await client.query(`
      SELECT pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_class r ON r.oid = c.conrelid
      WHERE r.relname = 'hc_training_courses' AND c.contype = 'c'
    `);
    console.log('Constraints:', chk.rows);
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
