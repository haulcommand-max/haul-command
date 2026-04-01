const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres' });
async function run() {
  await client.connect();
  
  try {
     const { rows: r1 } = await client.query(`SELECT COUNT(*) as c FROM contacts_enriched`);
     console.log('contacts_enriched count:', r1[0].c);
     
     const { rows: r2 } = await client.query(`SELECT "position", count(*) as count FROM contacts_enriched GROUP BY "position"`);
     console.log('contacts_enriched positions:', r2);
  } catch(e) { console.error('Error contacts_enriched:', e.message); }

  try {
    const { rows: s1 } = await client.query(`SELECT COUNT(*) as c FROM contacts_enriched WHERE location IS NULL OR location = '' OR state IS NULL`);
    console.log('contacts_enriched no proper places count:', s1[0].c);
  } catch(e) { }

  try {
     const { rows: cols } = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'contacts_enriched'`);
     console.log('Columns in contacts_enriched table:', cols.map(r => r.column_name).join(', '));
  } catch(e) {}

  await client.end();
}
run().catch(console.error);
