const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL, ssl: { rejectUnauthorized: false } });
client.connect().then(() => client.query("DELETE FROM _migration_log WHERE status = 'failed'")).then(() => { console.log('Cleared failed log state.'); process.exit(0); });
