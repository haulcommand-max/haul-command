/**
 * Seed corridor_demand_signals from static corridors.ts data.
 * Makes the demand intelligence APIs return live-feeling data.
 *
 * Usage: node scripts/seed-corridor-demand-signals.js
 *
 * Per Operating Brief Band A:
 *   "make static intelligence feel live until live flows expand"
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Static corridor data from lib/data/corridors.ts
const CORRIDORS = [
    {
        corridor_id: 'i-10',
        corridor_label: 'I-10 Gulf Coast',
        country_code: 'US',
        origin_region: 'CA',
        destination_region: 'FL',
        demand_level: 'critical',
        avg_monthly_loads: 340,
        avg_rate_usd: 3200,
        surge_active: true,
        surge_multiplier: 1.4,
        seasonality_pattern: 'year-round with summer peak',
        industry_segments: ['oversize', 'heavy-haul', 'oil-gas', 'wind-energy'],
    },
    {
        corridor_id: 'i-20',
        corridor_label: 'I-20 Southern Cross',
        country_code: 'US',
        origin_region: 'TX',
        destination_region: 'SC',
        demand_level: 'high',
        avg_monthly_loads: 220,
        avg_rate_usd: 2800,
        surge_active: false,
        surge_multiplier: 1.0,
        seasonality_pattern: 'Q1-Q3 peak for energy sector',
        industry_segments: ['oversize', 'construction', 'military'],
    },
    {
        corridor_id: 'i-40',
        corridor_label: 'I-40 Central Corridor',
        country_code: 'US',
        origin_region: 'CA',
        destination_region: 'NC',
        demand_level: 'high',
        avg_monthly_loads: 280,
        avg_rate_usd: 3500,
        surge_active: false,
        surge_multiplier: 1.0,
        seasonality_pattern: 'steady with Q2 wind-energy surge',
        industry_segments: ['wind-energy', 'oversize', 'heavy-haul'],
    },
    {
        corridor_id: 'i-35',
        corridor_label: 'I-35 Central Spine',
        country_code: 'US',
        origin_region: 'TX',
        destination_region: 'MN',
        demand_level: 'moderate',
        avg_monthly_loads: 180,
        avg_rate_usd: 2600,
        surge_active: false,
        surge_multiplier: 1.0,
        seasonality_pattern: 'Q2-Q3 construction peak',
        industry_segments: ['construction', 'oversize', 'agriculture'],
    },
    {
        corridor_id: 'i-95',
        corridor_label: 'I-95 Eastern Seaboard',
        country_code: 'US',
        origin_region: 'FL',
        destination_region: 'ME',
        demand_level: 'high',
        avg_monthly_loads: 300,
        avg_rate_usd: 3100,
        surge_active: false,
        surge_multiplier: 1.0,
        seasonality_pattern: 'year-round with port-linked spikes',
        industry_segments: ['port-cargo', 'oversize', 'heavy-haul', 'military'],
    },
];

async function seed() {
    console.log('Seeding corridor_demand_signals from static corridor data...');

    for (const c of CORRIDORS) {
        const row = {
            corridor_id: c.corridor_id,
            corridor_label: c.corridor_label,
            country_code: c.country_code,
            origin_region: c.origin_region,
            destination_region: c.destination_region,
            demand_level: c.demand_level,
            avg_monthly_loads: c.avg_monthly_loads,
            avg_rate_usd: c.avg_rate_usd,
            surge_active: c.surge_active,
            surge_multiplier: c.surge_multiplier,
            seasonality_pattern: c.seasonality_pattern,
            industry_segments: c.industry_segments,
            last_signal_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('corridor_demand_signals')
            .upsert(row, { onConflict: 'corridor_id' })
            .select()
            .single();

        if (error) {
            console.log(`  ❌ ${c.corridor_id}: ${error.message}`);
        } else {
            console.log(`  ✅ ${c.corridor_id} → ${c.demand_level} (${c.avg_monthly_loads} loads/mo)`);
        }
    }

    console.log('\nDone. Verify: GET /api/v1/demand-intelligence/corridors');
}

seed();
