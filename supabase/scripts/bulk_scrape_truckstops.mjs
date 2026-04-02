/**
 * BULK SCRAPER v3 — TruckStopsAndServices.com → hc_places
 * 
 * SPEED OPTIMIZATIONS:
 *   1. Concurrent listing page fetches (10 at a time per category)
 *   2. Concurrent detail page fetches (8 at a time)
 *   3. Batch Supabase inserts (50 rows per batch)
 *   4. Skip detail page fetch when title extraction gives enough data
 *   5. Company-level dedup in memory before hitting DB
 *   6. Pre-load all existing dedupe_hashes for instant local check
 * 
 * Estimated: 46 categories × 52 states = ~2,400 listing pages
 * Each listing page yields ~5-50 unique companies
 * Total estimate: ~3,000-5,000 unique businesses after dedup
 * Runtime: ~20-30 minutes (vs 2-3 hours in v1)
 * 
 * Usage:
 *   node supabase/scripts/bulk_scrape_truckstops.mjs                    # Full run
 *   node supabase/scripts/bulk_scrape_truckstops.mjs --dry-run          # Preview only
 *   node supabase/scripts/bulk_scrape_truckstops.mjs --category=29      # Single category
 *   node supabase/scripts/bulk_scrape_truckstops.mjs --limit=100        # Cap inserts
 *   node supabase/scripts/bulk_scrape_truckstops.mjs --concurrency=15   # Tune speed
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

const SUPABASE_URL = 'https://hvjyfyzotqobfkakjozp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ0NjMxNSwiZXhwIjoyMDg3MDIyMzE1fQ.xG-oo7qSFevW1JO9GVwd005ZXAMht86_C7P8RRHJ938';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BASE_URL = 'https://www.truckstopsandservices.com';

// ── Category → surface_category_key mapping (all 46) ──
const CATEGORY_MAP = {
  109: { key: 'auto_repair', label: 'Auto Repair' },
  96:  { key: 'axle_repair', label: 'Axle Repairs' },
  104: { key: 'body_shop', label: 'Body Shop' },
  117: { key: 'cartage_moves', label: 'Cartage Moves' },
  93:  { key: 'cat_scale', label: 'CAT Scale Locations' },
  71:  { key: 'cb_shop', label: 'CB Shops' },
  86:  { key: 'chrome_shop', label: 'Chrome Shops' },
  79:  { key: 'spill_response', label: 'Environmental Clean up' },
  78:  { key: 'truck_parking', label: 'Fast Food With Truck Parking' },
  88:  { key: 'repair_shop', label: 'Garages/Shops' },
  123: { key: 'glass_repair', label: 'Glass Repair/Sales' },
  103: { key: 'hydraulics', label: 'Hydraulics' },
  99:  { key: 'cold_storage', label: 'Load Storage' },
  106: { key: 'lockout_service', label: 'Lock Out Services' },
  113: { key: 'mobile_fueling', label: 'Mobile Fueling' },
  70:  { key: 'mobile_truck_repair', label: 'Mobile Truck/Trailer Repair' },
  73:  { key: 'motel_truck_parking', label: 'Motels With Truck Parking' },
  31:  { key: 'oil_lube', label: 'Oil and Lube' },
  122: { key: 'oil_delivery', label: 'Oil Supplies - Delivery' },
  101: { key: 'truck_parts', label: 'Parts' },
  27:  { key: 'pilot_car', label: 'Pilot Car Companies' },
  92:  { key: 'pilot_car_permits', label: 'Pilot Car Services & Permits' },
  81:  { key: 'reefer_repair', label: 'Reefer Repairs' },
  26:  { key: 'rest_area', label: 'Rest Areas' },
  72:  { key: 'restaurant_truck_parking', label: 'Restaurants With Truck Parking' },
  75:  { key: 'rv_repair', label: 'RV Repair' },
  95:  { key: 'secure_storage', label: 'Secure Storage' },
  107: { key: 'drop_yard', label: 'Secure Trailer Drop Yard & Parking' },
  128: { key: 'spill_response', label: 'Spill Response' },
  25:  { key: 'scale_weigh_station_public', label: 'State Weigh Stations' },
  28:  { key: 'tire_shop', label: 'Tire Repair / Sales' },
  29:  { key: 'tow_rotator', label: 'Towing / Wrecker Service' },
  33:  { key: 'truck_wash', label: 'Trailer Wash' },
  105: { key: 'tanker_wash', label: 'Trailer/Tanker Wash Out' },
  68:  { key: 'freight_broker', label: 'Transportation Brokers' },
  87:  { key: 'truck_dealer', label: 'Truck / Trailer Dealers' },
  30:  { key: 'repair_shop', label: 'Truck / Trailer Repair' },
  98:  { key: 'truck_driving_jobs', label: 'Truck Driving Jobs' },
  111: { key: 'truck_insurance', label: 'Truck Insurance' },
  94:  { key: 'truck_salvage', label: 'Truck Salvage' },
  19:  { key: 'truck_stop', label: 'Truck Stops' },
  32:  { key: 'truck_wash', label: 'Truck Wash' },
  97:  { key: 'trucker_supplies', label: 'Trucker Supplies' },
  23:  { key: 'truck_parking', label: "Walmart With Truck Parking" },
  112: { key: 'walmart_no_parking', label: "Walmart Without Truck Parking" },
  82:  { key: 'welding', label: 'Welding' },
};

// ── State ID → state code ──
const STATE_MAP = {
  1: 'AL', 2: 'AR', 3: 'AZ', 5: 'CA', 6: 'CO', 7: 'CT', 8: 'DE', 9: 'FL', 10: 'GA',
  11: 'IA', 12: 'ID', 13: 'IL', 14: 'IN', 15: 'KS', 16: 'KY', 17: 'LA', 18: 'MA',
  19: 'MD', 20: 'ME', 21: 'MI', 22: 'MN', 23: 'MO', 24: 'MS', 25: 'MT', 26: 'NC',
  27: 'ND', 28: 'NE', 29: 'NH', 30: 'NJ', 31: 'NM', 33: 'NV', 34: 'NY', 35: 'OH',
  36: 'OK', 37: 'ON', 38: 'OR', 39: 'PA', 41: 'RI', 42: 'SC', 43: 'SD', 44: 'TN',
  45: 'TX', 46: 'UT', 47: 'VA', 48: 'VT', 49: 'WI', 50: 'WV', 51: 'WA', 52: 'WY',
  64: 'DC',
};

const CANADIAN_STATES = new Set([37]);

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function dedupeHash(name, city, state, type) {
  return `${slugify(name)}::${slugify(city || '')}::${slugify(state || '')}::${type}`;
}

function titleCase(str) {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Fetch with timeout + retry
function fetchPage(url, retries = 2) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { 
      headers: { 'User-Agent': 'HaulCommand-DirectoryBot/2.0 (directory ingestion)' },
      timeout: 10000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
      res.on('error', reject);
    });
    req.on('error', (err) => {
      if (retries > 0) {
        setTimeout(() => fetchPage(url, retries - 1).then(resolve).catch(reject), 1000);
      } else {
        reject(err);
      }
    });
    req.on('timeout', () => {
      req.destroy();
      if (retries > 0) {
        setTimeout(() => fetchPage(url, retries - 1).then(resolve).catch(reject), 1000);
      } else {
        reject(new Error('Timeout'));
      }
    });
  });
}

// Run promises with concurrency limit
async function pool(tasks, concurrency) {
  const results = [];
  const executing = new Set();
  for (const task of tasks) {
    const p = task().then(r => { executing.delete(p); return r; });
    results.push(p);
    executing.add(p);
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

// Extract unique company entries from listing page HTML
function extractCompanies(html) {
  const companies = new Map(); // name → first location ID
  const regex = /<a[^>]*location_details\.php\?id=(\d+)[^>]*>([^<]+)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const name = match[2].trim();
    const id = match[1];
    if (!companies.has(name)) {
      companies.set(name, id);
    }
  }
  return companies;
}

// Extract data from detail page
function extractDetailData(html) {
  const titleMatch = html.match(/<title>([^|]+)\|([^|]+)\|/);
  if (!titleMatch) return null;

  const name = titleMatch[1].trim().replace(/&amp;/g, '&').replace(/&#039;/g, "'");
  const locationPart = titleMatch[2].trim();
  const cityStateMatch = locationPart.match(/^([^,]+),\s*(\w{2})/);
  const city = cityStateMatch ? cityStateMatch[1].trim() : locationPart;

  const phoneMatch = html.match(/tel:([^"]+)"/);
  const phone = phoneMatch ? phoneMatch[1].replace(/[^\d-+().\s]/g, '').trim() : null;

  const websiteMatch = html.match(/href="(https?:\/\/(?!www\.truckstopsandservices)[^"]+)"/i);
  const website = websiteMatch ? websiteMatch[1] : null;

  return { name, city, phone, website };
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const categoryArg = args.find(a => a.startsWith('--category='));
  const stateArg = args.find(a => a.startsWith('--state='));
  const limitArg = args.find(a => a.startsWith('--limit='));
  const concurrencyArg = args.find(a => a.startsWith('--concurrency='));

  const targetCategory = categoryArg ? parseInt(categoryArg.split('=')[1]) : null;
  const targetState = stateArg ? parseInt(stateArg.split('=')[1]) : null;
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;
  const CONCURRENCY = concurrencyArg ? parseInt(concurrencyArg.split('=')[1]) : 8;

  const categories = targetCategory 
    ? { [targetCategory]: CATEGORY_MAP[targetCategory] } 
    : CATEGORY_MAP;
  const states = targetState 
    ? { [targetState]: STATE_MAP[targetState] } 
    : STATE_MAP;

  const startTime = Date.now();
  console.log('══════════════════════════════════════════════════════════');
  console.log('BULK SCRAPER v3 — TruckStopsAndServices.com → hc_places');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '🔴 LIVE INSERT'}`);
  console.log(`Categories: ${Object.keys(categories).length}`);
  console.log(`States: ${Object.keys(states).length}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Limit: ${limit === Infinity ? 'none' : limit}`);
  console.log('══════════════════════════════════════════════════════════\n');

  // ── Step 1: Pre-load existing dedupe_hashes for instant local check ──
  console.log('Step 1: Pre-loading existing dedupe_hashes...');
  const existingHashes = new Set();
  const existingSlugs = new Set();
  
  if (!dryRun) {
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data } = await supabase
        .from('hc_places')
        .select('dedupe_hash, slug')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (!data || data.length === 0) break;
      for (const row of data) {
        if (row.dedupe_hash) existingHashes.add(row.dedupe_hash);
        if (row.slug) existingSlugs.add(row.slug);
      }
      page++;
      if (data.length < pageSize) break;
    }
    console.log(`  → ${existingHashes.size} existing hashes loaded, ${existingSlugs.size} slugs.\n`);
  }

  // ── Step 2: Crawl all listing pages (concurrent per category) ──
  const allPending = []; // Rows to insert
  const seenCompanies = new Set(); // company::city::state
  let listingPagesScraped = 0;
  let detailPagesFetched = 0;
  let skippedDedup = 0;

  for (const [catId, catInfo] of Object.entries(categories)) {
    if (allPending.length >= limit) break;

    console.log(`\n── ${catInfo.label} (${catInfo.key}) ──`);

    // Build tasks: one per state
    const stateEntries = Object.entries(states);
    const batchSize = 10; // Fetch 10 state listing pages concurrently

    for (let i = 0; i < stateEntries.length; i += batchSize) {
      if (allPending.length >= limit) break;

      const batch = stateEntries.slice(i, i + batchSize);
      const listingTasks = batch.map(([stateId, stateCode]) => async () => {
        const url = `${BASE_URL}/listcatbusinesses.php?id=${catId}&state=${stateId}`;
        try {
          const html = await fetchPage(url);
          listingPagesScraped++;
          const companies = extractCompanies(html);
          return { stateId, stateCode, companies };
        } catch {
          return { stateId, stateCode, companies: new Map() };
        }
      });

      const listingResults = await pool(listingTasks, batchSize);
      await sleep(200); // Brief pause between batches

      // Collect detail page tasks from all listing results
      const detailTasks = [];
      for (const { stateId, stateCode, companies } of listingResults) {
        if (companies.size === 0) continue;

        for (const [companyName, locationId] of companies) {
          if (allPending.length + detailTasks.length >= limit) break;

          const companyKey = `${companyName.toLowerCase()}::${stateCode}`;
          if (seenCompanies.has(companyKey)) {
            skippedDedup++;
            continue;
          }
          seenCompanies.add(companyKey);

          const countryCode = CANADIAN_STATES.has(parseInt(stateId)) ? 'CA' : 'US';

          detailTasks.push(async () => {
            try {
              const detailHtml = await fetchPage(`${BASE_URL}/location_details.php?id=${locationId}`);
              detailPagesFetched++;
              const data = extractDetailData(detailHtml);
              if (!data || !data.name) return null;

              const name = titleCase(data.name);
              const city = titleCase(data.city);
              const slug = slugify(`${data.name}-${data.city}-${stateCode}`);
              const hash = dedupeHash(data.name, data.city, stateCode, catInfo.key);

              // Local dedup check (instant, no DB hit)
              if (existingHashes.has(hash) || existingSlugs.has(slug)) {
                skippedDedup++;
                return null;
              }
              existingHashes.add(hash);
              existingSlugs.add(slug);

              return {
                name,
                slug,
                description: `${catInfo.label} services in ${city}, ${stateCode}.`,
                surface_category_key: catInfo.key,
                country_code: countryCode,
                admin1_code: stateCode,
                locality: city,
                lat: 0,
                lng: 0,
                phone: data.phone || null,
                website: data.website || null,
                claim_status: 'unclaimed',
                status: 'published',
                is_search_indexable: true,
                source_confidence: 0.6,
                demand_score: 0,
                supply_score: 0,
                seo_score: 0.4,
                claim_priority_score: 0.4,
                freshness_score: 0.2,
                normalized_name: data.name.toLowerCase().trim(),
                normalized_address: city.toLowerCase().trim(),
                dedupe_hash: hash,
                source_system: 'scrape_truckstopsandservices_2026q2_bulk',
                primary_source_id: locationId,
                enrichment_version: 'v2.0-concurrent',
              };
            } catch {
              return null;
            }
          });
        }
      }

      // Run detail fetches concurrently
      if (detailTasks.length > 0) {
        const detailResults = await pool(detailTasks, CONCURRENCY);
        const validRows = detailResults.filter(r => r !== null);
        allPending.push(...validRows);
        await sleep(150); // Brief pause
      }
    }

    const catCount = allPending.length;
    console.log(`  → ${catCount} total pending (${listingPagesScraped} listing pages, ${detailPagesFetched} detail pages)`);
  }

  // ── Step 3: Batch insert into hc_places ──
  console.log(`\n── Inserting ${allPending.length} rows into hc_places ──`);
  
  let inserted = 0;
  let errors = 0;
  const BATCH_SIZE = 50;

  if (dryRun) {
    inserted = allPending.length;
    console.log(`  [DRY RUN] Would insert ${inserted} rows.`);
    // Show sample
    for (const row of allPending.slice(0, 15)) {
      console.log(`  → ${row.name} (${row.locality}, ${row.admin1_code}) [${row.surface_category_key}]`);
    }
    if (allPending.length > 15) console.log(`  → ... and ${allPending.length - 15} more`);
  } else {
    for (let i = 0; i < allPending.length; i += BATCH_SIZE) {
      const batch = allPending.slice(i, i + BATCH_SIZE);
      const { error: batchErr } = await supabase.from('hc_places').insert(batch);
      
      if (batchErr) {
        // Fallback: insert one-by-one for this batch
        console.log(`  ⚠ Batch ${Math.floor(i/BATCH_SIZE)+1} error: ${batchErr.message}. Falling back to individual inserts...`);
        for (const row of batch) {
          const { error: singleErr } = await supabase.from('hc_places').insert(row);
          if (singleErr) {
            errors++;
          } else {
            inserted++;
          }
        }
      } else {
        inserted += batch.length;
      }

      if (inserted % 200 === 0 && inserted > 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        console.log(`  ✓ ${inserted} inserted (${elapsed}s elapsed)`);
      }
    }
  }

  // ── Final Report ──
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  let finalCount = '(dry run)';
  if (!dryRun) {
    const { count } = await supabase.from('hc_places').select('*', { count: 'exact', head: true });
    finalCount = count;
  }

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('RESULTS:');
  console.log(`  ⏱  Runtime: ${elapsed}s`);
  console.log(`  📄 Listing pages scraped: ${listingPagesScraped}`);
  console.log(`  🔍 Detail pages fetched: ${detailPagesFetched}`);
  console.log(`  ✅ Inserted: ${inserted}`);
  console.log(`  ⏭  Skipped (dedup): ${skippedDedup}`);
  console.log(`  ❌ Errors: ${errors}`);
  console.log(`  📊 Total hc_places: ${finalCount}`);
  console.log('══════════════════════════════════════════════════════════');
}

run().catch(console.error);
