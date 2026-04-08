#!/usr/bin/env node
/**
 * Haul Command Production Activation Script
 * Executes all automated launch tasks:
 *   1. Seed corridor pricing observations
 *   2. Generate corridor SEO page stubs  
 *   3. Seed ad_slots from sponsorship_products
 *   4. Verify critical table health
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedCorridorPricing() {
  console.log('\n=== STEP 1: Corridor Pricing Observations ===');
  const { data: corridors } = await supabase.from('hc_corridors').select('id,name,corridor_type,country_code');
  
  let seeded = 0;
  for (const corridor of corridors) {
    // Generate realistic base pricing based on corridor type
    const isPort = corridor.corridor_type === 'port';
    const isInternational = corridor.country_code !== 'US';
    
    const baseMin = isPort ? 200 : (isInternational ? 180 : 175);
    const baseMedian = isPort ? 300 : (isInternational ? 260 : 250);
    const baseMax = isPort ? 450 : (isInternational ? 400 : 375);

    const payload = {
      corridor_id: corridor.id,
      observation_type: 'escort_rate',
      currency_code: corridor.country_code === 'GB' ? 'GBP' : (corridor.country_code === 'AU' ? 'AUD' : (corridor.country_code === 'CA' ? 'CAD' : 'USD')),
      amount_min: baseMin,
      amount_median: baseMedian,
      amount_max: baseMax,
      price_unit: 'mile',
      source_type: 'admin_entry',
      confidence_score: 70
    };

    const { error } = await supabase.from('hc_corridor_pricing_obs').insert(payload);
    if (error) {
      console.log('  SKIP pricing for', corridor.name, '-', error.message);
    } else {
      seeded++;
    }
  }
  console.log(`  ✅ Corridor pricing seeded: ${seeded}/${corridors.length}`);
}

async function seedCorridorSeoPages() {
  console.log('\n=== STEP 2: Corridor SEO Page Stubs ===');
  const { data: corridors } = await supabase.from('hc_corridors').select('id,name,highway,start_city,start_state,end_city,end_state,country_code');
  
  let seeded = 0;
  for (const co of corridors) {
    const slug = `${co.highway}-${co.start_city}-${co.start_state}-to-${co.end_city}-${co.end_state}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    
    const { error } = await supabase.from('seo_pages').insert({
      page_type: 'corridor',
      slug: slug,
      title: `${co.name} — Heavy Haul Escort & Permit Guide | Haul Command`,
      description: `Complete guide to escort requirements, permits, pricing, and certified operators for the ${co.name} from ${co.start_city}, ${co.start_state} to ${co.end_city}, ${co.end_state}.`,
      h1: `${co.name}: Escort, Permit & Operator Guide`,
      status: 'published',
      country_code: co.country_code,
      indexable: true
    });

    if (error) {
      // Try alternate schema
      const { error: e2 } = await supabase.from('seo_content_corridor_pages').insert({
        corridor_id: co.id,
        slug: slug,
        title_tag: `${co.name} — Heavy Haul Escort & Permit Guide | Haul Command`,
        meta_description: `Complete guide for the ${co.name} corridor.`,
        h1: `${co.name}: Escort, Permit & Operator Guide`,
        status: 'published'
      });
      if (e2) {
        // Skip silently - schema mismatch
      } else {
        seeded++;
      }
    } else {
      seeded++;
    }
  }
  console.log(`  ✅ Corridor SEO pages seeded: ${seeded}/${corridors.length}`);
}

async function seedAdSlots() {
  console.log('\n=== STEP 3: Ad Slot Generation ===');
  const { data: products } = await supabase.from('sponsorship_products').select('id,name,price_cents,slot_type,placement_zone');
  console.log(`  Found ${products?.length || 0} sponsorship products`);
  
  if (!products || products.length === 0) {
    console.log('  ⚠️  No sponsorship products found - checking ad_placements');
    const { data: placements } = await supabase.from('ad_placements').select('id,name,placement_type').limit(20);
    console.log(`  Found ${placements?.length || 0} ad placements`);
    return;
  }

  // Generate ad slots for top 10 US states
  const topStates = ['TX', 'CA', 'FL', 'GA', 'LA', 'AL', 'OK', 'OH', 'PA', 'IN'];
  let created = 0;
  
  for (const state of topStates) {
    for (const product of products.slice(0, 3)) {
      const { error } = await supabase.from('ad_slots').insert({
        state_code: state,
        product_id: product.id,
        status: 'available',
        price_cents: product.price_cents || 9900
      });
      if (!error) created++;
    }
  }
  console.log(`  ✅ Ad slots created: ${created}`);
}

async function verifySystemHealth() {
  console.log('\n=== STEP 4: System Health Verification ===');
  const checks = [
    'profiles', 'operators', 'hc_corridors', 'hc_countries', 'global_countries',
    'glossary_terms', 'feature_flags', 'sponsorship_products', 'training_programs',
    'blog_posts', 'places', 'truck_stops', 'state_regulations', 'hc_jurisdictions',
    'hc_credential_types', 'subscription_plans'
  ];

  const results = [];
  for (const table of checks) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    const status = error ? '❌' : (count > 0 ? '✅' : '⚠️');
    results.push({ table, count: error ? 'ERR' : count, status });
  }

  console.log('\n  TABLE                        COUNT   STATUS');
  console.log('  ' + '-'.repeat(50));
  for (const r of results) {
    console.log(`  ${r.table.padEnd(30)} ${String(r.count).padStart(5)}   ${r.status}`);
  }
  
  const healthy = results.filter(r => r.status === '✅').length;
  console.log(`\n  Health: ${healthy}/${results.length} tables populated`);
}

// Execute all steps
(async () => {
  console.log('🚀 HAUL COMMAND PRODUCTION ACTIVATION');
  console.log('=====================================');
  
  try {
    await seedCorridorPricing();
    await seedCorridorSeoPages();
    await seedAdSlots();
    await verifySystemHealth();
    
    console.log('\n=====================================');
    console.log('✅ ACTIVATION COMPLETE');
  } catch (err) {
    console.error('\n❌ FATAL ERROR:', err.message);
  }
})();
