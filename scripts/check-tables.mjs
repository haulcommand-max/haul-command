// Check jobs table columns and run migration if needed
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hvjyfyzotqobfkakjozp.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function query(sql) {
  const res = await fetch(`${url}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  return { status: res.status, body: await res.text() };
}

async function checkTable(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
    },
  });
  const hdrs = Object.fromEntries(res.headers.entries());
  return { status: res.status, contentRange: hdrs['content-range'] };
}

async function main() {
  console.log('=== Checking current state ===');
  
  // Check jobs table
  const jobs = await checkTable('jobs');
  console.log('jobs table:', jobs.status === 200 ? 'EXISTS' : `status ${jobs.status}`);
  
  // Check job_payouts table
  const payouts = await checkTable('job_payouts');
  console.log('job_payouts table:', payouts.status === 200 ? 'EXISTS' : `status ${payouts.status}`);
  
  // Check job_reviews table  
  const reviews = await checkTable('job_reviews');
  console.log('job_reviews table:', reviews.status === 200 ? 'EXISTS' : `status ${reviews.status}`);
  
  // Check notifications table
  const notifs = await checkTable('notifications');
  console.log('notifications table:', notifs.status === 200 ? 'EXISTS' : `status ${notifs.status}`);

  // Check if payment_status column already exists on jobs
  const colCheck = await fetch(`${url}/rest/v1/jobs?select=payment_status&limit=0`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
  });
  console.log('jobs.payment_status column:', colCheck.status === 200 ? 'EXISTS' : 'MISSING (need migration)');
}

main().catch(e => console.error(e));
