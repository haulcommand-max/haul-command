const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres' });
client.connect()
  .then(() => client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';`))
  .then(res => { 
    console.log('profiles columns:', res.rows.map(r=>r.column_name).join(', '));
    return client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'hc_global_operators';`); 
  })
  .then(res => { 
    console.log('hc_global_operators columns:', res.rows.map(r=>r.column_name).join(', '));
    return client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'listings';`);
  })
  .then(res => { 
    console.log('listings columns:', res.rows.map(r=>r.column_name).join(', '));
    client.end(); 
  }).catch(e => { console.error(e); client.end(); });
