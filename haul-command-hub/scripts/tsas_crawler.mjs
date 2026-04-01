/**
 * TSAS Crawler — TruckStopsAndServices.com → Haul Command Ingestion
 * 
 * Phase 1: Crawl category+state index pages to extract entity names + source_ids
 * Phase 2: Crawl detail pages for each entity to extract rich data
 * Phase 3: Upsert into Supabase hc_source_tsas table
 * 
 * Usage:
 *   node scripts/tsas_crawler.mjs                  # Pilot car categories only (default)
 *   node scripts/tsas_crawler.mjs --all            # All 47 categories
 *   node scripts/tsas_crawler.mjs --cat 27         # Specific category
 *   node scripts/tsas_crawler.mjs --cat 27 --state 45  # Specific category + state
 *   node scripts/tsas_crawler.mjs --detail-only    # Skip index, only detail pages for existing records
 *   node scripts/tsas_crawler.mjs --dry-run        # Don't write to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// ─── Dynamic import of shared config ─────────────────────────────
const categoryMapPath = pathToFileURL(path.resolve(__dirname, '..', 'src', 'lib', 'tsas-category-map.mjs')).href;
const {
  TSAS_CATEGORY_MAP,
  TSAS_STATE_MAP,
  STATE_TO_COUNTRY,
  titleCase,
  normalizePhone,
  detectChain,
} = await import(categoryMapPath);

// ─── Config ──────────────────────────────────────────────────────
const BASE_URL = 'https://www.truckstopsandservices.com';
const RATE_LIMIT_MS = 1200;  // 1.2s between requests — be respectful
const MAX_RETRIES = 3;

const CORE_CATEGORIES = [27, 92]; // Pilot Car Companies, Pilot Car Services

// ─── Supabase client ─────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── CLI args ────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ALL_CATS = args.includes('--all');
const DETAIL_ONLY = args.includes('--detail-only');
const catIdx = args.indexOf('--cat');
const stateIdx = args.indexOf('--state');
const SPECIFIC_CAT = catIdx >= 0 ? parseInt(args[catIdx + 1]) : null;
const SPECIFIC_STATE = stateIdx >= 0 ? parseInt(args[stateIdx + 1]) : null;

// ─── Helpers ─────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'HaulCommand-Indexer/1.0 (contact@haulcommand.com)' }
      });
      if (res.ok) return await res.text();
      console.warn(`  ⚠ HTTP ${res.status} for ${url} (attempt ${i + 1})`);
    } catch (err) {
      console.warn(`  ⚠ Fetch error for ${url}: ${err.message} (attempt ${i + 1})`);
    }
    await sleep(2000 * (i + 1));
  }
  return null;
}

/**
 * Extract source_ids and names from a category+state listing page.
 * Page structure: links like /location_details.php?id=NNNNN with text = BUSINESS NAME
 */
function parseListingPage(html) {
  const entries = [];
  const regex = /location_details\.php\?id=(\d+)[^>]*>([^<]+)</gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const sourceId = parseInt(match[1]);
    const rawName = match[2].trim();
    // Skip nav/footer noise
    if (rawName.length < 3 || rawName.includes('Learn More')) continue;
    entries.push({ sourceId, rawName });
  }
  return entries;
}

/**
 * Extract detail fields from a location detail page.
 * Source uses structured <div class='locdetinfo'> elements and JSON-LD.
 */
