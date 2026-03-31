const https = require('https');
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDYzMTUsImV4cCI6MjA4NzAyMjMxNX0.K-la5Lc6PBNCjyEqK-2vyfZPct-DZCBWg69cu4c0zqg';

const tests = [
  {table: 'companies', expect: 'BLOCKED'},
  {table: 'users', expect: 'BLOCKED'},
  {table: 'hc_dictionary', expect: 'BLOCKED'},
  {table: 'lb_claim_queue', expect: 'BLOCKED'},
  {table: 'lb_ingestion_batches', expect: 'BLOCKED'},
  {table: 'lb_reputation_observations', expect: 'BLOCKED'},
  {table: 'lb_observations', expect: 'FILTERED'},
  {table: 'jurisdictions', expect: 'PUBLIC'},
  {table: 'state_regulations', expect: 'PUBLIC'},
  {table: 'corridors', expect: 'PUBLIC'},
  {table: 'hc_places', expect: 'PUBLIC'},
  {table: 'global_countries', expect: 'PUBLIC'},
];

function testTable(t) {
  return new Promise(function(resolve) {
    const opts = {
      hostname: 'hvjyfyzotqobfkakjozp.supabase.co',
      port: 443,
      path: '/rest/v1/' + t.table + '?select=count&limit=1',
      headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
    };
    https.request(opts, function(res) {
      let d = '';
      res.on('data', function(c) { d += c; });
      res.on('end', function() {
        resolve({ table: t.table, expect: t.expect, status: res.statusCode, body: d });
      });
    }).end();
  });
}

async function main() {
  console.log('FINAL SECURITY AUDIT - Anonymous Access Test');
  console.log('============================================================');
  let pass = 0;
  let fail = 0;
  for (let i = 0; i < tests.length; i++) {
    const r = await testTable(tests[i]);
    const empty = r.body.includes('[]') || r.body.includes('"count":0');
    const blocked = r.status !== 200 || empty;
    
    if (r.expect === 'BLOCKED') {
      if (blocked) {
        console.log('LOCKED  | ' + r.table + ' -> blocked (HTTP ' + r.status + ')');
        pass++;
      } else {
        console.log('EXPOSED | ' + r.table + ' -> FAIL! ' + r.body.substring(0, 80));
        fail++;
      }
    } else if (r.expect === 'PUBLIC') {
      if (r.status === 200) {
        console.log('PUBLIC  | ' + r.table + ' -> readable');
        pass++;
      } else {
        console.log('WARN    | ' + r.table + ' -> not accessible (HTTP ' + r.status + ')');
        fail++;
      }
    } else {
      console.log('INFO    | ' + r.table + ' -> HTTP ' + r.status + ' ' + r.body.substring(0, 60));
      pass++;
    }
  }
  console.log('============================================================');
  console.log(pass + ' passed, ' + fail + ' failed');
}

main();
