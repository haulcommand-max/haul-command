/**
 * TRUCKER SERVICES DIRECTORY — Supabase Migration Runner v2
 * 
 * Targets hc_places (the actual Claimable Places Engine) — NOT the geographic 'places' table.
 * 
 * hc_places schema:
 *   id (uuid), name, slug, description, surface_category_key, surface_subcategory_key,
 *   country_code, admin1_code (state), admin2_name (county), locality (city),
 *   postal_code, address_line1, address_line2, lat, lng, phone, website,
 *   primary_source_type, primary_source_id, source_confidence,
 *   status, is_search_indexable, claim_status, claimed_by_user_id, claimed_at,
 *   claim_verified_at, demand_score, supply_score, seo_score, claim_priority_score,
 *   freshness_score, normalized_name, normalized_address, dedupe_hash,
 *   created_at, updated_at, hc_trust_number, source_system, enrichment_version
 * 
 * Usage: node supabase/scripts/run_trucker_services_migration.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hvjyfyzotqobfkakjozp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ0NjMxNSwiZXhwIjoyMDg3MDIyMzE1fQ.xG-oo7qSFevW1JO9GVwd005ZXAMht86_C7P8RRHJ938';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function dedupeHash(name, city, state, type) {
  return `${slugify(name)}::${slugify(city || '')}::${slugify(state || '')}::${type}`;
}

// ── BUSINESS LISTINGS ────────────────────────────────────────
const LISTINGS = [
  // TOWING TX
  { surface_category_key: 'tow_rotator', name: 'Allstar Towing', country_code: 'US', admin1_code: 'TX', locality: 'Bryan', address_line1: '1816 Drillers Dr, Bryan, TX 77808', phone: '979-778-4610', website: 'https://www.allstartowing.us', description: 'Heavy-duty towing, wrecker service, mobile repair, and tire repair in Bryan, TX.', lat: 30.6744, lng: -96.3698 },
  { surface_category_key: 'tow_rotator', name: 'AA&E Towing & Transport LLC', country_code: 'US', admin1_code: 'TX', locality: 'Dallas', address_line1: 'I-35E Exit 308, Dallas, TX', phone: '214-390-8697', description: 'Heavy-duty towing, transport, wrecker service, and recovery in Dallas, TX.', lat: 32.7767, lng: -96.7970 },
  { surface_category_key: 'tow_rotator', name: 'Captain Jacks Mobile Service', country_code: 'US', admin1_code: 'TX', locality: 'Canton', address_line1: '9645 I-20 Frontage Rd, Canton, TX 75103', phone: '903-477-3676', website: 'https://www.captainjacksroadsideservice.com', description: 'Mobile repair, towing, axle repair, and electrical services near Canton, TX.', lat: 32.5565, lng: -95.8633 },
  { surface_category_key: 'tow_rotator', name: 'Chacon Heavy Towing LLC', country_code: 'US', admin1_code: 'TX', locality: 'San Antonio', phone: '210-521-6277', description: 'Heavy-duty towing, recovery, and wrecker services in San Antonio, TX.', lat: 29.4241, lng: -98.4936 },
  { surface_category_key: 'tow_rotator', name: 'Chapman Wrecker & Truck Service', country_code: 'US', admin1_code: 'TX', locality: 'Amarillo', phone: '806-373-8603', description: 'Wrecker service, truck repair, and towing in Amarillo, TX.', lat: 35.2220, lng: -101.8313 },
  { surface_category_key: 'tow_rotator', name: 'K3 Towing & Recovery', country_code: 'US', admin1_code: 'TX', locality: 'Amarillo', phone: '806-335-0007', description: 'Heavy-duty towing, recovery, and wrecker service in Amarillo, TX.', lat: 35.2100, lng: -101.8400 },
  { surface_category_key: 'tow_rotator', name: 'Martin Heavy Duty Towing Inc', country_code: 'US', admin1_code: 'TX', locality: 'Waco', phone: '254-799-0575', description: 'Heavy-duty towing, recovery, and wrecker services in Waco, TX.', lat: 31.5493, lng: -97.1467 },
  { surface_category_key: 'tow_rotator', name: 'All Out Towing and Recovery LLC', country_code: 'US', admin1_code: 'TX', locality: 'Houston', phone: '281-310-7584', description: 'Heavy-duty towing, recovery, and wrecker services in Houston, TX.', lat: 29.7604, lng: -95.3698 },
  { surface_category_key: 'tow_rotator', name: 'Bob Douthit Autos Wrecker Service LLC', country_code: 'US', admin1_code: 'TX', locality: 'Fort Worth', phone: '817-246-2121', description: 'Wrecker service, heavy towing, and recovery in Fort Worth, TX.', lat: 32.7555, lng: -97.3308 },
  { surface_category_key: 'tow_rotator', name: 'Cedar Park Wrecker Service', country_code: 'US', admin1_code: 'TX', locality: 'Cedar Park', phone: '512-259-7879', description: 'Wrecker service and towing in Cedar Park, TX.', lat: 30.5052, lng: -97.8203 },
  { surface_category_key: 'tow_rotator', name: 'South Side Wrecker Service', country_code: 'US', admin1_code: 'TX', locality: 'San Antonio', phone: '210-921-9644', description: 'Heavy-duty wrecker and towing service in San Antonio, TX.', lat: 29.3890, lng: -98.5100 },
  // TRUCK STOPS TX
  { surface_category_key: 'truck_stop', name: '365 Travel Center', country_code: 'US', admin1_code: 'TX', locality: 'Fort Worth', address_line1: '3201 North Fwy, Fort Worth, TX 76106', phone: '817-624-3975', description: 'Full-service travel center with diesel, showers, parking, and CAT scale in Fort Worth, TX.', lat: 32.7680, lng: -97.3200 },
  { surface_category_key: 'truck_stop', name: 'Boss Shop', country_code: 'US', admin1_code: 'TX', locality: 'Dallas', address_line1: 'I-20 Exit 472, Dallas, TX', phone: '972-225-3190', website: 'https://bosstruckshops.com', description: 'Truck repair, maintenance, and parts in Dallas, TX.', lat: 32.6500, lng: -96.6900 },
  { surface_category_key: 'truck_stop', name: "Big's Travel Center", country_code: 'US', admin1_code: 'TX', locality: 'Dilley', address_line1: 'I-35 Exit 67, Dilley, TX', phone: '830-965-1400', description: 'Travel center with diesel, DEF, showers, and parking in Dilley, TX.', lat: 28.6681, lng: -99.1698 },
  { surface_category_key: 'truck_stop', name: 'Circle Bar Truck Plaza', country_code: 'US', admin1_code: 'TX', locality: 'Ozona', address_line1: 'I-10 Exit 372, Ozona, TX', phone: '325-392-2637', description: 'Full-service truck plaza with 100+ parking spots, restaurant, and motel in Ozona, TX.', lat: 30.7133, lng: -101.2000 },
  { surface_category_key: 'truck_stop', name: 'Cowboys Truck Stop', country_code: 'US', admin1_code: 'TX', locality: 'Pecos', address_line1: 'I-20, Pecos, TX', phone: '432-445-9049', description: 'Truck stop with diesel and parking in Pecos, TX.', lat: 31.4229, lng: -103.4932 },
  { surface_category_key: 'truck_stop', name: 'Decatur Truck Stop', country_code: 'US', admin1_code: 'TX', locality: 'Decatur', address_line1: 'US 287, Decatur, TX', phone: '940-627-5925', description: 'Truck stop with diesel, showers, and parking in Decatur, TX.', lat: 33.2343, lng: -97.5892 },
  // WEIGH STATIONS TX
  { surface_category_key: 'scale_weigh_station_public', name: 'Weigh Station — Hungerford EB', country_code: 'US', admin1_code: 'TX', locality: 'Hungerford', address_line1: 'US 59, Hungerford, TX 77435', lat: 29.40781, lng: -96.06361, description: 'State weigh station on US 59 eastbound in Hungerford, TX.' },
  { surface_category_key: 'scale_weigh_station_public', name: 'Weigh Station — Falfurrias NB', country_code: 'US', admin1_code: 'TX', locality: 'Falfurrias', address_line1: 'US 281 N, Falfurrias, TX', lat: 27.2320, lng: -98.1440, description: 'State weigh station on US 281 northbound near Falfurrias, TX.' },
  { surface_category_key: 'scale_weigh_station_public', name: 'Weigh Station — Laredo NB', country_code: 'US', admin1_code: 'TX', locality: 'Laredo', address_line1: 'I-35 N, Laredo, TX', lat: 27.5006, lng: -99.5075, description: 'State weigh station on I-35 northbound near Laredo, TX.' },
  { surface_category_key: 'scale_weigh_station_public', name: 'Weigh Station — Sierra Blanca EB', country_code: 'US', admin1_code: 'TX', locality: 'Sierra Blanca', address_line1: 'I-10 E, Sierra Blanca, TX', lat: 31.1746, lng: -105.3572, description: 'State weigh station on I-10 eastbound near Sierra Blanca, TX.' },
  { surface_category_key: 'scale_weigh_station_public', name: 'Weigh Station — Amarillo WB', country_code: 'US', admin1_code: 'TX', locality: 'Amarillo', address_line1: 'I-40 W, Amarillo, TX', lat: 35.1992, lng: -101.8950, description: 'State weigh station on I-40 westbound near Amarillo, TX.' },
  // PILOT CAR COMPANIES
  { surface_category_key: 'pilot_car', name: '365 Pilots', country_code: 'US', admin1_code: 'TX', locality: 'Nationwide', phone: '866-795-0150', website: 'https://www.365pilots.com', description: 'National pilot car dispatch, route planning, lead/chase units, and route surveys.', lat: 32.7767, lng: -96.7970 },
  { surface_category_key: 'pilot_car', name: 'HH&S Escort & Pilot Car Services', country_code: 'US', admin1_code: 'TX', locality: 'Nationwide', website: 'https://www.hh-s.com', description: 'Professional pilot car and oversize load escort services nationwide.', lat: 32.7767, lng: -96.7970 },
  { surface_category_key: 'pilot_car', name: 'Quality Pilots', country_code: 'US', admin1_code: 'TX', locality: 'Nationwide', website: 'https://www.pilotservice.net', description: 'Professional pilot car and escort vehicle services nationwide.', lat: 32.7767, lng: -96.7970 },
  // MOBILE REPAIR
  { surface_category_key: 'mobile_truck_repair', name: 'Detroit Highway Repair', country_code: 'US', admin1_code: 'MI', locality: 'Detroit', website: 'https://www.detroithighwayrescue.com', description: 'Mobile truck repair, roadside assistance, and emergency repair in Detroit, MI.', lat: 42.3314, lng: -83.0458 },
  { surface_category_key: 'mobile_truck_repair', name: 'Diesel Highway', country_code: 'US', admin1_code: 'TX', locality: 'Houston', website: 'https://www.dieselhighway.com', description: 'Mobile diesel repair and roadside assistance in Houston, TX.', lat: 29.7604, lng: -95.3698 },
  // REPAIR SHOPS
  { surface_category_key: 'repair_shop', name: 'Axle Doctors', country_code: 'US', admin1_code: 'TX', locality: 'Nationwide', website: 'https://www.axledoctors.com', description: 'National axle repair, alignment, suspension, and trailer repair services.', lat: 32.7767, lng: -96.7970 },
  { surface_category_key: 'repair_shop', name: 'United Axle', country_code: 'US', admin1_code: 'TX', locality: 'Nationwide', website: 'https://www.unitedaxle.com', description: 'National axle repair, alignment, and trailer repair services.', lat: 32.7767, lng: -96.7970 },
  // DEALERS
  { surface_category_key: 'truck_dealer', name: 'North American Trailer', country_code: 'US', admin1_code: 'TX', locality: 'Nationwide', website: 'https://shop.natrailer.com', description: 'New and used trailer sales and parts nationwide.', lat: 32.7767, lng: -96.7970 },
  // PARKING
  { surface_category_key: 'truck_parking', name: 'Park Truck', country_code: 'US', admin1_code: 'TX', locality: 'Nationwide', description: 'Secure, fenced truck parking with surveillance.', lat: 32.7767, lng: -96.7970 },
  // SPILL RESPONSE
  { surface_category_key: 'spill_response', name: 'Southern Hills Spill Response', country_code: 'US', admin1_code: 'OK', locality: 'Oklahoma City', description: 'Hazmat spill cleanup, spill response, and environmental remediation in Oklahoma.', lat: 35.4676, lng: -97.5164 },
];

async function run() {
  console.log('══════════════════════════════════════════════════');
  console.log('TRUCKER SERVICES — hc_places Migration v2');
  console.log('══════════════════════════════════════════════════\n');

  // ── Step 1: Check existing count ──
  console.log('Step 1: Checking existing hc_places...');
  const { count: existingCount } = await supabase
    .from('hc_places')
    .select('*', { count: 'exact', head: true });
  console.log(`  → ${existingCount ?? 0} existing entries in hc_places.\n`);

  // ── Step 2: Insert business listings (dedup by dedupe_hash) ──
  console.log('Step 2: Inserting business listings...');
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const listing of LISTINGS) {
    const slug = slugify(`${listing.name}-${listing.locality}-${listing.admin1_code}`);
    const hash = dedupeHash(listing.name, listing.locality, listing.admin1_code, listing.surface_category_key);
    const normalizedName = listing.name.toLowerCase().trim();
    const normalizedAddr = (listing.address_line1 || listing.locality || '').toLowerCase().trim();

    // Check if dedupe_hash already exists
    const { data: existing } = await supabase
      .from('hc_places')
      .select('id')
      .eq('dedupe_hash', hash)
      .limit(1);

    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    // Also check by slug
    const { data: existingSlug } = await supabase
      .from('hc_places')
      .select('id')
      .eq('slug', slug)
      .limit(1);

    if (existingSlug && existingSlug.length > 0) {
      skipped++;
      continue;
    }

    const row = {
      name: listing.name,
      slug: slug,
      description: listing.description || null,
      surface_category_key: listing.surface_category_key,
      country_code: listing.country_code,
      admin1_code: listing.admin1_code,
      locality: listing.locality,
      address_line1: listing.address_line1 || null,
      lat: listing.lat || null,
      lng: listing.lng || null,
      phone: listing.phone || null,
      website: listing.website || null,
      // Claim system
      claim_status: 'unclaimed',
      status: 'published',
      is_search_indexable: true,
      // Scores
      source_confidence: 0.7,
      demand_score: 0,
      supply_score: 0,
      seo_score: 0.5,
      claim_priority_score: 0.5,
      freshness_score: 0.3,
      // Dedup
      normalized_name: normalizedName,
      normalized_address: normalizedAddr,
      dedupe_hash: hash,
      // Source tracking
      source_system: 'scrape_truckstopsandservices_2026q2',
      enrichment_version: 'v1.0',
    };

    const { error: insertErr } = await supabase.from('hc_places').insert(row);
    if (insertErr) {
      console.log(`  ✗ ${listing.name}: ${insertErr.message}`);
      errors++;
    } else {
      inserted++;
      console.log(`  ✓ ${listing.name} → /place/${slug}`);
    }
  }

  console.log(`\n  Result: ${inserted} inserted, ${skipped} skipped (dedup), ${errors} errors.\n`);

  // ── Step 3: Final count ──
  const { count: finalCount } = await supabase
    .from('hc_places')
    .select('*', { count: 'exact', head: true });
  console.log(`Step 3: Final hc_places count: ${finalCount}\n`);

  // ── Step 4: Verify sample ──
  const { data: sample } = await supabase
    .from('hc_places')
    .select('name, locality, admin1_code, surface_category_key, slug, claim_status')
    .eq('source_system', 'scrape_truckstopsandservices_2026q2')
    .limit(5);
  
  if (sample && sample.length > 0) {
    console.log('Sample listings:');
    sample.forEach(s => console.log(`  → ${s.name} (${s.locality}, ${s.admin1_code}) [${s.surface_category_key}] → /place/${s.slug}`));
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log('DONE. Listings are now in hc_places and claimable.');
  console.log('══════════════════════════════════════════════════');
}

run().catch(console.error);
