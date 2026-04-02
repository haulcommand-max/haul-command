/**
 * BULK SCRAPER — TruckStopsAndServices.com → hc_places
 * 
 * Architecture:
 *   1. Fetch category listing pages (46 categories × 52 states = ~2,400 pages)
 *   2. Extract unique location_details.php?id=XXXXX links
 *   3. Deduplicate by company name (same company has multiple location IDs for coverage areas)
 *   4. Fetch each unique detail page for structured data
 *   5. Insert into hc_places with dedup_hash check
 * 
 * Rate limit: 500ms between requests to be respectful
 * 
 * Usage: node supabase/scripts/bulk_scrape_truckstops.mjs [--category=29] [--state=45] [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';

const SUPABASE_URL = 'https://hvjyfyzotqobfkakjozp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ0NjMxNSwiZXhwIjoyMDg3MDIyMzE1fQ.xG-oo7qSFevW1JO9GVwd005ZXAMht86_C7P8RRHJ938';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BASE_URL = 'https://www.truckstopsandservices.com';

// ── Category → surface_category_key mapping ──
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
  99:  { key: 'cold_storage', label: 'Load Storage - Cold or Dry' },
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

// ── State ID → state code mapping ──
const STATE_MAP = {
  1: 'AL', 2: 'AR', 3: 'AZ', 5: 'CA', 6: 'CO', 7: 'CT', 8: 'DE', 9: 'FL', 10: 'GA',
  11: 'IA', 12: 'ID', 13: 'IL', 14: 'IN', 15: 'KS', 16: 'KY', 17: 'LA', 18: 'MA',
  19: 'MD', 20: 'ME', 21: 'MI', 22: 'MN', 23: 'MO', 24: 'MS', 25: 'MT', 26: 'NC',
  27: 'ND', 28: 'NE', 29: 'NH', 30: 'NJ', 31: 'NM', 33: 'NV', 34: 'NY', 35: 'OH',
  36: 'OK', 37: 'ON', 38: 'OR', 39: 'PA', 41: 'RI', 42: 'SC', 43: 'SD', 44: 'TN',
  45: 'TX', 46: 'UT', 47: 'VA', 48: 'VT', 49: 'WI', 50: 'WV', 51: 'WA', 52: 'WY',
  64: 'DC',
};

// Canadian state 37 = ON (Ontario) — set country_code accordingly
const CANADIAN_STATES = new Set([37]);

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function dedupeHash(name, city, state, type) {
  return `${slugify(name)}::${slugify(city || '')}::${slugify(state || '')}::${type}`;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'HaulCommand-DirectoryBot/1.0' } }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Extract unique location IDs from category listing page HTML
function extractLocationIds(html) {
  const regex = /location_details\.php\?id=(\d+)/g;
  const ids = new Set();
  let match;
  while ((match = regex.exec(html)) !== null) {
    ids.add(match[1]);
  }
  return [...ids];
}

// Extract structured data from a detail page HTML
function extractDetailData(html, locationId) {
  // Title has: "Company Name | CITY, ST | ..."
  const titleMatch = html.match(/<title>([^|]+)\|([^|]+)\|/);
  if (!titleMatch) return null;

  const name = titleMatch[1].trim().replace(/&amp;/g, '&');
  const locationPart = titleMatch[2].trim();
  const cityStateMatch = locationPart.match(/^([^,]+),\s*(\w{2})/);
  const city = cityStateMatch ? cityStateMatch[1].trim() : locationPart;
  const state = cityStateMatch ? cityStateMatch[2].trim() : '';

  // Phone — look for tel: links or phone-like patterns
  const phoneMatch = html.match(/tel:([^"]+)"/);
  const phone = phoneMatch ? phoneMatch[1].replace(/[^\d-+().\s]/g, '').trim() : null;

  // Website — look for external links (http that's not truckstopsandservices)
  const websiteMatch = html.match(/href="(https?:\/\/(?!www\.truckstopsandservices)[^"]+)"/i);
  const website = websiteMatch ? websiteMatch[1] : null;

  // Address — look for structured address content
  const addressMatch = html.match(/(\d+[^<]*(?:St|Ave|Rd|Dr|Blvd|Hwy|Highway|Pkwy|Ln|Way|Ct|Cir|Pl|Loop|Fwy|I-\d+)[^<]*)/i);
  const address = addressMatch ? addressMatch[1].trim().substring(0, 200) : null;

  // Services/description — Extract from service list or description blocks
  const servicesMatch = html.match(/Services Offered[:\s]*<\/[^>]+>([\s\S]*?)<\/div>/i);
  const services = servicesMatch ? servicesMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 500) : null;

  // Payment methods
  const paymentMatch = html.match(/(American Express|Cash|Comdata|Visa|Mastercard|Discover|EFS|T-Check|TCH[^<]*)/i);
  const payments = paymentMatch ? paymentMatch[0].trim() : null;

  return {
    name,
    city,
    state,
    phone,
    website,
    address,
    services,
    payments,
    source_id: locationId,
  };
}

// ── Main ──
async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const categoryArg = args.find(a => a.startsWith('--category='));
  const stateArg = args.find(a => a.startsWith('--state='));
  const limitArg = args.find(a => a.startsWith('--limit='));

  const targetCategory = categoryArg ? parseInt(categoryArg.split('=')[1]) : null;
  const targetState = stateArg ? parseInt(stateArg.split('=')[1]) : null;
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;

  const categories = targetCategory ? { [targetCategory]: CATEGORY_MAP[targetCategory] } : CATEGORY_MAP;
  const states = targetState ? { [targetState]: STATE_MAP[targetState] } : STATE_MAP;

  console.log('══════════════════════════════════════════════════');
  console.log('BULK SCRAPER — TruckStopsAndServices.com → hc_places');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE INSERT'}`);
  console.log(`Categories: ${Object.keys(categories).length}`);
  console.log(`States: ${Object.keys(states).length}`);
  console.log(`Limit: ${limit === Infinity ? 'none' : limit}`);
  console.log('══════════════════════════════════════════════════\n');

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let totalDetailsFetched = 0;
  const seenCompanies = new Set(); // Track company+city combos to avoid multi-location duplicates

  for (const [catId, catInfo] of Object.entries(categories)) {
    if (totalInserted >= limit) break;

    console.log(`\n── Category: ${catInfo.label} (${catInfo.key}) ──`);

    for (const [stateId, stateCode] of Object.entries(states)) {
      if (totalInserted >= limit) break;

      const url = `${BASE_URL}/listcatbusinesses.php?id=${catId}&state=${stateId}`;
      
      try {
        await sleep(300); // Rate limit
        const html = await fetchPage(url);
        const locationIds = extractLocationIds(html);

        if (locationIds.length === 0) continue;

        // Extract unique company names from the listing page to group duplicates
        const companiesOnPage = new Map();
        const nameRegex = /\[([^\]]+)\]\(.*?location_details\.php\?id=(\d+)\)/g;
        // We already have the locationIds. For efficiency, only fetch the FIRST ID per company name.
        // Parse the HTML to extract company names
        const linkRegex = /<a[^>]*location_details\.php\?id=(\d+)[^>]*>([^<]+)<\/a>/gi;
        let linkMatch;
        while ((linkMatch = linkRegex.exec(html)) !== null) {
          const companyName = linkMatch[2].trim();
          const locId = linkMatch[1];
          if (!companiesOnPage.has(companyName)) {
            companiesOnPage.set(companyName, locId); // Only keep first occurrence
          }
        }

        const uniqueCompanies = companiesOnPage.size || locationIds.length;
        if (uniqueCompanies === 0) continue;

        console.log(`  ${stateCode}: ${locationIds.length} links → ${companiesOnPage.size} unique companies`);

        // Fetch detail pages for each unique company
        const detailIds = companiesOnPage.size > 0 ? [...companiesOnPage.values()] : [locationIds[0]];

        for (const detailId of detailIds) {
          if (totalInserted >= limit) break;

          try {
            await sleep(500); // Rate limit for detail pages
            const detailHtml = await fetchPage(`${BASE_URL}/location_details.php?id=${detailId}`);
            totalDetailsFetched++;

            const data = extractDetailData(detailHtml, detailId);
            if (!data || !data.name) {
              totalErrors++;
              continue;
            }

            // Skip if we've already seen this company+city
            const companyKey = `${data.name.toLowerCase()}::${data.city.toLowerCase()}`;
            if (seenCompanies.has(companyKey)) {
              totalSkipped++;
              continue;
            }
            seenCompanies.add(companyKey);

            const countryCode = CANADIAN_STATES.has(parseInt(stateId)) ? 'CA' : 'US';
            const slug = slugify(`${data.name}-${data.city}-${stateCode}`);
            const hash = dedupeHash(data.name, data.city, stateCode, catInfo.key);

            if (dryRun) {
              console.log(`    [DRY] ${data.name} (${data.city}, ${stateCode}) → /place/${slug}`);
              totalInserted++;
              continue;
            }

            // Check dedup
            const { data: existing } = await supabase
              .from('hc_places')
              .select('id')
              .eq('dedupe_hash', hash)
              .limit(1);

            if (existing && existing.length > 0) {
              totalSkipped++;
              continue;
            }

            // Also check slug
            const { data: existingSlug } = await supabase
              .from('hc_places')
              .select('id')
              .eq('slug', slug)
              .limit(1);

            if (existingSlug && existingSlug.length > 0) {
              totalSkipped++;
              continue;
            }

            // Build a description from available info
            const desc = data.services 
              ? `${data.services}${data.payments ? '. Accepts: ' + data.payments : ''}`
              : `${catInfo.label} services in ${data.city}, ${stateCode}.${data.payments ? ' Accepts: ' + data.payments : ''}`;

            const row = {
              name: data.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
              slug,
              description: desc.substring(0, 1000),
              surface_category_key: catInfo.key,
              country_code: countryCode,
              admin1_code: stateCode,
              locality: data.city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
              address_line1: data.address || null,
              lat: 0, // Will be geocoded later
              lng: 0, // Will be geocoded later
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
              normalized_address: (data.address || data.city || '').toLowerCase().trim(),
              dedupe_hash: hash,
              source_system: 'scrape_truckstopsandservices_2026q2_bulk',
              primary_source_id: detailId,
              enrichment_version: 'v1.0-bulk',
            };

            const { error: insertErr } = await supabase.from('hc_places').insert(row);
            if (insertErr) {
              console.log(`    ✗ ${data.name}: ${insertErr.message}`);
              totalErrors++;
            } else {
              totalInserted++;
              if (totalInserted % 50 === 0) {
                console.log(`    ✓ [${totalInserted}] ${row.name} (${row.locality}, ${stateCode})`);
              }
            }
          } catch (detailErr) {
            totalErrors++;
          }
        }
      } catch (err) {
        console.log(`    ✗ Failed to fetch ${stateCode}: ${err.message}`);
        totalErrors++;
      }
    }
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log(`RESULTS:`);
  console.log(`  Detail pages fetched: ${totalDetailsFetched}`);
  console.log(`  Inserted: ${totalInserted}`);
  console.log(`  Skipped (dedup): ${totalSkipped}`);
  console.log(`  Errors: ${totalErrors}`);
  
  if (!dryRun) {
    const { count } = await supabase.from('hc_places').select('*', { count: 'exact', head: true });
    console.log(`  Total hc_places: ${count}`);
  }
  console.log('══════════════════════════════════════════════════');
}

run().catch(console.error);
