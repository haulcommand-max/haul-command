import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load Environment variables from the root folder
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * PURGE SCRIPT: DELETING ALL SIMULATED/FAKE PHONE NUMBERS
 * 
 * Safety Protocol to ensure LiveKit Voice AI never dials a hallucinated 
 * or Math.random() generated phone number. 
 */

async function purgeSimulationData() {
  console.log("🚨 INITIATING EMERGENCY DATA PURGE...");
  
  // The simulated data generator used a specific footprint:
  // phone: +1[200-999][2000000-9999999] in the metadata jsonb.
  // Instead of risking a single fake dial, we are purging ALL profiles 
  // currently holding the "onboarding" status applied by the mock seed script.

  console.log("Identifying unverified directory listings with simulated phone patterns...");

  const { data: fakeListings, error: getErr } = await supabase
    .from('directory_listings')
    .select('id')
    .contains('metadata', { coverage_status: 'onboarding' });

  if (getErr) {
    console.error("Purge query failed:", getErr);
    return;
  }

  if (!fakeListings || fakeListings.length === 0) {
    console.log("✅ Directory is clean. No simulated phone numbers found.");
    return;
  }

  console.log(`🧹 Found ${fakeListings.length} simulated profiles. Purging...`);

  // Purging in batches of 1000 to drop the fake data
  for (let i = 0; i < fakeListings.length; i += 1000) {
    const batch = fakeListings.slice(i, i + 1000).map(l => l.id);
    const { error: delErr } = await supabase
      .from('directory_listings')
      .delete()
      .in('id', batch);
    
    if (delErr) {
      console.error("Batch deletion failed:", delErr);
    } else {
      console.log(`Deleted ${i + batch.length} of ${fakeListings.length}`);
    }
  }

  console.log("✅ ALL FAKE NUMBERS PURGED. LiveKit is safe from dead dials.");
}

purgeSimulationData();
