const env = require('dotenv').config({path: '.env.local'}).parsed;
const { Client } = require('pg');
const c = new Client({ connectionString: env.SUPABASE_DB_POOLER_URL });
c.connect();
c.query("SELECT pg_get_viewdef('public.v_directory_publishable', true) AS view_def")
 .then(r => { console.log(r.rows[0].view_def); c.end(); })
 .catch(e => { console.log(e); c.end(); });
