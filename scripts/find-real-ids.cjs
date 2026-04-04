const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL, ssl: { rejectUnauthorized: false } });
client.connect().then(async () => {
  try {
    const types = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%credential%' AND table_schema = 'public'`);
    console.log('Credential tables:', types.rows.map(r => r.table_name));

    if (types.rows.some(r => r.table_name === 'hc_credential_types')) {
      const c = await client.query(`SELECT id, name FROM hc_credential_types LIMIT 5`);
      console.log('hc_credential_types:', c.rows);
    }
    
    // Find an admin user or any user to use as issuer
    const users = await client.query(`SELECT id, email FROM auth.users LIMIT 5`);
    console.log('Users:', users.rows);
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
