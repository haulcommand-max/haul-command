#!/usr/bin/env node
/**
 * refresh-data-product-market-snapshots.mjs
 *
 * 15X data monetization refresh scaffold.
 *
 * Purpose:
 * - Populate data_product_market_snapshots from Haul Command platform signals.
 * - Start safe with aggregate, redacted, confidence-scored rows.
 * - Let /data and /api/export/download sell previews/exports without exposing private data.
 *
 * This script is intentionally conservative. It creates aggregate snapshots from whatever
 * tables exist in the connected Supabase project and skips source families that do not exist yet.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const productFamilies = [
  'broker-demand-heatmap',
  'corridor-liquidity-index',
  'operator-scarcity-map',
  'port-heavy-haul-pressure-index',
  'cross-border-escort-readiness-pack',
  'infrastructure-staging-yard-map',
  'permit-escort-requirement-dataset',
];

function band(score) {
  if (score >= 0.9) return 'verified';
  if (score >= 0.75) return 'high';
  if (score >= 0.55) return 'medium';
  return 'low';
}

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));
}

async function tableExists(table) {
  const { error } = await supabase.from(table).select('*').limit(1);
  if (!error) return true;
  const msg = String(error.message || '').toLowerCase();
  return !(msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('not found'));
}

async function countRows(table, filters = {}) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') query = query.eq(key, value);
  }
  const { count, error } = await query;
  if (error) return 0;
  return count || 0;
}

async function getCountryCodes() {
  const countries = new Set(['US', 'CA', 'AU', 'GB', 'DE', 'NL', 'AE', 'BR', 'ZA', 'NZ']);

  for (const table of ['directory_listings', 'hc_global_operators', 'corridors', 'loads', 'load_posts']) {
    if (!(await tableExists(table))) continue;
    const { data } = await supabase.from(table).select('country_code').not('country_code', 'is', null).limit(500);
    for (const row of data || []) {
      if (row.country_code) countries.add(String(row.country_code).toUpperCase());
    }
  }

  return Array.from(countries).sort();
}

async function buildCountrySnapshot(countryCode, productId) {
  const hasDirectory = await tableExists('directory_listings');
  const hasOperators = await tableExists('hc_global_operators');
  const hasCorridors = await tableExists('corridors');
  const hasLoads = await tableExists('loads');
  const hasLoadPosts = await tableExists('load_posts');
  const hasTruckStops = await tableExists('truck_stops');

  const listingCount = hasDirectory ? await countRows('directory_listings', { country_code: countryCode }) : 0;
  const operatorCount = hasOperators ? await countRows('hc_global_operators', { country_code: countryCode }) : 0;
  const corridorCount = hasCorridors ? await countRows('corridors', { country_code: countryCode }) : 0;
  const loadCountA = hasLoads ? await countRows('loads', { country_code: countryCode }) : 0;
  const loadCountB = hasLoadPosts ? await countRows('load_posts', { country_code: countryCode }) : 0;
  const infraCount = hasTruckStops ? await countRows('truck_stops', { country_code: countryCode }) : 0;

  const supply = listingCount + operatorCount;
  const demand = loadCountA + loadCountB;
  const sourceCount = [hasDirectory, hasOperators, hasCorridors, hasLoads, hasLoadPosts, hasTruckStops].filter(Boolean).length;
  const confidence = clamp(0.22 + sourceCount * 0.08 + Math.min(0.25, supply / 10000) + Math.min(0.2, demand / 5000), 0.25, 0.92);
  const scarcity = supply > 0 ? clamp((demand / Math.max(supply, 1)) * 20, 0, 100) : (demand > 0 ? 85 : 35);
  const liquidity = clamp((supply * 0.02) + (demand * 0.03) + (corridorCount * 0.5), 0, 100);

  return {
    product_id: productId,
    country_code: countryCode,
    market_name: `${countryCode} Heavy Haul Intelligence`,
    maturity_status: confidence >= 0.75 ? 'live' : confidence >= 0.5 ? 'building' : 'sparse',
    confidence_score: Number(confidence.toFixed(4)),
    confidence_band: band(confidence),
    source_class: 'mixed',
    privacy_class: 'aggregate_safe',
    freshness_window: 'daily',
    demand_score: clamp(demand * 0.05, 0, 100),
    supply_score: clamp(supply * 0.03, 0, 100),
    scarcity_score: scarcity,
    liquidity_score: liquidity,
    port_pressure_score: productId.includes('port') ? clamp(demand * 0.08 + infraCount * 0.1, 0, 100) : null,
    permit_complexity_score: productId.includes('permit') || productId.includes('border') ? 50 : null,
    infrastructure_fit_score: productId.includes('infrastructure') ? clamp(infraCount * 0.4, 0, 100) : null,
    broker_activity_density: productId.includes('broker') ? clamp(demand * 0.07, 0, 100) : null,
    operator_density: clamp(supply * 0.03, 0, 100),
    claimed_listing_count: 0,
    unclaimed_listing_count: listingCount,
    active_corridor_count: corridorCount,
    active_port_count: 0,
    religious_holiday_flags: [],
    cultural_localization: {
      needs_country_overlay: true,
      dimensions: [
        'language',
        'measurement_system',
        'currency',
        'work_week',
        'religious_holidays',
        'national_holidays',
        'port_operating_norms',
        'permit_authority_structure',
        'local_heavy_haul_terms',
      ],
    },
    preview_payload: {
      market: countryCode,
      confidence_band: band(confidence),
      maturity_status: confidence >= 0.75 ? 'live' : confidence >= 0.5 ? 'building' : 'sparse',
      visible_supply_signals: supply,
      visible_demand_signals: demand,
    },
    paid_payload: {
      listing_count: listingCount,
      operator_count: operatorCount,
      corridor_count: corridorCount,
      load_signal_count: demand,
      infrastructure_signal_count: infraCount,
      scarcity_score: scarcity,
      liquidity_score: liquidity,
      data_product_note: 'Aggregate, redacted, confidence-scored market snapshot. Not a private personal data export.',
    },
    source_summary: {
      directory_listings: hasDirectory,
      hc_global_operators: hasOperators,
      corridors: hasCorridors,
      loads: hasLoads,
      load_posts: hasLoadPosts,
      truck_stops: hasTruckStops,
    },
    last_observed_at: new Date().toISOString(),
    computed_at: new Date().toISOString(),
  };
}

async function main() {
  const countryCodes = await getCountryCodes();
  const rows = [];

  for (const countryCode of countryCodes) {
    for (const productId of productFamilies) {
      rows.push(await buildCountrySnapshot(countryCode, productId));
    }
  }

  if (rows.length === 0) {
    console.log('No snapshots generated.');
    return;
  }

  const { error } = await supabase.from('data_product_market_snapshots').insert(rows);
  if (error) throw error;

  console.log(`Inserted ${rows.length} data product market snapshots across ${countryCodes.length} countries.`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
