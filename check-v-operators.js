const env = require('dotenv').config({path: '.env.local'}).parsed;
const { Client } = require('pg');
const c = new Client({ connectionString: env.SUPABASE_DB_POOLER_URL });
c.connect();
c.query("SELECT * from public.v_operators limit 1")
 .then(r => { console.log(r.rows[0]); c.end(); })
 .catch(e => { console.log(e); c.end(); });
