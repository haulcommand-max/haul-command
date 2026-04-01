const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hvjyfyzotqobfkakjozp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ0NjMxNSwiZXhwIjoyMDg3MDIyMzE1fQ.xG-oo7qSFevW1JO9GVwd005ZXAMht86_C7P8RRHJ938';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("Fetching contacts data...");
  let contacts = [];

  // Try alert_subscribers
  const { data: subscribers, error: errSub } = await supabase.from('alert_subscribers').select('role, email');
  if (subscribers && subscribers.length > 0) {
      console.log(`Found ${subscribers.length} alert_subscribers`);
      const roles = subscribers.reduce((acc, curr) => {
          acc[curr.role] = (acc[curr.role] || 0) + 1;
          return acc;
      }, {});
      console.log('Subscriber roles:', roles);
  } else {
      console.log('No alert_subscribers found or error:', errSub?.message);
  }

  // Find all tables that might be contacts
  const { data: tables, error: errTables } = await supabase.rpc('exec_sql', { sql: `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name in ('users', 'profiles', 'contacts', 'hc_real_operators', 'brokers', 'hc_real_brokers')
  ` });
  
  if (tables) {
      console.log("Tables found:", tables.map(t => t.table_name));
      for (let t of tables) {
          const { count, error } = await supabase.from(t.table_name).select('*', { count: 'exact', head: true });
          console.log(`Table ${t.table_name} has ${count} records`);
      }
  } else if (errTables) {
      console.log("Could not query tables. Error:", errTables.message);
  }

  // Also query users (auth.users)
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (users) {
      console.log(`Found ${users.length} auth.users`);
      // check their user_metadata roles
      const userRoles = users.reduce((acc, curr) => {
          const role = curr.user_metadata?.role || 'no_role_specified';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
      }, {});
      console.log("auth.users roles:", userRoles);
      
      const userType = users.reduce((acc, curr) => {
          const type = curr.user_metadata?.user_type || 'no_type_specified';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
      }, {});
      console.log("auth.users user_type:", userType);
  } else {
      console.log("Could not query auth.users:", error?.message);
  }
}

run();
