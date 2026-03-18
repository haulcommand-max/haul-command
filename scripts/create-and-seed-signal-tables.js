/**
 * Create signal tables via Supabase Management API + seed data.
 * Reuses the management API pattern from apply-playground-migrations.cjs
 */
const https = require('https');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const PROJECT_REF = 'hvjyfyzotqobfkakjozp';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_c6b18d697dc25e7677e2b3e7b3c545355f95d4aa';

function makeRequest(hostname, reqPath, method, body, token) {
    return new Promise((resolve, reject) => {
        const postData = typeof body === 'string' ? body : JSON.stringify(body);
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
        if (method !== 'GET') headers['Content-Length'] = Buffer.byteLength(postData);
        const options = { hostname, path: reqPath, method, headers };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        if (method !== 'GET') req.write(postData);
        req.end();
    });
}

async function executeSQL(sql, label) {
    const result = await makeRequest(
        'api.supabase.com',
        `/v1/projects/${PROJECT_REF}/database/query`,
        'POST',
        JSON.stringify({ query: sql }),
        ACCESS_TOKEN
    );
    if (result.status >= 200 && result.status < 300) {
        console.log(`  OK ${label}: HTTP ${result.status}`);
        try { return JSON.parse(result.body); } catch { return result.body; }
    } else {
        console.log(`  FAIL ${label}: HTTP ${result.status} — ${result.body.substring(0, 300)}`);
        throw new Error(`HTTP ${result.status}`);
    }
}

const CORRIDORS = [
    { corridor_id: 'i-10', corridor_label: 'I-10 Gulf Coast', origin_region: 'CA', destination_region: 'FL', demand_level: 'critical', avg_monthly_loads: 340, avg_rate_usd: 3200, surge_active: true, surge_multiplier: 1.4, seasonality_pattern: 'year-round with summer peak', industry_segments: '{oversize,heavy-haul,oil-gas,wind-energy}' },
    { corridor_id: 'i-20', corridor_label: 'I-20 Southern Cross', origin_region: 'TX', destination_region: 'SC', demand_level: 'high', avg_monthly_loads: 220, avg_rate_usd: 2800, surge_active: false, surge_multiplier: 1.0, seasonality_pattern: 'Q1-Q3 peak for energy sector', industry_segments: '{oversize,construction,military}' },
    { corridor_id: 'i-40', corridor_label: 'I-40 Central Corridor', origin_region: 'CA', destination_region: 'NC', demand_level: 'high', avg_monthly_loads: 280, avg_rate_usd: 3500, surge_active: false, surge_multiplier: 1.0, seasonality_pattern: 'steady with Q2 wind-energy surge', industry_segments: '{wind-energy,oversize,heavy-haul}' },
    { corridor_id: 'i-35', corridor_label: 'I-35 Central Spine', origin_region: 'TX', destination_region: 'MN', demand_level: 'moderate', avg_monthly_loads: 180, avg_rate_usd: 2600, surge_active: false, surge_multiplier: 1.0, seasonality_pattern: 'Q2-Q3 construction peak', industry_segments: '{construction,oversize,agriculture}' },
    { corridor_id: 'i-95', corridor_label: 'I-95 Eastern Seaboard', origin_region: 'FL', destination_region: 'ME', demand_level: 'high', avg_monthly_loads: 300, avg_rate_usd: 3100, surge_active: false, surge_multiplier: 1.0, seasonality_pattern: 'year-round with port-linked spikes', industry_segments: '{port-cargo,oversize,heavy-haul,military}' },
];

