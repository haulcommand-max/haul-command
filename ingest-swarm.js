/**
 * Haul Command — Phase 4 Autonomous Ingestion Swarm
 * Generates and streams 1,566,000 logistics entities into public.providers
 * Targets the ACTUAL schema: provider_key, name_raw, name_norm, provider_type,
 * category_raw, role, source, status, city, state, trust_score, etc.
 *
 * Runs in batches of 5,000 to stay well within Supabase pooler limits.
 * Real-time progress bar output.
 */

const { Client } = require('pg');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

// Direct DB URL for bulk operations (bypasses pooler 30s timeout)
const client = new Client({ connectionString: env['SUPABASE_DB_POOLER_URL'], statement_timeout: 300000 });

const US_CITIES = [
  ['TX', 'Houston'], ['TX', 'Dallas'], ['TX', 'Austin'], ['TX', 'San Antonio'], ['TX', 'Fort Worth'], ['TX', 'El Paso'],
  ['CA', 'Los Angeles'], ['CA', 'San Diego'], ['CA', 'Fresno'], ['CA', 'Sacramento'], ['CA', 'Oakland'], ['CA', 'Bakersfield'],
  ['FL', 'Miami'], ['FL', 'Orlando'], ['FL', 'Tampa'], ['FL', 'Jacksonville'], ['FL', 'Fort Lauderdale'],
  ['NY', 'Albany'], ['NY', 'Buffalo'], ['NY', 'Rochester'], ['NY', 'Syracuse'],
  ['PA', 'Pittsburgh'], ['PA', 'Philadelphia'], ['PA', 'Harrisburg'], ['PA', 'Allentown'],
  ['IL', 'Chicago'], ['IL', 'Springfield'], ['IL', 'Peoria'], ['IL', 'Rockford'],
  ['OH', 'Columbus'], ['OH', 'Cleveland'], ['OH', 'Cincinnati'], ['OH', 'Dayton'],
  ['GA', 'Atlanta'], ['GA', 'Savannah'], ['GA', 'Macon'], ['GA', 'Augusta'],
  ['NC', 'Charlotte'], ['NC', 'Raleigh'], ['NC', 'Greensboro'], ['NC', 'Durham'],
  ['MI', 'Detroit'], ['MI', 'Grand Rapids'], ['MI', 'Lansing'], ['MI', 'Flint'],
  ['AZ', 'Phoenix'], ['AZ', 'Tucson'], ['AZ', 'Mesa'], ['AZ', 'Chandler'],
  ['CO', 'Denver'], ['CO', 'Colorado Springs'], ['CO', 'Aurora'], ['CO', 'Fort Collins'],
  ['WA', 'Seattle'], ['WA', 'Spokane'], ['WA', 'Tacoma'],
  ['TN', 'Nashville'], ['TN', 'Memphis'], ['TN', 'Knoxville'],
  ['MO', 'St. Louis'], ['MO', 'Kansas City'], ['MO', 'Springfield'],
  ['IN', 'Indianapolis'], ['IN', 'Fort Wayne'], ['IN', 'Evansville'],
  ['WI', 'Milwaukee'], ['WI', 'Madison'], ['WI', 'Green Bay'],
  ['MN', 'Minneapolis'], ['MN', 'St. Paul'], ['MN', 'Duluth'],
  ['LA', 'New Orleans'], ['LA', 'Baton Rouge'], ['LA', 'Shreveport'],
  ['AL', 'Birmingham'], ['AL', 'Montgomery'], ['AL', 'Mobile'],
  ['SC', 'Columbia'], ['SC', 'Charleston'], ['SC', 'Greenville'],
  ['KY', 'Louisville'], ['KY', 'Lexington'], ['KY', 'Bowling Green'],
  ['VA', 'Richmond'], ['VA', 'Norfolk'], ['VA', 'Chesapeake'],
  ['OK', 'Oklahoma City'], ['OK', 'Tulsa'], ['OK', 'Norman'],
  ['NV', 'Las Vegas'], ['NV', 'Reno'], ['NV', 'Henderson'],
  ['NM', 'Albuquerque'], ['NM', 'Santa Fe'], ['NM', 'Las Cruces'],
  ['UT', 'Salt Lake City'], ['UT', 'Provo'], ['UT', 'Ogden'],
  ['ID', 'Boise'], ['ID', 'Nampa'], ['MT', 'Billings'], ['MT', 'Missoula'],
  ['WY', 'Cheyenne'], ['WY', 'Casper'], ['ND', 'Fargo'], ['SD', 'Sioux Falls'],
  ['NE', 'Omaha'], ['NE', 'Lincoln'], ['KS', 'Wichita'], ['KS', 'Topeka'],
];

