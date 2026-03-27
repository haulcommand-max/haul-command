const { Client } = require('pg');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l => {
  const [k,...v] = l.split('='); if(k&&v.length) env[k.trim()] = v.join('=').trim();
});const client = new Client({ connectionString: env['SUPABASE_DB_POOLER_URL'] });
async function check() {
  await client.connect();
  const res1 = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'hc_surfaces';`);
  console.log('hc_surfaces:', res1.rows.map(r=>r.column_name).join(', '));
  const res2 = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'hc_entity';`);
  console.log('hc_entity:', res2.rows.map(r=>r.column_name).join(', '));
  await client.end();
}
check().catch(console.error);
