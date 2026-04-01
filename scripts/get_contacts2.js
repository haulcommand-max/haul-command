const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hvjyfyzotqobfkakjozp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ0NjMxNSwiZXhwIjoyMDg3MDIyMzE1fQ.xG-oo7qSFevW1JO9GVwd005ZXAMht86_C7P8RRHJ938';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  global: {
    headers: {
      'x-supabase-schema': 'public'
    }
  }
});

async function checkTable(tableName) {
  const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
  if (error) {
    if (error.code === '42P01') { // relation does not exist
       // Ignore quietly or log "doesn't exist"
    } else {
       console.log(`Error checking ${tableName}:`, error.message);
    }
  } else {
    console.log(`Table ${tableName}: ${count} contacts/records`);
  }
}

async function run() {
  console.log("Fetching counts...");
  
  await checkTable('hc_real_operators');
  await checkTable('hc_real_brokers');  
  await checkTable('hc_brokers');  
  await checkTable('alert_subscribers');
  
  // also get roles inside hc_real_operators?
  // usually brokers might be in hc_real_operators with a role, or in a separate table
  const { data: cols } = await supabase.from('hc_real_operators').select('role').limit(1).catch(() => ({data: null}));
  if (cols) {
    console.log("Operators table has role column?");
  }
  
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (users) {
      console.log(`Auth Users count: ${users.length}`);
  }
}

run();