const MATRIX = [
  { tag: 'pilot_car',                    qty: 1000000, prefix: 'Escort',          suffix: 'Pilot Cars',          role: 'escort' },
  { tag: 'flagger',                      qty: 125000,  prefix: 'Traffic Control',  suffix: 'Flaggers',            role: 'flagger' },
  { tag: 'height_pole',                  qty: 100000,  prefix: 'High Pole',        suffix: 'Specialized Escort',  role: 'escort' },
  { tag: 'witpac',                       qty: 50000,   prefix: 'WITPAC Certified', suffix: 'Interstate Pilots',   role: 'escort' },
  { tag: 'bucket_truck',                 qty: 40000,   prefix: 'Utility Lift',     suffix: 'Bucket Services',     role: 'support' },
  { tag: 'permit_service',               qty: 25000,   prefix: 'Expedited',        suffix: 'Permit Service',      role: 'permit' },
  { tag: 'route_survey',                 qty: 20000,   prefix: 'Engineering',      suffix: 'Route Surveys',       role: 'survey' },
  { tag: 'traffic_control_supervisor',   qty: 20000,   prefix: 'TCS',              suffix: 'Control Supervisors', role: 'flagger' },
  { tag: 'police_escort',                qty: 10000,   prefix: 'State Highway',    suffix: 'Police Escort',       role: 'escort' },
  { tag: 'steer_car',                    qty: 5000,    prefix: 'Rear Steer',       suffix: 'Escorts',             role: 'escort' },
  { tag: 'freight_broker',               qty: 120000,  prefix: 'Freight',          suffix: 'Logistics Brokerage', role: 'broker' },
  { tag: 'mobile_mechanic',              qty: 25000,   prefix: 'Heavy Duty',       suffix: 'Mobile Mechanics',    role: 'support' },
  { tag: 'heavy_towing',                 qty: 10000,   prefix: 'Rotator',          suffix: 'Heavy Towing',        role: 'support' },
  { tag: 'truck_stop',                   qty: 6000,    prefix: 'Travel Plaza',     suffix: 'Truck Stop',          role: 'infrastructure' },
  { tag: 'staging_yard',                 qty: 5000,    prefix: 'Secure',           suffix: 'Layover Yard',        role: 'infrastructure' },
  { tag: 'hazmat',                       qty: 3000,    prefix: 'Spill Response',   suffix: 'HAZMAT Team',         role: 'support' },
  { tag: 'autonomous_responder',         qty: 2000,    prefix: 'Autonomous',       suffix: 'Fleet Responder',     role: 'support' },
];

const TOTAL = MATRIX.reduce((s, m) => s + m.qty, 0);
const BATCH = 5000;

function randCity() {
  return US_CITIES[Math.floor(Math.random() * US_CITIES.length)];
}

function randPhone() {
  const area = Math.floor(Math.random() * 800) + 200;
  const num = Math.floor(Math.random() * 8000000) + 2000000;
  return `+1${area}${num}`;
}

function randSlug(tag, idx) {
  return `${tag}-${idx}-${Math.random().toString(36).slice(2, 8)}`;
}

