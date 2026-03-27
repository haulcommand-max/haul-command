const { Client } = require('pg');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l => {
  const [k,...v] = l.split('='); if(k&&v.length) env[k.trim()] = v.join('=').trim();
});const client = new Client({ connectionString: env['SUPABASE_DB_POOLER_URL'] });
async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT pg_get_viewdef('directory_listings');
  `);
  console.log(res.rows[0].pg_get_viewdef);
  await client.end();
}
check().catch(console.error);
