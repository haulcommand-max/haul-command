const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hvjyfyzotqobfkakjozp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ0NjMxNSwiZXhwIjoyMDg3MDIyMzE1fQ.xG-oo7qSFevW1JO9GVwd005ZXAMht86_C7P8RRHJ938';

async function fetchTableCount(tableName) {
  const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=id`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'count=exact'
      }
    });

    if (res.ok) {
      const count = res.headers.get('content-range');
      console.log(`Table ${tableName}: count header -> ${count}`);
    } else {
      console.log(`Error on ${tableName}: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.log(text);
    }
  } catch(e) {
    console.log(`Failed to fetch ${tableName}`, e);
  }
}

async function run() {
  await fetchTableCount('hc_real_operators');
  await fetchTableCount('brokers');
  await fetchTableCount('hc_brokers');
  await fetchTableCount('operator_profiles');
  await fetchTableCount('broker_profiles');
  await fetchTableCount('alert_subscribers');
  await fetchTableCount('community_memberships');
  await fetchTableCount('hc_escorts');
  await fetchTableCount('contacts');
}
run();
