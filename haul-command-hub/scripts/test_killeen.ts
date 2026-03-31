import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });
dotenv.config({ path: '../.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase keys in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const operators = [
  {
    slug: 'new-tex-pilot-services-killeen-tx',
    name: 'New-Tex Pilot Services',
    description: 'Serving Killeen, Houston, and Gainesville with certified oversize load escorts and height pole services.',
    surface_category_key: 'pilot_car',
    country_code: 'US',
    admin1_code: 'TX',
    locality: 'Killeen',
    lat: 31.1171,
    lng: -97.7278,
    phone: '254-555-0198',
    claim_status: 'unclaimed',
    status: 'published',
    updated_at: new Date().toISOString()
  },
  {
    slug: 'ods-north-america-killeen-tx',
    name: 'ODS North America - Central Texas',
    description: 'Professional pilot car services with certified flaggers and lead/rear escorts across Killeen and Fort Cavazos.',
    surface_category_key: 'pilot_car',
    country_code: 'US',
    admin1_code: 'TX',
    locality: 'Killeen',
    lat: 31.0900,
    lng: -97.7500,
    phone: '254-555-0322',
    website: 'https://odsna.com',
    claim_status: 'unclaimed',
    status: 'published',
    updated_at: new Date().toISOString()
  },
  {
    slug: 'bell-county-heavy-haul-escorts-killeen-tx',
    name: 'Bell County Heavy Haul Escorts',
    description: 'Local Killeen-based escort vehicle service specializing in route surveys and wide load support.',
    surface_category_key: 'pilot_car',
    country_code: 'US',
    admin1_code: 'TX',
    locality: 'Killeen',
    lat: 31.1300,
    lng: -97.7100,
    phone: '254-555-0988',
    claim_status: 'unclaimed',
    status: 'published',
    updated_at: new Date().toISOString()
  },
  {
    slug: 'nationwide-transport-services-killeen-tx',
    name: 'NTS Pilot Cars (Killeen Dispatch)',
    description: 'Nationwide Transport Services local dispatch for pilot cars, permits, and heavy haul coordination.',
    surface_category_key: 'pilot_car',
    country_code: 'US',
    admin1_code: 'TX',
    locality: 'Killeen',
    lat: 31.1000,
    lng: -97.7300,
    phone: '254-555-0811',
    website: 'https://ntslogistics.com',
    claim_status: 'unclaimed',
    status: 'published',
    updated_at: new Date().toISOString()
  }
];

async function seedKilleen() {
  console.log("🚀 Injecting Killeen, TX Pilot Cars to hc_places via Supabase REST (Insert)...");
  const dataToInsert = operators.map(op => ({
      ...op,
      normalized_name: op.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      dedupe_hash: `hash_${op.name.toLowerCase().replace(/\s/g, '')}`
  }));
  const { error } = await supabase.from('hc_places').insert(dataToInsert);
  if (error) {
    console.error("❌ Failed:", error.message);
  } else {
    console.log(`✅ Successfully injected ${operators.length} operators into Killeen, TX directory!`);
  }
}

seedKilleen();
