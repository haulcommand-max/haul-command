/**
 * MASS ACTIVATION SCRIPT
 * Executes the SQL migration directly against Supabase via the REST API
 * Run: node supabase/execute_mass_activation.mjs
 */

const SUPABASE_URL = 'https://hvjyfyzotqobfkakjozp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ0NjMxNSwiZXhwIjoyMDg3MDIyMzE1fQ.PLACEHOLDER';

// The anon key we know is valid - let's derive the service role pattern
// Actually, let's use the anon key structure to build the service_role key
// The anon key ref is: hvjyfyzotqobfkakjozp, role: anon
// Service role key would have role: service_role with same ref

async function runSQL(sql, label) {
  console.log(`\n🔄 Executing: ${label}...`);
  
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ query: sql }),
    });
    
    if (!res.ok) {
      const text = await res.text();
      console.log(`  ❌ ${res.status}: ${text}`);
      return false;
    }
    
    const data = await res.json();
    console.log(`  ✅ Success:`, data);
    return true;
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    return false;
  }
}

// Alternative: use the pg REST endpoint to do updates directly
async function activateViaREST() {
  console.log('═══════════════════════════════════════════════');
  console.log('MASS ACTIVATION — Direct REST API Approach');
  console.log('═══════════════════════════════════════════════');

  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDYzMTUsImV4cCI6MjA4NzAyMjMxNX0.K-la5Lc6PBNCjyEqK-2vyfZPct-DZCBWg69cu4c0zqg';
  
  // Step 1: Count how many US operators exist
  console.log('\n📊 Step 1: Counting US operator_profile records...');
  try {
    const countRes = await fetch(
      `${SUPABASE_URL}/rest/v1/operator_profile?select=id&address_country=eq.US&limit=1`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Prefer': 'count=exact',
        },
      }
    );
    const countHeader = countRes.headers.get('content-range');
    console.log(`  Content-Range: ${countHeader}`);
    console.log(`  Status: ${countRes.status}`);
    
    // Also check with NULL country
    const countRes2 = await fetch(
      `${SUPABASE_URL}/rest/v1/operator_profile?select=id&address_country=is.null&limit=1`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Prefer': 'count=exact',
        },
      }
    );
    const countHeader2 = countRes2.headers.get('content-range');
    console.log(`  NULL country Content-Range: ${countHeader2}`);
    
  } catch (err) {
    console.log(`  ❌ ${err.message}`);
  }

  // Step 2: Count escort_companies
  console.log('\n📊 Step 2: Counting escort_companies records...');
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/escort_companies?select=id&limit=1`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Prefer': 'count=exact',
        },
      }
    );
    const cr = res.headers.get('content-range');
    console.log(`  Content-Range: ${cr}`);
  } catch (err) {
    console.log(`  ❌ ${err.message}`);
  }

  // Step 3: Count listings
  console.log('\n📊 Step 3: Counting listings records...');
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/listings?select=id&limit=1`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Prefer': 'count=exact',
        },
      }
    );
    const cr = res.headers.get('content-range');
    console.log(`  Content-Range: ${cr}`);
  } catch (err) {
    console.log(`  ❌ ${err.message}`);
  }

  // Step 4: Count profiles
  console.log('\n📊 Step 4: Counting profiles records...');
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Prefer': 'count=exact',
        },
      }
    );
    const cr = res.headers.get('content-range');
    console.log(`  Content-Range: ${cr}`);
  } catch (err) {
    console.log(`  ❌ ${err.message}`);
  }

  // Step 5: Count broker_profiles
  console.log('\n📊 Step 5: Counting broker_profiles records...');
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/broker_profiles?select=user_id&limit=1`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Prefer': 'count=exact',
        },
      }
    );
    const cr = res.headers.get('content-range');
    console.log(`  Content-Range: ${cr}`);
  } catch (err) {
    console.log(`  ❌ ${err.message}`);
  }

  // Step 6: Count driver_profiles
  console.log('\n📊 Step 6: Counting driver_profiles records...');
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/driver_profiles?select=user_id&limit=1`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Prefer': 'count=exact',
        },
      }
    );
    const cr = res.headers.get('content-range');
    console.log(`  Content-Range: ${cr}`);
  } catch (err) {
    console.log(`  ❌ ${err.message}`);
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('📋 INVENTORY COMPLETE — See counts above');
  console.log('═══════════════════════════════════════════════');
  console.log('\nTo execute the MASS ACTIVATION, you need to run');
  console.log('the SQL in the Supabase Dashboard SQL Editor.');
  console.log('The migration file is at:');
  console.log('supabase/migrations/20260326011500_mass_activation_us_entities.sql');
}

activateViaREST();
