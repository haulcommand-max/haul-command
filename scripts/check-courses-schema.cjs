const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL, ssl: { rejectUnauthorized: false } });
client.connect().then(async () => {
  try {
    const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hc_training_courses' ORDER BY ordinal_position`);
    console.log('Columns:', res.rows.map(r => r.column_name));
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