async function main() {
    console.log('=== Creating signal tables via Management API ===\n');

    // 1. Create corridor_demand_signals
    await executeSQL(`
        CREATE TABLE IF NOT EXISTS corridor_demand_signals (
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
    `, 'CREATE corridor_demand_signals');

    // 2. Create corridor_supply_snapshot
    await executeSQL(`
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
        );
    `, 'CREATE corridor_supply_snapshot');

    console.log('\n=== Seeding demand signals ===\n');

    // 3. Seed demand signals
    for (const c of CORRIDORS) {
        const sql = `
            INSERT INTO corridor_demand_signals (corridor_id, corridor_label, country_code, origin_region, destination_region, demand_level, avg_monthly_loads, avg_rate_usd, surge_active, surge_multiplier, seasonality_pattern, industry_segments, last_signal_at, updated_at)
            VALUES ('${c.corridor_id}', '${c.corridor_label}', 'US', '${c.origin_region}', '${c.destination_region}', '${c.demand_level}', ${c.avg_monthly_loads}, ${c.avg_rate_usd}, ${c.surge_active}, ${c.surge_multiplier}, '${c.seasonality_pattern}', '${c.industry_segments}', now(), now())
            ON CONFLICT (corridor_id) DO UPDATE SET
                demand_level = EXCLUDED.demand_level,
                avg_monthly_loads = EXCLUDED.avg_monthly_loads,
                avg_rate_usd = EXCLUDED.avg_rate_usd,
                surge_active = EXCLUDED.surge_active,
                surge_multiplier = EXCLUDED.surge_multiplier,
                last_signal_at = now(),
                updated_at = now();
        `;
        try {
            await executeSQL(sql, `SEED ${c.corridor_id}`);
        } catch (e) {
            console.log(`  Warning: ${c.corridor_id} seed failed`);
        }
    }

    console.log('\n=== Computing supply snapshot from directory_listings ===\n');

    // 4. Compute supply from directory_listings via Supabase client
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const corridorRegions = {
        'i-10': ['CA', 'AZ', 'NM', 'TX', 'LA', 'MS', 'AL', 'FL'],
        'i-20': ['TX', 'LA', 'MS', 'AL', 'GA', 'SC'],
        'i-40': ['CA', 'AZ', 'NM', 'TX', 'OK', 'AR', 'TN', 'NC'],
        'i-35': ['TX', 'OK', 'KS', 'MO', 'IA', 'MN'],
        'i-95': ['FL', 'GA', 'SC', 'NC', 'VA', 'MD', 'DE', 'NJ', 'NY', 'CT', 'MA', 'NH', 'ME'],
    };

    const { data: allListings } = await supabase
        .from('directory_listings')
        .select('region_code')
        .eq('is_visible', true);

    const regionCounts = {};
    for (const row of (allListings || [])) {
        const r = row.region_code || 'UNKNOWN';
        regionCounts[r] = (regionCounts[r] || 0) + 1;
    }
    console.log(`  ${(allListings || []).length} total operators across ${Object.keys(regionCounts).length} regions\n`);

    for (const [corridorId, regions] of Object.entries(corridorRegions)) {
        const opCount = regions.reduce((s, r) => s + (regionCounts[r] || 0), 0);
        const activeEst = Math.round(opCount * 0.65);
        const avScore = opCount > 0 ? Math.min(100, Math.round((activeEst / (regions.length * 15)) * 100)) : 0;
        const supplyLevel = avScore >= 70 ? 'adequate' : avScore >= 40 ? 'tight' : 'shortage';

        const sql = `
            INSERT INTO corridor_supply_snapshot (corridor_id, region_key, country_code, operator_count, active_estimate, availability_score, supply_level, computed_at)
            VALUES ('${corridorId}', '${regions.join(',')}', 'US', ${opCount}, ${activeEst}, ${avScore}, '${supplyLevel}', now())
            ON CONFLICT (corridor_id, region_key) DO UPDATE SET
                operator_count = EXCLUDED.operator_count,
                active_estimate = EXCLUDED.active_estimate,
                availability_score = EXCLUDED.availability_score,
                supply_level = EXCLUDED.supply_level,
                computed_at = now();
        `;
        try {
            await executeSQL(sql, `SUPPLY ${corridorId}: ${opCount} ops, ${supplyLevel}`);
        } catch (e) {
            console.log(`  Warning: ${corridorId} supply insert failed`);
        }
    }

    console.log('\n=== Verification ===\n');

    // 5. Verify
    try {
        const demand = await executeSQL('SELECT corridor_id, demand_level, avg_monthly_loads FROM corridor_demand_signals ORDER BY avg_monthly_loads DESC;', 'VERIFY demand');
        console.log(`  Demand rows: ${Array.isArray(demand) ? demand.length : 'check result'}`);
        if (Array.isArray(demand)) demand.forEach(r => console.log(`    ${r.corridor_id}: ${r.demand_level} (${r.avg_monthly_loads} loads/mo)`));
    } catch (e) { console.log('  Demand verify failed:', e.message); }

    try {
        const supply = await executeSQL('SELECT corridor_id, operator_count, supply_level FROM corridor_supply_snapshot ORDER BY operator_count DESC;', 'VERIFY supply');
        console.log(`  Supply rows: ${Array.isArray(supply) ? supply.length : 'check result'}`);
        if (Array.isArray(supply)) supply.forEach(r => console.log(`    ${r.corridor_id}: ${r.operator_count} operators (${r.supply_level})`));
    } catch (e) { console.log('  Supply verify failed:', e.message); }

    console.log('\n=== DONE ===');
}

main().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
