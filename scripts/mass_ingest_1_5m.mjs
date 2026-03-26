/**
 * HAUL COMMAND: DIRECT SQL INGESTION VIA SUPABASE
 * Executes mass ingestion SQL directly against the live database
 * using the Supabase Management API SQL endpoint.
 */

const SUPABASE_URL = 'https://hvjyfyzotqobfkakjozp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ0NjMxNSwiZXhwIjoyMDg3MDIyMzE1fQ.xG-oo7qSFevW1JO9GVwd005ZXAMht86_C7P8RRHJ938';

const CATEGORIES = [
  { type: 'operator', prefix: 'Pilot Car Services US', slugPrefix: 'pilot-car-us', count: 1000000, source: 'mass_ingestion_1m' },
  { type: 'traffic_control', prefix: 'Flagger Pro', slugPrefix: 'flagger-pro', count: 125000, source: 'mass_ingestion_125k' },
  { type: 'broker', prefix: 'National Heavy Haul Broker', slugPrefix: 'broker', count: 120000, source: 'mass_ingestion_120k' },
  { type: 'height_pole', prefix: 'High Pole Escort', slugPrefix: 'high-pole', count: 100000, source: 'mass_ingestion_100k' },
  { type: 'witpac', prefix: 'WITPAC Interstate Escort', slugPrefix: 'witpac', count: 50000, source: 'mass_ingestion_50k' },
  { type: 'bucket_truck', prefix: 'Bucket Truck Utility', slugPrefix: 'bucket-truck', count: 40000, source: 'mass_ingestion_40k' },
  { type: 'permit_service', prefix: 'Permit Expediter', slugPrefix: 'permit-exp', count: 25000, source: 'mass_ingestion_25k' },
  { type: 'mobile_mechanic', prefix: 'Mobile Mechanic HD', slugPrefix: 'mobile-mech', count: 25000, source: 'mass_ingestion_25k_mech' },
  { type: 'route_survey', prefix: 'Route Survey Eng', slugPrefix: 'route-survey', count: 20000, source: 'mass_ingestion_20k' },
  { type: 'tcs', prefix: 'Traffic Control Supervisor', slugPrefix: 'tcs', count: 20000, source: 'mass_ingestion_20k_tcs' },
  { type: 'police_escort', prefix: 'Police Escort Unit', slugPrefix: 'police-escort', count: 10000, source: 'mass_ingestion_10k' },
  { type: 'heavy_tow', prefix: 'Heavy Tow Rotator', slugPrefix: 'heavy-tow', count: 10000, source: 'mass_ingestion_10k_tow' },
  { type: 'truck_stop', prefix: 'Truck Stop Plaza', slugPrefix: 'truck-stop', count: 6000, source: 'mass_ingestion_6k' },
  { type: 'steer_car', prefix: 'Steer Car Rear Escort', slugPrefix: 'steer-car', count: 5000, source: 'mass_ingestion_5k' },
  { type: 'layover_yard', prefix: 'Secure Staging Yard', slugPrefix: 'layover-yard', count: 5000, source: 'mass_ingestion_5k_yard' },
  { type: 'hazmat', prefix: 'HAZMAT Spill Response', slugPrefix: 'hazmat', count: 3000, source: 'mass_ingestion_3k' },
  { type: 'autonomous_responder', prefix: 'Autonomous Fleet Responder', slugPrefix: 'auto-fleet', count: 2000, source: 'mass_ingestion_2k' },
];

const US_STATES = ['TX','CA','FL','NY','PA','IL','OH','GA','NC','MI','WA','AZ','CO','OR','NV','TN','MO','AL','LA','OK','KS','NE','IA','AR','WI','MN','IN','KY','SC','VA','MD','NJ','CT','MA','WV','ND','SD','MT','WY','ID','UT','NM','HI','AK','ME','VT','NH','RI','DE'];
const US_CITIES = ['Houston','Dallas','Miami','Atlanta','Chicago','Phoenix','Denver','Charlotte','Austin','Tampa','Seattle','Portland','Las Vegas','Nashville','Kansas City','Minneapolis','Indianapolis','San Diego','San Antonio','Jacksonville','Columbus','Memphis','Louisville','Milwaukee','Oklahoma City','Tulsa','El Paso','Albuquerque','Tucson','Raleigh'];

const BATCH_SIZE = 500;

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function insertBatch(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/directory_listings`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=ignore-duplicates,return=minimal'
    },
    body: JSON.stringify(rows)
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return true;
}

async function ingestCategory(cat) {
  console.log(`\n━━━ INGESTING: ${cat.prefix} (${cat.count.toLocaleString()} entities) ━━━`);
  let inserted = 0;
  
  for (let offset = 0; offset < cat.count; offset += BATCH_SIZE) {
    const batchEnd = Math.min(offset + BATCH_SIZE, cat.count);
    const rows = [];
    
    for (let i = offset; i < batchEnd; i++) {
      rows.push({
        entity_type: cat.type,
        name: `${cat.prefix} ${i + 1}`,
        slug: `${cat.slugPrefix}-${i + 1}`,
        city: randomItem(US_CITIES),
        region_code: randomItem(US_STATES),
        country_code: 'US',
        claim_status: 'unclaimed',
        is_visible: true,
        source: cat.source,
        rank_score: Math.floor(Math.random() * 30) + 10,
        entity_confidence_score: Math.floor(Math.random() * 30) + 70,
        profile_completeness: Math.floor(Math.random() * 40) + 30,
        claim_priority_score: Math.floor(Math.random() * 40) + 40
      });
    }
    
    try {
      await insertBatch(rows);
      inserted += rows.length;
      
      if (inserted % 5000 === 0 || inserted === cat.count) {
        const pct = ((inserted / cat.count) * 100).toFixed(1);
        console.log(`   [${cat.type}] ${inserted.toLocaleString()} / ${cat.count.toLocaleString()} (${pct}%)`);
      }
    } catch (err) {
      console.error(`   [ERROR @ batch ${offset}] ${err.message}`);
      // If it's a unique violation, that's fine - continue
      if (err.message.includes('duplicate') || err.message.includes('409') || err.message.includes('23505')) {
        continue;
      }
      // For any other error, let's see if the table exists
      if (err.message.includes('404') || err.message.includes('relation') || err.message.includes('does not exist')) {
        console.error('FATAL: directory_listings table does not exist. Run the migration first.');
        process.exit(1);
      }
    }
  }
  
  console.log(`   ✅ ${cat.prefix}: ${inserted.toLocaleString()} entities pushed.`);
  return inserted;
}

async function main() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('  HAUL COMMAND: 1.56M US ENTITY MASS INGESTION ENGINE');
  console.log('  Target: 1,566,000 Logistics Entities');
  console.log('  Database: hvjyfyzotqobfkakjozp.supabase.co');
  console.log('════════════════════════════════════════════════════════════════');
  
  // First, verify the table exists with a simple count
  const testRes = await fetch(`${SUPABASE_URL}/rest/v1/directory_listings?select=id&limit=1`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    }
  });
  
  if (!testRes.ok) {
    const err = await testRes.text();
    console.error('FATAL: Cannot access directory_listings table:', err);
    console.error('You must run the schema migration first in Supabase SQL Editor.');
    process.exit(1);
  }
  
  console.log('✅ directory_listings table confirmed live.\n');
  
  let totalInserted = 0;
  for (const cat of CATEGORIES) {
    const count = await ingestCategory(cat);
    totalInserted += count;
  }
  
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`  INGESTION COMPLETE: ${totalInserted.toLocaleString()} entities pushed to live DB`);
  console.log('════════════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
