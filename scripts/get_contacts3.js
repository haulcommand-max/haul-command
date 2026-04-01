const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hvjyfyzotqobfkakjozp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ0NjMxNSwiZXhwIjoyMDg3MDIyMzE1fQ.xG-oo7qSFevW1JO9GVwd005ZXAMht86_C7P8RRHJ938';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

async function checkTable(tableName) {
  try {
     const { count } = await supabase.from(tableName).select('id', { count: 'exact', head: true });
     console.log(`Table ${tableName} count: ${count}`);
  } catch (e) {
     console.log(`Error checking ${tableName}:`, e.message);
  }
}

async function run() {
  console.log("Checking tables...");
  
  await checkTable('hc_real_operators');
  await checkTable('hc_real_brokers');  
  await checkTable('hc_brokers');  
  await checkTable('alert_subscribers');
  await checkTable('community_memberships');
  await checkTable('auth.users');
  await checkTable('users');
  await checkTable('profiles');
  await checkTable('operator_profiles');
  await checkTable('broker_profiles');
  await checkTable('contacts');

  // get specific roles from alert_subscribers
  try {
     const res2 = await supabase.from('alert_subscribers').select('role');
     if (res2.data) {
        const roles = res2.data.reduce((a, b) => { a[b.role] = (a[b.role] || 0) + 1; return a; }, {});
        console.log("Roles from alert_subscribers:", roles);
     }
  } catch(e) {}
}

run();
