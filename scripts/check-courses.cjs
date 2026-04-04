const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL, ssl: { rejectUnauthorized: false } });
client.connect().then(async () => {
  try {
    const res = await client.query(`SELECT slug, issuer_id, credential_type_id FROM hc_training_courses LIMIT 5`);
    console.log('Courses:', res.rows);
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
