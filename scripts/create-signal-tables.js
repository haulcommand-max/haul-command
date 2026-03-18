/**
 * Create the two signal tables + seed demand signals.
 * Usage: node scripts/create-signal-tables.js
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CORRIDORS = [
    { corridor_id: 'i-10', corridor_label: 'I-10 Gulf Coast', origin_region: 'CA', destination_region: 'FL', demand_level: 'critical', avg_monthly_loads: 340, avg_rate_usd: 3200, surge_active: true, surge_multiplier: 1.4, seasonality_pattern: 'year-round with summer peak', industry_segments: ['oversize', 'heavy-haul', 'oil-gas', 'wind-energy'] },
    { corridor_id: 'i-20', corridor_label: 'I-20 Southern Cross', origin_region: 'TX', destination_region: 'SC', demand_level: 'high', avg_monthly_loads: 220, avg_rate_usd: 2800, surge_active: false, surge_multiplier: 1.0, seasonality_pattern: 'Q1-Q3 peak for energy sector', industry_segments: ['oversize', 'construction', 'military'] },
    { corridor_id: 'i-40', corridor_label: 'I-40 Central Corridor', origin_region: 'CA', destination_region: 'NC', demand_level: 'high', avg_monthly_loads: 280, avg_rate_usd: 3500, surge_active: false, surge_multiplier: 1.0, seasonality_pattern: 'steady with Q2 wind-energy surge', industry_segments: ['wind-energy', 'oversize', 'heavy-haul'] },
    { corridor_id: 'i-35', corridor_label: 'I-35 Central Spine', origin_region: 'TX', destination_region: 'MN', demand_level: 'moderate', avg_monthly_loads: 180, avg_rate_usd: 2600, surge_active: false, surge_multiplier: 1.0, seasonality_pattern: 'Q2-Q3 construction peak', industry_segments: ['construction', 'oversize', 'agriculture'] },
    { corridor_id: 'i-95', corridor_label: 'I-95 Eastern Seaboard', origin_region: 'FL', destination_region: 'ME', demand_level: 'high', avg_monthly_loads: 300, avg_rate_usd: 3100, surge_active: false, surge_multiplier: 1.0, seasonality_pattern: 'year-round with port-linked spikes', industry_segments: ['port-cargo', 'oversize', 'heavy-haul', 'military'] },
];

async function createTables() {
    console.log('=== Step 1: Create corridor_demand_signals ===');

    // Test if table exists by selecting from it
    const { error: testErr } = await supabase.from('corridor_demand_signals').select('corridor_id').limit(1);
    if (testErr && testErr.message.includes('not find')) {
        console.log('Table missing. Creating via SQL...');

        const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
        const sqlUrl = `https://${projectRef}.supabase.co/rest/v1/rpc/`;

        // Try creating via direct SQL execution if a function exists
        console.log('BLOCKER: Cannot create tables via REST API.');
        console.log('Run this SQL in Supabase SQL Editor:');
        console.log('');
        console.log(`CREATE TABLE IF NOT EXISTS corridor_demand_signals (
  corridor_id TEXT PRIMARY KEY,
  corridor_label TEXT NOT NULL,
  country_code TEXT DEFAULT 'US',
  origin_region TEXT,
  destination_region TEXT,
  demand_level TEXT,
  avg_monthly_loads INTEGER,
  avg_rate_usd INTEGER,
  surge_active BOOLEAN DEFAULT false,
  surge_multiplier NUMERIC DEFAULT 1.0,
  seasonality_pattern TEXT,
  industry_segments TEXT[],
  last_signal_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corridor_supply_snapshot (
  id SERIAL PRIMARY KEY,
  corridor_id TEXT NOT NULL,
  region_key TEXT,
  country_code TEXT DEFAULT 'US',
  operator_count INTEGER,
  active_estimate INTEGER,
  availability_score NUMERIC,
  supply_level TEXT,
  computed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(corridor_id, region_key)
);`);
        return false;
    } else {
        console.log('corridor_demand_signals table EXISTS!');
    }

    // Test supply snapshot
    const { error: testErr2 } = await supabase.from('corridor_supply_snapshot').select('corridor_id').limit(1);
    if (testErr2 && testErr2.message.includes('not find')) {
        console.log('corridor_supply_snapshot table MISSING');
        return false;
    } else {
        console.log('corridor_supply_snapshot table EXISTS!');
    }

    return true;
}

async function seedDemand() {
    console.log('\n=== Step 2: Seed corridor_demand_signals ===');

    for (const c of CORRIDORS) {
        const row = {
            ...c,
            country_code: 'US',
            last_signal_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('corridor_demand_signals')
            .upsert(row, { onConflict: 'corridor_id' });

        if (error) {
            console.log(`  FAIL ${c.corridor_id}: ${error.message}`);
        } else {
            console.log(`  OK ${c.corridor_id}: ${c.demand_level} (${c.avg_monthly_loads} loads/mo)`);
        }
    }
}

async function computeSupply() {
    console.log('\n=== Step 3: Compute supply snapshot from directory_listings ===');

    // Get operator counts by region
    const { data: regionCounts, error } = await supabase
        .from('directory_listings')
        .select('region_code')
        .eq('is_visible', true);

    if (error) {
        console.log('Failed to query directory_listings:', error.message);
        return;
    }

    // Count by region
    const counts = {};
    for (const row of regionCounts) {
        const region = row.region_code || 'UNKNOWN';
        counts[region] = (counts[region] || 0) + 1;
    }

    console.log(`  Found ${regionCounts.length} operators across ${Object.keys(counts).length} regions`);

    // Map corridors to their regions and compute supply
    const corridorRegions = {
        'i-10': ['CA', 'AZ', 'NM', 'TX', 'LA', 'MS', 'AL', 'FL'],
        'i-20': ['TX', 'LA', 'MS', 'AL', 'GA', 'SC'],
        'i-40': ['CA', 'AZ', 'NM', 'TX', 'OK', 'AR', 'TN', 'NC'],
        'i-35': ['TX', 'OK', 'KS', 'MO', 'IA', 'MN'],
        'i-95': ['FL', 'GA', 'SC', 'NC', 'VA', 'MD', 'DE', 'NJ', 'NY', 'CT', 'MA', 'NH', 'ME'],
    };

    for (const [corridorId, regions] of Object.entries(corridorRegions)) {
        const operatorCount = regions.reduce((sum, r) => sum + (counts[r] || 0), 0);
        const activeEstimate = Math.round(operatorCount * 0.65); // ~65% availability estimate
        const availabilityScore = operatorCount > 0 ? Math.min(100, Math.round((activeEstimate / (regions.length * 15)) * 100)) : 0;
        const supplyLevel = availabilityScore >= 70 ? 'adequate' : availabilityScore >= 40 ? 'tight' : 'shortage';

        const row = {
            corridor_id: corridorId,
            region_key: regions.join(','),
            country_code: 'US',
            operator_count: operatorCount,
            active_estimate: activeEstimate,
            availability_score: availabilityScore,
            supply_level: supplyLevel,
            computed_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('corridor_supply_snapshot')
            .upsert(row, { onConflict: 'corridor_id,region_key' });

        if (error) {
            console.log(`  FAIL ${corridorId}: ${error.message}`);
        } else {
            console.log(`  OK ${corridorId}: ${operatorCount} operators, ${supplyLevel} (score: ${availabilityScore})`);
        }
    }
}

async function main() {
    const tablesExist = await createTables();
    if (!tablesExist) {
        console.log('\n=== BLOCKED: Create the tables first, then re-run this script ===');
        return;
    }
    await seedDemand();
    await computeSupply();
    console.log('\n=== DONE ===');
}

main();
