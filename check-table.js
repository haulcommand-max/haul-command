const { Client } = require('pg');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l => {
  const [k,...v] = l.split('='); if(k&&v.length) env[k.trim()] = v.join('=').trim();
});const client = new Client({ connectionString: env['SUPABASE_DB_POOLER_URL'] });
async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT table_type FROM information_schema.tables WHERE table_name = 'directory_listings';
  `);
  console.log(res.rows);
  const res2 = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'directory_listings';
  `);
  console.log('directory_listings:', res2.rows.map(r=>r.column_name).join(', '));
  await client.end();
}
check().catch(console.error);
