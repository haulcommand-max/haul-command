const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres' });
async function run() {
  await client.connect();
  
  // Contacts table breakdown by columns
  try {
     const { rows } = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'contacts'`);
     console.log('Columns in contacts table:', rows.map(r => r.column_name).join(', '));
     
     // Let's assume there's a type, role, or position column
     const hasType = rows.some(r => r.column_name === 'type');
     const hasRole = rows.some(r => r.column_name === 'role');
     const hasPosition = rows.some(r => r.column_name === 'position');
     const hasState = rows.some(r => r.column_name === 'state');
     const hasLocation = rows.some(r => r.column_name === 'location');

     let groupCol = hasPosition ? 'position' : (hasType ? 'type' : (hasRole ? 'role' : null));
     
     if (groupCol) {
       const { rows: grouped } = await client.query(`SELECT ${groupCol}, count(*) as c FROM contacts GROUP BY ${groupCol}`);
       console.log('Groups by', groupCol, ':', grouped);
     } else {
       console.log('No groupable column like type, role, position found in contacts.');
     }

     // Are they in their proper places? -> Count how many are missing locations/states
     let locCol = hasState ? 'state' : (hasLocation ? 'location' : null);
     if (locCol) {
       const { rows: locs } = await client.query(`SELECT COUNT(*) as c FROM contacts WHERE ${locCol} IS NULL OR ${locCol} = ''`);
       console.log(`Contacts missing ${locCol}: ${locs[0].c}`);
     } else {
       console.log('No location column found like state, location');
     }
  } catch(e) { console.error('Error contacts:', e.message); }

  await client.end();
}
run().catch(console.error);
