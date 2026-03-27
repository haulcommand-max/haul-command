import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const CITIES = [
  { sc: 'TX', cn: 'Houston' }, { sc: 'TX', cn: 'Dallas' }, { sc: 'TX', cn: 'Austin' }, { sc: 'TX', cn: 'San Antonio' },
  { sc: 'CA', cn: 'Los Angeles' }, { sc: 'CA', cn: 'San Diego' }, { sc: 'CA', cn: 'Fresno' }, { sc: 'CA', cn: 'Sacramento' },
  { sc: 'FL', cn: 'Miami' }, { sc: 'FL', cn: 'Orlando' }, { sc: 'FL', cn: 'Tampa' }, { sc: 'FL', cn: 'Jacksonville' },
  { sc: 'NY', cn: 'Albany' }, { sc: 'NY', cn: 'Buffalo' }, { sc: 'NY', cn: 'Rochester' },
  { sc: 'PA', cn: 'Pittsburgh' }, { sc: 'PA', cn: 'Philadelphia' }, { sc: 'PA', cn: 'Harrisburg' },
  { sc: 'IL', cn: 'Chicago' }, { sc: 'IL', cn: 'Springfield' }, { sc: 'IL', cn: 'Peoria' },
  { sc: 'OH', cn: 'Columbus' }, { sc: 'OH', cn: 'Cleveland' }, { sc: 'OH', cn: 'Cincinnati' },
  { sc: 'GA', cn: 'Atlanta' }, { sc: 'GA', cn: 'Savannah' }, { sc: 'GA', cn: 'Macon' },
  { sc: 'NC', cn: 'Charlotte' }, { sc: 'NC', cn: 'Raleigh' }, { sc: 'NC', cn: 'Greensboro' },
  { sc: 'MI', cn: 'Detroit' }, { sc: 'MI', cn: 'Grand Rapids' }, { sc: 'MI', cn: 'Lansing' }
];

const MATRIX = [
  { tag: 'pilot_car_operator', qty: 1000000, pfx: 'Escort', sfx: 'Pilot Cars', meta: 'pilot_car' },
  { tag: 'escort_staging', qty: 125000, pfx: 'Traffic Control', sfx: 'Flaggers', meta: 'flagger' },
  { tag: 'pilot_car_operator', qty: 100000, pfx: 'High Pole', sfx: 'Specialized', meta: 'height_pole' },
  { tag: 'pilot_car_operator', qty: 50000, pfx: 'WITPAC', sfx: 'Interstate', meta: 'witpac' },
  { tag: 'crane_service', qty: 40000, pfx: 'Utility Lift', sfx: 'Bucket Services', meta: 'bucket_truck' },
  { tag: 'permit_services', qty: 25000, pfx: 'Expedited', sfx: 'Permit Service', meta: 'permit_service' },
  { tag: 'permit_office', qty: 20000, pfx: 'Engineering', sfx: 'Route Surveys', meta: 'route_survey' },
  { tag: 'pilot_car_operator', qty: 20000, pfx: 'TCS', sfx: 'Control Supervisors', meta: 'tcs' },
  { tag: 'pilot_car_operator', qty: 10000, pfx: 'State Highway', sfx: 'Police Escort', meta: 'police_escort' },
  { tag: 'pilot_car_operator', qty: 5000, pfx: 'Rear Steer', sfx: 'Escorts', meta: 'steer_car' },
  { tag: 'freight_broker', qty: 120000, pfx: 'Freight', sfx: 'Logistics Brokerage', meta: 'freight_broker' },
  { tag: 'heavy_equipment_dealer', qty: 25000, pfx: 'Heavy Duty', sfx: 'Mobile Mechanics', meta: 'mobile_mechanic' },
  { tag: 'crane_service', qty: 10000, pfx: 'Rotator', sfx: 'Heavy Towing', meta: 'heavy_towing' },
  { tag: 'truck_stop', qty: 6000, pfx: 'Travel Plaza', sfx: 'Truck Stop', meta: 'truck_stop' },
  { tag: 'truck_parking', qty: 5000, pfx: 'Secure', sfx: 'Layover Yard', meta: 'staging_yard' },
  { tag: 'oil_gas_facility', qty: 3000, pfx: 'Spill Response', sfx: 'HAZMAT Team', meta: 'hazmat' },
  { tag: 'pilot_car_operator', qty: 2000, pfx: 'Autonomous', sfx: 'Fleet Responder', meta: 'autonomous' }
];

async function generateBatch(tag, pfx, sfx, amount, metaTag) {
  const records = [];
  for (let i = 0; i < amount; i++) {
    const loc = CITIES[Math.floor(Math.random() * CITIES.length)];
    const hex = crypto.randomBytes(3).toString('hex');
    const phone = `+1${Math.floor(Math.random() * 800 + 200)}${Math.floor(Math.random() * 8000000 + 2000000)}`;
    const randId = crypto.randomUUID();
    records.push({
      id: randId,
      entity_type: tag,
      entity_id: randId,
      slug: `${metaTag.replace(/_/g, '-')}-${randId.slice(0, 8)}`,
      name: `${pfx} ${hex} ${sfx}`,
      country_code: 'US',
      region_code: loc.sc,
      city: loc.cn,
      is_visible: true,
      metadata: { phone: phone, coverage_status: Math.random() > 0.1 ? 'live' : 'onboarding', specialty: metaTag }
    });
  }
  return records;
}

async function start() {
  console.log("Starting 1.566M Entity Generation via REST API...");
  
  const CHUNK_SIZE = 50;
  const CONCURRENCY = 2;
  
  let totalInserted = 0;

  for (const matrixRow of MATRIX) {
    let remaining = matrixRow.qty;
    console.log(`\nGenerating ${matrixRow.qty} for [${matrixRow.tag}]`);

    while (remaining > 0) {
      const promises = [];
      const currentConcurrency = Math.min(CONCURRENCY, Math.ceil(remaining / CHUNK_SIZE));
      
      for (let c = 0; c < currentConcurrency; c++) {
        const batchAmount = Math.min(CHUNK_SIZE, remaining);
        remaining -= batchAmount;
        
        promises.push(
          (async () => {
            const batch = await generateBatch(matrixRow.tag, matrixRow.pfx, matrixRow.sfx, batchAmount, matrixRow.meta);
            const { error } = await supabase.from('directory_listings').insert(batch);
            if (error) {
              console.error(`Insert error for ${matrixRow.tag}:`, error.message);
              // Retry once
              await supabase.from('directory_listings').insert(batch);
            } else {
              totalInserted += batchAmount;
            }
          })()
        );
      }
      
      await Promise.all(promises);
      process.stdout.write(`\rProgress: ${totalInserted} / 1566000 inserted...`);
    }
  }

  console.log(`\n\n✅ Successfully generated ${totalInserted} entities into provider_directory!`);
}

start();
