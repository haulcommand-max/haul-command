// Seed dispatch_supply for Blue and Silver tier countries
// Includes country_role_id lookup (NOT NULL constraint)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BLUE_TIER = ['IE','SE','NO','DK','FI','BE','AT','CH','ES','FR','IT','PT','SA','QA','MX','IN','ID','TH'];
const SILVER_TIER = ['PL','CZ','SK','HU','SI','EE','LV','LT','HR','RO','BG','GR','TR','KW','OM','BH','SG','MY','JP','KR','CL','AR','CO','PE','VN','PH'];

const ROLE_NAMES = ['Escort Vehicle Provider','Pilot Car Service','Heavy Load Escort','Oversize Transport Escort','Lead Vehicle Service'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Cache country data
const countryCache = {};

async function getCountryData(code) {
  if (countryCache[code]) return countryCache[code];
  
  const { data: country } = await supabase.from('countries').select('id').eq('code', code).single();
  if (!country) return null;
  
  // Get first available country_role for this country
  const { data: roles } = await supabase
    .from('country_roles')
    .select('id')
    .eq('country_id', country.id)
    .limit(5);
  
  if (!roles || roles.length === 0) return null;
  
  countryCache[code] = { countryId: country.id, roleIds: roles.map(r => r.id) };
  return countryCache[code];
}

async function seedCountry(code) {
  const data = await getCountryData(code);
  if (!data) { console.log(`  ⚠ ${code}: no country or roles found`); return 0; }

  const entityCount = rand(2, 4);
  let supplyCount = 0;

  for (let i = 0; i < entityCount; i++) {
    const roleName = pick(ROLE_NAMES);
    const { data: entity, error: entErr } = await supabase
      .from('market_entities')
      .insert({
        display_name: `${roleName} ${code}-${i + 1}`,
        entity_type: 'company',
        country_id: data.countryId,
        claim_status: Math.random() > 0.6 ? 'claimed' : 'unclaimed',
        hq_lat: rand(-40, 60) + Math.random(),
        hq_lng: rand(-120, 140) + Math.random(),
      })
      .select('id')
      .single();

    if (entErr) { console.log(`  ✗ Entity ${code}: ${entErr.message}`); continue; }

    const supplyEntries = rand(1, 3);
    for (let j = 0; j < supplyEntries; j++) {
      const { error: supErr } = await supabase
        .from('dispatch_supply')
        .insert({
          entity_id: entity.id,
          country_id: data.countryId,
          country_role_id: pick(data.roleIds),
          availability_status: Math.random() > 0.3 ? 'available' : 'offline',
          accepts_urgent: Math.random() > 0.4,
          accepts_night_moves: Math.random() > 0.5,
          accepts_weekend_moves: Math.random() > 0.4,
          accepts_cross_border: Math.random() > 0.6,
          trust_score_snapshot: rand(45, 100),
          priority_score: rand(20, 100),
          service_radius_km: pick([50, 100, 200, 300, 500]),
          response_time_minutes_estimate: pick([15, 30, 45, 60, 90]),
          home_base_label: `${code} Base ${j + 1}`,
        });

      if (!supErr) supplyCount++;
      else console.log(`  ✗ Supply: ${supErr.message}`);
    }
  }
  return supplyCount;
}

async function main() {
  console.log('=== SEEDING BLUE TIER (18 countries) ===');
  let totalBlue = 0;
  for (const code of BLUE_TIER) {
    const count = await seedCountry(code);
    totalBlue += count;
    console.log(`  ✓ ${code}: ${count} supply entries`);
  }
  console.log(`Blue total: ${totalBlue}\n`);

  console.log('=== SEEDING SILVER TIER (26 countries) ===');
  let totalSilver = 0;
  for (const code of SILVER_TIER) {
    const count = await seedCountry(code);
    totalSilver += count;
    console.log(`  ✓ ${code}: ${count} supply entries`);
  }
  console.log(`Silver total: ${totalSilver}`);
  console.log(`\nGRAND TOTAL: ${totalBlue + totalSilver} supply entries across ${BLUE_TIER.length + SILVER_TIER.length} countries`);
}

main().catch(console.error);
