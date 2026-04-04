const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL, ssl: { rejectUnauthorized: false } });
client.connect().then(async () => {
  try {
    const res = await client.query(`
      UPDATE hc_training_courses
      SET 
        issuer_id = '00000000-0000-0000-0000-000000000101',
        credential_type_id = '1d3c98ae-ea5e-44ce-b64f-f6d3f8d8c323'
      WHERE 
        issuer_id = '00000000-0000-0000-0000-000000000001'
        AND credential_type_id = '00000000-0000-0000-0000-000000000002'
    `);
    console.log('Updated courses:', res.rowCount);
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
