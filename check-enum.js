const { Client } = require('pg');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l => {
  const [k,...v] = l.split('='); if(k && v.length) env[k.trim()] = v.join('=').trim();
});
const c = new Client({ connectionString: env['SUPABASE_DB_POOLER_URL'] });
c.connect()
  .then(() => c.query("SELECT unnest(enum_range(NULL::source_type))::text as val"))
  .then(r => { console.log('source_type values:', r.rows.map(x => x.val)); return c.end(); })
  .catch(e => console.error(e));
