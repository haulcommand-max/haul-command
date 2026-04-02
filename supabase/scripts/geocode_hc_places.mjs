/**
 * FREE GEOCODER — Backfill lat/lng for hc_places entries with lat=0 lng=0
 * 
 * Uses FREE Nominatim (OpenStreetMap) geocoding API.
 * Rate limit: 1 request/second (their policy for free use)
 * 
 * Strategy:
 *   1. Load all unique (city, state) combos from hc_places where lat=0
 *   2. Geocode each unique combo once (not each row!)
 *   3. Batch update all rows with matching city+state
 * 
 * This reduces 14,825 API calls → ~1,500-2,000 unique city lookups
 * Runtime: ~25-35 minutes at 1 req/sec
 * Cost: $0
 * 
 * Usage:
 *   node supabase/scripts/geocode_hc_places.mjs              # Full run
 *   node supabase/scripts/geocode_hc_places.mjs --dry-run     # Preview
 *   node supabase/scripts/geocode_hc_places.mjs --limit=50    # Test batch
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';

const SUPABASE_URL = 'https://hvjyfyzotqobfkakjozp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ0NjMxNSwiZXhwIjoyMDg3MDIyMzE1fQ.xG-oo7qSFevW1JO9GVwd005ZXAMht86_C7P8RRHJ938';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Nominatim free geocoder (OpenStreetMap)
function geocodeCity(city, stateCode, countryCode) {
  return new Promise((resolve, reject) => {
    // Clean city name (remove highway refs like "I-35E Exit 308")
    let cleanCity = city.replace(/I-\d+[A-Z]?\s*Exit\s*\d+/gi, '').trim();
    if (!cleanCity || cleanCity.length < 2) cleanCity = city;
    
    const query = encodeURIComponent(`${cleanCity}, ${stateCode}, ${countryCode}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=${countryCode.toLowerCase()}`;
    
    https.get(url, {
      headers: {
        'User-Agent': 'HaulCommand-Geocoder/1.0 (directory@haulcommand.com)',
        'Accept': 'application/json',
      },
      timeout: 10000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data && data.length > 0) {
            resolve({
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
              display: data[0].display_name,
            });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
      res.on('error', () => resolve(null));
    }).on('error', () => resolve(null));
  });
}

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;

  const startTime = Date.now();
  console.log('══════════════════════════════════════════════════════════');
  console.log('FREE GEOCODER — Nominatim (OpenStreetMap) → hc_places');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '🔴 LIVE UPDATE'}`);
  console.log(`Limit: ${limit === Infinity ? 'none' : limit}`);
  console.log('══════════════════════════════════════════════════════════\n');

  // Step 1: Get all unique (locality, admin1_code, country_code) combos where lat=0
  console.log('Step 1: Loading unique city/state combos needing geocoding...');
  
  // Fetch all rows with lat=0 lng=0
  const allRows = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data } = await supabase
      .from('hc_places')
      .select('id, locality, admin1_code, country_code')
      .eq('lat', 0)
      .eq('lng', 0)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    page++;
    if (data.length < pageSize) break;
  }
  
  console.log(`  → ${allRows.length} rows need geocoding`);

  // Group by unique city+state+country
  const cityGroups = new Map(); // "city::state::country" → [ids]
  for (const row of allRows) {
    const key = `${(row.locality || '').toLowerCase()}::${row.admin1_code || ''}::${row.country_code || 'US'}`;
    if (!cityGroups.has(key)) {
      cityGroups.set(key, {
        city: row.locality,
        state: row.admin1_code,
        country: row.country_code || 'US',
        ids: [],
      });
    }
    cityGroups.get(key).ids.push(row.id);
  }

  const uniqueCities = [...cityGroups.values()];
  console.log(`  → ${uniqueCities.length} unique city/state combos to geocode`);
  console.log(`  → Estimated time: ${Math.ceil(uniqueCities.length / 60)} minutes\n`);

  // Step 2: Geocode each unique city
  let geocoded = 0;
  let failed = 0;
  let rowsUpdated = 0;

  for (let i = 0; i < uniqueCities.length && geocoded + failed < limit; i++) {
    const { city, state, country, ids } = uniqueCities[i];
    
    // Rate limit: 1 req/sec for Nominatim
    await sleep(1100);
    
    const result = await geocodeCity(city, state, country);
    
    if (result && result.lat && result.lng) {
      geocoded++;
      
      if (dryRun) {
        if (geocoded <= 10) {
          console.log(`  ✓ ${city}, ${state} → ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)} (${ids.length} rows)`);
        }
      } else {
        // Batch update all rows with this city+state
        // Supabase doesn't support WHERE IN with large arrays, so batch by 100
        for (let j = 0; j < ids.length; j += 100) {
          const batch = ids.slice(j, j + 100);
          const { error } = await supabase
            .from('hc_places')
            .update({ lat: result.lat, lng: result.lng })
            .in('id', batch);
          if (error) {
            console.log(`  ✗ Update error for ${city}, ${state}: ${error.message}`);
          } else {
            rowsUpdated += batch.length;
          }
        }
        
        if (geocoded % 50 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
          const remaining = Math.ceil((uniqueCities.length - i) * 1.1);
          console.log(`  ✓ [${geocoded}/${uniqueCities.length}] ${city}, ${state} → ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)} | ${rowsUpdated} rows updated (${elapsed}s, ~${remaining}s remaining)`);
        }
      }
    } else {
      failed++;
      if (failed <= 5 || failed % 50 === 0) {
        console.log(`  ✗ [${failed}] Could not geocode: "${city}", ${state}, ${country}`);
      }
    }
  }

  // Step 3: Final count
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  let remainingZero = '(dry run)';
  if (!dryRun) {
    const { count } = await supabase
      .from('hc_places')
      .select('*', { count: 'exact', head: true })
      .eq('lat', 0)
      .eq('lng', 0);
    remainingZero = count;
  }

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('GEOCODING RESULTS:');
  console.log(`  ⏱  Runtime: ${elapsed}s`);
  console.log(`  🌍 Unique cities geocoded: ${geocoded}`);
  console.log(`  ❌ Failed lookups: ${failed}`);
  console.log(`  📍 Rows updated with coordinates: ${rowsUpdated}`);
  console.log(`  🔲 Remaining with lat=0: ${remainingZero}`);
  console.log('══════════════════════════════════════════════════════════');
}

run().catch(console.error);