function parseDetailPage(html, sourceId) {
  const detail = { sourceId };

  // Title: "Business Name | CITY, ST ZIP | Truck Stop/Service Directory"
  const titleMatch = html.match(/<title>([^|]+)\|([^|]+)\|/i);
  if (titleMatch) {
    detail.name = titleMatch[1].trim();
    const locationPart = titleMatch[2].trim();
    const locMatch = locationPart.match(/^([A-Z\s.'\-]+),\s*([A-Z]{2})\s*(\d{5})?/);
    if (locMatch) {
      detail.city = locMatch[1].trim();
      detail.admin1Code = locMatch[2];
      detail.postalCode = locMatch[3] || null;
    }
  }

  // ─── Structured locdetinfo fields ─────────────────────────────
  // Source uses: <div class='locdetinfo'><b>Highway:</b> I-20</div>
  const extractField = (label) => {
    const m = html.match(new RegExp(`<b>${label}:?</b>\\s*([^<]+)`, 'i'));
    return m ? m[1].trim() : null;
  };

  detail.highway = extractField('Highway');
  detail.exit = extractField('Exit');
  detail.city = detail.city || extractField('City');
  detail.admin1Code = detail.admin1Code || extractField('State');
  detail.address = extractField('Address') || extractField('Street');

  // Phone fields — source has Phone, Phone 2, Fax as separate labeled fields
  const phoneRaw = extractField('Phone');
  if (phoneRaw) detail.phone = phoneRaw.replace(/\s*\(.*$/, '').trim(); // strip "(UKIAH)" office labels
  
  const phone2 = extractField('Phone 2');
  if (phone2) detail.phone2 = phone2.replace(/\s*\(.*$/, '').trim();

  const faxRaw = extractField('Fax');
  if (faxRaw) detail.fax = faxRaw;

  // Fallback phone extraction from any pattern in the body
  if (!detail.phone) {
    const phoneMatch = html.match(/(\(\d{3}\)\s*\d{3}[.-]\d{4})/) ||
                       html.match(/(\d{3}[.-]\d{3}[.-]\d{4})/);
    if (phoneMatch) detail.phone = phoneMatch[1].trim();
  }

  // Email: mailto link
  const emailMatch = html.match(/mailto:([^"'\s]+)/i);
  if (emailMatch) detail.email = emailMatch[1].trim();

  // Website: try JSON-LD first (most reliable), then external hrefs
  const jsonLdUrlMatch = html.match(/"url"\s*:\s*"(https?:\/\/[^"]+)"/i);
  if (jsonLdUrlMatch && !/truckstopsandservices/i.test(jsonLdUrlMatch[1])) {
    detail.website = jsonLdUrlMatch[1];
  }
  // Fallback: scan all href attributes (single or double quoted)
  if (!detail.website) {
    const SKIP_DOMAINS = /truckstopsandservices|play\.google|itunes\.apple|ahfx\.net|rvandtravelers|google\.com|googleapis|google-analytics/i;
    const hrefMatches = html.matchAll(/href=['"](https?:\/\/[^'"]+)['"]/gi);
    for (const wm of hrefMatches) {
      const href = wm[1];
      if (!SKIP_DOMAINS.test(href) && !href.includes('mailto:')) {
        detail.website = href;
        break;
      }
    }
  }

  // Lat/lon from Google Maps static map link
  const latLonMatch = html.match(/center=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (latLonMatch) {
    detail.lat = parseFloat(latLonMatch[1]);
    detail.lon = parseFloat(latLonMatch[2]);
  }

  // Payment methods: look for a comma-separated list after known payment keywords
  const paymentMatch = html.match(/((?:American Express|Cash|Com ?Check|Visa|MasterCard|Discover|Debit|EFS|Fleet One|T-Check|TCH|Money Order|PayPal)[^<]{10,})/i);
  if (paymentMatch) {
    detail.paymentMethods = paymentMatch[1].split(',').map(s => s.trim()).filter(Boolean);
  }

  // Description: largest text block
  const descBlocks = html.match(/<p[^>]*>([^<]{50,})<\/p>/gi);
  if (descBlocks) {
    // Find the longest paragraph that isn't the app promo
    const desc = descBlocks
      .map(b => b.replace(/<[^>]+>/g, '').trim())
      .filter(t => !t.includes('fantastic app') && !t.includes('Google Play'))
      .sort((a, b) => b.length - a.length)[0];
    if (desc) detail.description = desc;
  }

  // 24/7 detection
  if (html.match(/24\s*\/?\s*7|24\s*hours?|open\s*24/i)) {
    detail.is247 = true;
  }

  // Service radius from description
  const radiusMatch = (detail.description || '').match(/(\d+)\s*(?:mile|mi)\s*radius/i);
  if (radiusMatch) detail.serviceRadius = parseInt(radiusMatch[1]);

  // Sponsored detection — look for listing-level sponsor markup
  // NOTE: Every page has a "Thanks to the Following Sponsors" footer — ignore that.
  // Only detect if THIS listing has sponsor/featured CSS classes or badges on its own content.
  const sponsorPatterns = [
    /class="[^"]*sponsor[^"]*listing/i,          // "sponsor_listing" class
    /class="[^"]*featured[^"]*listing/i,          // "featured_listing" class
    /class="[^"]*premium[^"]*member/i,            // "premium_member" class
    /id="[^"]*sponsor[^"]*listing/i,              // sponsor listing ID
    /<span[^>]*>\s*(?:state\s*sponsor|featured\s*listing)\s*<\/span>/i,  // labeled badge
  ];
  detail.isSponsored = sponsorPatterns.some(p => p.test(html));

  // Feedback link
  if (html.includes('act=leavefeedback')) {
    detail.hasFeedbackLink = true;
  }

  // Review text parsing from page
  const reviewRegex = /Posted for location:\s*#\d+\s*-\s*\[([^\]]+)\]/gi;
  // Reviews are mostly on the homepage, not detail pages, but capture if present

  return detail;
}

// ─── Phase 1: Index Crawl ────────────────────────────────────────
async function crawlCategoryStateIndex(catId, stateId) {
  const url = `${BASE_URL}/listcatbusinesses.php?id=${catId}&state=${stateId}`;
  const html = await fetchWithRetry(url);
  if (!html) return [];
  
  const entries = parseListingPage(html);
  const stateCode = TSAS_STATE_MAP[stateId];
  const catConfig = TSAS_CATEGORY_MAP[catId];
  
  return entries.map(e => ({
    ...e,
    stateCode,
    countryCode: STATE_TO_COUNTRY[stateCode] || 'US',
    catId,
    catLabel: catConfig?.label || `Unknown (${catId})`,
    hcType: catConfig?.hc_type || 'unknown',
    isMobile: catConfig?.isMobile || false,
    isCore: catConfig?.isCore || false,
  }));
}

async function runPhase1(categories) {
  console.log('\n═══ PHASE 1: Category Index Crawl ═══\n');
  
  const allEntries = [];
  const stateIds = SPECIFIC_STATE ? [SPECIFIC_STATE] : Object.keys(TSAS_STATE_MAP).map(Number);
  
  for (const catId of categories) {
    const catConfig = TSAS_CATEGORY_MAP[catId];
    console.log(`📂 Category ${catId}: ${catConfig?.label || 'Unknown'}`);
    
    for (const stateId of stateIds) {
      const stateCode = TSAS_STATE_MAP[stateId];
      process.stdout.write(`  → ${stateCode}... `);
      
      const entries = await crawlCategoryStateIndex(catId, stateId);
      console.log(`${entries.length} entries`);
      
      for (const entry of entries) {
        // Check if this source_id already exists in our collected set
        const existing = allEntries.find(e => e.sourceId === entry.sourceId);
        if (existing) {
          // Same entity listed in another state — track multi-state coverage
          if (!existing.statesListedIn) existing.statesListedIn = [existing.stateCode];
          if (!existing.statesListedIn.includes(entry.stateCode)) {
            existing.statesListedIn.push(entry.stateCode);
          }
        } else {
          entry.statesListedIn = [entry.stateCode];
          allEntries.push(entry);
        }
      }
      
      await sleep(RATE_LIMIT_MS);
    }
    
    console.log(`  ✅ ${allEntries.length} unique entities so far\n`);
  }
  
  return allEntries;
}

// ─── Phase 2: Detail Page Crawl ──────────────────────────────────
async function runPhase2(entries) {
  console.log('\n═══ PHASE 2: Detail Page Crawl ═══\n');
  console.log(`  Processing ${entries.length} entities...\n`);
  
  const enriched = [];
  let count = 0;
  
  for (const entry of entries) {
    count++;
    const url = `${BASE_URL}/location_details.php?id=${entry.sourceId}`;
    process.stdout.write(`  [${count}/${entries.length}] ${entry.rawName}... `);
    
    const html = await fetchWithRetry(url);
    if (!html) {
      console.log('SKIP (fetch failed)');
      enriched.push(entry); // keep index-only data
      continue;
    }
    
    const detail = parseDetailPage(html, entry.sourceId);
    
    // Merge detail onto entry (detail fields override index fields)
    const merged = {
      ...entry,
      name: detail.name || entry.rawName,
      city: detail.city || null,
      admin1Code: detail.admin1Code || entry.stateCode,
      postalCode: detail.postalCode || null,
      address: detail.address || null,
      highway: detail.highway || null,
      exit: detail.exit || null,
      lat: detail.lat || null,
      lon: detail.lon || null,
      phone: detail.phone || null,
      phone2: detail.phone2 || null,
      fax: detail.fax || null,
      email: detail.email || null,
      website: detail.website || null,
      paymentMethods: detail.paymentMethods || null,
      description: detail.description || null,
      is247: detail.is247 || false,
      serviceRadius: detail.serviceRadius || null,
      isSponsored: detail.isSponsored || false,
    };
    
    const flags = [
      merged.phone ? '📞' : '',
      merged.email ? '📧' : '',
      merged.website ? '🌐' : '',
      merged.lat ? '📍' : '',
      merged.highway ? '🛣️' : '',
      merged.isSponsored ? '⭐' : '',
    ].filter(Boolean).join(' ');
    console.log(`OK ${flags}`);
    enriched.push(merged);
    
    await sleep(RATE_LIMIT_MS);
  }
  
  return enriched;
}

// ─── Phase 3: Supabase Upsert ────────────────────────────────────
async function runPhase3(entries) {
  console.log('\n═══ PHASE 3: Supabase Upsert ═══\n');
  
  if (DRY_RUN) {
    console.log('  🔒 DRY RUN — skipping Supabase writes');
    console.log(`  Would upsert ${entries.length} records`);
    
    // Print summary
    const byType = {};
    for (const e of entries) {
      byType[e.hcType] = (byType[e.hcType] || 0) + 1;
    }
    console.log('\n  Entity type breakdown:');
    for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${type}: ${count}`);
    }
    
    const withPhone = entries.filter(e => e.phone).length;
    const withEmail = entries.filter(e => e.email).length;
    const withWebsite = entries.filter(e => e.website).length;
    const withHighway = entries.filter(e => e.highway).length;
    const withLatLon = entries.filter(e => e.lat && e.lon).length;
    const multiState = entries.filter(e => e.statesListedIn?.length > 1).length;
    const sponsored = entries.filter(e => e.isSponsored).length;
    
    console.log(`\n  📊 Data quality:`);
    console.log(`    Has phone:    ${withPhone}/${entries.length} (${Math.round(withPhone/entries.length*100)}%)`);
    console.log(`    Has email:    ${withEmail}/${entries.length} (${Math.round(withEmail/entries.length*100)}%)`);
    console.log(`    Has website:  ${withWebsite}/${entries.length} (${Math.round(withWebsite/entries.length*100)}%)`);
    console.log(`    Has highway:  ${withHighway}/${entries.length} (${Math.round(withHighway/entries.length*100)}%)`);
    console.log(`    Has lat/lon:  ${withLatLon}/${entries.length} (${Math.round(withLatLon/entries.length*100)}%)`);
    console.log(`    Multi-state:  ${multiState}/${entries.length} (${Math.round(multiState/entries.length*100)}%)`);
    console.log(`    Sponsored:    ${sponsored}/${entries.length}`);
    
    return;
  }
  
  // Batch upsert in chunks of 100
  const BATCH_SIZE = 100;
  let upserted = 0;
  
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE).map(e => ({
      source_id: e.sourceId,
      source_url: `${BASE_URL}/location_details.php?id=${e.sourceId}`,
      source_category_id: e.catId,
      source_category_label: e.catLabel,
      hc_entity_type: e.hcType,
      name: e.name || e.rawName,
      name_normalized: titleCase(e.name || e.rawName),
      city: e.city,
      admin1_code: e.admin1Code || e.stateCode,
      postal_code: e.postalCode,
      country_code: e.countryCode || 'US',
      phone_primary: e.phone,
      phone_normalized: normalizePhone(e.phone),
      fax: e.fax,
      email: e.email,
      website_url: e.website,
      payment_methods: e.paymentMethods,
      raw_description: e.description,
      is_mobile_service: e.isMobile,
      is_24_7: e.is247,
      is_sponsored: e.isSponsored,
      service_radius_miles: e.serviceRadius,
      chain_brand: detectChain(e.name || e.rawName),
      is_chain: detectChain(e.name || e.rawName) !== null,
      states_listed_in: e.statesListedIn,
      claim_priority: e.isCore
        ? (e.isSponsored ? 'critical' : (e.email ? 'critical' : 'high'))
        : (e.isSponsored ? 'high' : 'medium'),
    }));
    
    const { error } = await supabase
      .from('hc_source_tsas')
      .upsert(batch, { onConflict: 'source_id', ignoreDuplicates: false });
    
    if (error) {
      console.error(`  ❌ Upsert batch ${i}–${i + batch.length} failed:`, error.message);
    } else {
      upserted += batch.length;
      process.stdout.write(`  ✅ ${upserted}/${entries.length}\r`);
    }
  }
  
  console.log(`\n  📦 Upserted ${upserted} records to hc_source_tsas`);
  
  // Also upsert service area edges
  const serviceAreas = [];
  for (const e of entries) {
    if (e.statesListedIn) {
      for (const state of e.statesListedIn) {
        serviceAreas.push({
          source_id: e.sourceId,
          admin1_code: state,
          country_code: STATE_TO_COUNTRY[state] || 'US',
          is_home_state: state === (e.admin1Code || e.stateCode),
        });
      }
    }
  }
  
  if (serviceAreas.length > 0) {
    for (let i = 0; i < serviceAreas.length; i += BATCH_SIZE) {
      const batch = serviceAreas.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('hc_tsas_service_areas')
        .upsert(batch, { onConflict: 'source_id,admin1_code', ignoreDuplicates: true });
      
      if (error && !error.message.includes('duplicate')) {
        console.error(`  ⚠ Service area batch error:`, error.message);
      }
    }
    console.log(`  🗺️  Upserted ${serviceAreas.length} service area edges`);
  }
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('🚛 TSAS Crawler — TruckStopsAndServices.com → Haul Command');
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`   Rate limit: ${RATE_LIMIT_MS}ms between requests\n`);
  
  // Determine which categories to crawl
  let categories;
  if (SPECIFIC_CAT) {
    categories = [SPECIFIC_CAT];
  } else if (ALL_CATS) {
    categories = Object.keys(TSAS_CATEGORY_MAP).map(Number);
  } else {
    categories = CORE_CATEGORIES;
  }
  
  console.log(`   Categories: ${categories.map(c => `${c} (${TSAS_CATEGORY_MAP[c]?.label || '?'})`).join(', ')}`);
  
  let entries;
  
  if (DETAIL_ONLY) {
    // Load existing records from Supabase that need detail enrichment
    console.log('\n   Loading existing records needing detail enrichment...');
    const { data, error } = await supabase
      .from('hc_source_tsas')
      .select('source_id, name, admin1_code, hc_entity_type, source_category_id')
      .is('phone_primary', null)
      .in('source_category_id', categories)
      .limit(500);
    
    if (error) {
      console.error('Failed to load existing records:', error.message);
      process.exit(1);
    }
    
    entries = (data || []).map(r => ({
      sourceId: r.source_id,
      rawName: r.name,
      stateCode: r.admin1_code,
      catId: r.source_category_id,
      hcType: r.hc_entity_type,
      isMobile: TSAS_CATEGORY_MAP[r.source_category_id]?.isMobile || false,
      isCore: TSAS_CATEGORY_MAP[r.source_category_id]?.isCore || false,
    }));
    
    console.log(`   Loaded ${entries.length} records`);
  } else {
    entries = await runPhase1(categories);
  }
  
  // Phase 2: enrich with detail pages
  const enriched = await runPhase2(entries);
  
  // Phase 3: persist to Supabase
  await runPhase3(enriched);
  
  console.log('\n🏁 Crawl complete.\n');
  
  // Final summary
  const coreEntities = enriched.filter(e => e.isCore);
  if (coreEntities.length > 0) {
    console.log(`🎯 CORE VERTICAL: ${coreEntities.length} pilot car operators/services found`);
    console.log(`   States covered: ${[...new Set(coreEntities.flatMap(e => e.statesListedIn || []))].sort().join(', ')}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