function randName(prefix, suffix) {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix} ${rand} ${suffix}`;
}

// Build a VALUES block for a single batch
function buildBatch(tag, role, prefix, suffix, startIdx, count) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    const [state, city] = randCity();
    const slug = randSlug(tag, startIdx + i);
    const name = randName(prefix, suffix);
    const phone = randPhone();
    const trust = (Math.random() * 0.6 + 0.3).toFixed(4);
    const claimStatus = Math.random() < 0.15 ? 'claimed' : 'unclaimed';
    const status = Math.random() < 0.9 ? 'active' : 'onboarding';
    rows.push(`(
      '${slug}',
      '${name.replace(/'/g, "''")}',
      '${name.replace(/'/g, "''")}',
      '${tag}',
      '${tag}',
      '${role}',
      'MATRIX_GEN',
      '${status}',
      '${city}',
      '${state}',
      'US',
      ${trust},
      0, 0, 0,
      '${claimStatus}',
      NOW(),
      NOW()
    )`);
  }
  return rows.join(',\n');
}

async function run() {
  await client.connect();
  console.log(`\n🚛 Haul Command Phase 4 — Autonomous Ingestion Swarm`);
  console.log(`   Target: ${TOTAL.toLocaleString()} entities → public.providers\n`);

  // Disable the SEO sitemap trigger during bulk seed (re-enabled after)
  // This is required because the trigger expects a fully-formed slug URL
  // which the generated rows don't have yet during seeding.
  console.log('  [SETUP] Disabling SEO trigger for bulk ingestion...');
  await client.query('ALTER TABLE providers DISABLE TRIGGER trg_seo_on_provider_claim;');
  console.log('  [SETUP] Trigger disabled. Starting swarm...\n');

  let totalInserted = 0;
  const startTime = Date.now();

  for (const m of MATRIX) {
    const batches = Math.ceil(m.qty / BATCH);
    console.log(`\n[${m.tag.toUpperCase()}] Generating ${m.qty.toLocaleString()} records in ${batches} batches...`);

    for (let b = 0; b < batches; b++) {
      const count = Math.min(BATCH, m.qty - b * BATCH);
      const startIdx = b * BATCH;
      const values = buildBatch(m.tag, m.role, m.prefix, m.suffix, startIdx, count);

      try {
      await client.query(`
          INSERT INTO providers (
            provider_key, name_raw, name_norm, provider_type, category_raw, role,
            source, status, city, state, country,
            trust_score, rating_avg, rating_count, jobs_completed,
            claim_status, created_at, updated_at
          ) VALUES ${values}
          ON CONFLICT (provider_key) DO NOTHING;
        `);

        totalInserted += count;
        const pct = ((totalInserted / TOTAL) * 100).toFixed(1);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        const rps = Math.round(totalInserted / Math.max(1, (Date.now() - startTime) / 1000));
        process.stdout.write(`\r  ✅ ${totalInserted.toLocaleString()} / ${TOTAL.toLocaleString()} (${pct}%) — ${rps.toLocaleString()} rows/sec — ${elapsed}s elapsed`);
      } catch (err) {
        console.error(`\n❌ Batch error at ${m.tag} batch ${b}:`, err.message);
        // Continue to next batch
      }
    }
  }

  console.log(`\n\n🏁 COMPLETE: Inserted ${totalInserted.toLocaleString()} entities in ${((Date.now() - startTime)/1000).toFixed(1)}s`);
  
  // Re-enable the SEO trigger
  console.log('\n  [TEARDOWN] Re-enabling SEO trigger...');
  await client.query('ALTER TABLE providers ENABLE TRIGGER trg_seo_on_provider_claim;');
  
  // Final count
  const cnt = await client.query('SELECT COUNT(*) FROM providers;');
  console.log(`  [VERIFY] Total providers in DB: ${parseInt(cnt.rows[0].count).toLocaleString()}`);
  
  await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
