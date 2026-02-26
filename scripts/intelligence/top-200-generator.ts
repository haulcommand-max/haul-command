import * as fs from 'fs';
import * as path from 'path';

export interface SeedCity {
    city: string;
    state_or_province: string;
    country: string;
    tier: number;
    reason_tags: string[];
    base_score: number;
}

const TARGET_INITIAL_ROWS = 90;
const MAX_ROWS = 200;

// 1. Guaranteed Anchors (Simplified for example. In prod, this contains 50 states + DC + CA Provinces + Territories)
const usAnchors = [
    { city: 'Houston', state: 'TX', score: 100, tags: ['state_anchor', 'energy', 'port'] },
    { city: 'Miami', state: 'FL', score: 95, tags: ['state_anchor', 'port'] },
    { city: 'Los Angeles', state: 'CA', score: 95, tags: ['state_anchor', 'port'] },
    { city: 'Atlanta', state: 'GA', score: 90, tags: ['state_anchor', 'freight_hub'] },
    { city: 'Chicago', state: 'IL', score: 90, tags: ['state_anchor', 'freight_hub'] },
    { city: 'Columbus', state: 'OH', score: 85, tags: ['state_anchor'] },
    { city: 'Charlotte', state: 'NC', score: 85, tags: ['state_anchor'] },
    { city: 'Detroit', state: 'MI', score: 80, tags: ['state_anchor', 'border'] },
    { city: 'Philadelphia', state: 'PA', score: 80, tags: ['state_anchor', 'port'] },
    { city: 'Indianapolis', state: 'IN', score: 80, tags: ['state_anchor'] }
    // ... remaining US states
];

const caAnchors = [
    { city: 'Toronto', state: 'ON', score: 90, tags: ['province_anchor', 'freight_hub'] },
    { city: 'Calgary', state: 'AB', score: 88, tags: ['province_anchor', 'energy'] },
    { city: 'Vancouver', state: 'BC', score: 85, tags: ['province_anchor', 'port'] }
    // ... remaining CA provinces
];

const ruralHubs = [
    { city: 'Midland', state: 'TX', score: 80, tags: ['rural_anchor', 'energy'] },
    { city: 'Williston', state: 'ND', score: 75, tags: ['rural_anchor', 'energy'] }
];

export async function generateSmartSeedList(currentRouteSearches: any[], allowMaxRows: boolean = false) {
    console.log("Generating Smart Seed List (North America Anchor Strategy)...");

    let pool: SeedCity[] = [];

    // Combine Anchors
    usAnchors.forEach(a => pool.push({ city: a.city, state_or_province: a.state, country: 'US', tier: 0, reason_tags: a.tags, base_score: a.score }));
    caAnchors.forEach(a => pool.push({ city: a.city, state_or_province: a.state, country: 'CA', tier: 0, reason_tags: a.tags, base_score: a.score }));
    ruralHubs.forEach(a => pool.push({ city: a.city, state_or_province: a.state, country: 'US', tier: 2, reason_tags: a.tags, base_score: a.score }));

    // Apply Live Signals (Simulated)
    pool = pool.map(city => {
        let finalScore = city.base_score;
        const liveSearches = currentRouteSearches.filter(s => s.state === city.state_or_province).length;
        finalScore += (liveSearches * 0.5);

        // Calculate Tier (Tier 0 is reserved for required state/province anchors)
        let finalTier = city.tier;
        if (finalTier !== 0) {
            if (finalScore >= 95) finalTier = 1;
            else if (finalScore >= 80) finalTier = 2;
            else finalTier = 3;
        }

        return { ...city, base_score: finalScore, tier: finalTier };
    });

    // Sort and Trim
    pool.sort((a, b) => b.base_score - a.base_score);

    // Always include Tier 0. Fill the rest up to limit.
    const tier0 = pool.filter(c => c.tier === 0);
    const others = pool.filter(c => c.tier !== 0);

    const limit = allowMaxRows ? MAX_ROWS : TARGET_INITIAL_ROWS;

    let finalOutput = [...tier0];
    const remainingSlots = limit - finalOutput.length;

    if (remainingSlots > 0) {
        finalOutput = [...finalOutput, ...others.slice(0, remainingSlots)];
    }

    finalOutput.sort((a, b) => b.base_score - a.base_score); // Final sort

    // Write outputs
    const outDir = path.join(process.cwd(), 'scripts', 'intelligence');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const jsonPath = path.join(outDir, 'cities_seed_list_v1.json');
    fs.writeFileSync(jsonPath, JSON.stringify(finalOutput, null, 2));

    // Also create a basic CSV for easy import to ad platforms
    const csvPath = path.join(outDir, 'cities_seed_list_v1.csv');
    const csvHeader = "city,state_or_province,country,tier,tags\n";
    const csvRows = finalOutput.map(c => `${c.city},${c.state_or_province},${c.country},${c.tier},"${c.reason_tags.join('|')}"`).join('\n');
    fs.writeFileSync(csvPath, csvHeader + csvRows);

    console.log(`Generated ${finalOutput.length} seed cities.`);
    console.log(`Saved JSON: ${jsonPath}`);
    console.log(`Saved CSV: ${csvPath}`);

    return finalOutput;
}

if (require.main === module) {
    generateSmartSeedList([], false).then(() => {
        console.log("Smart Seed Generation Complete.");
        process.exit(0);
    });
}
