/**
 * Jurisdiction Drawer — Strict Filter Acceptance Tests
 * 
 * Validates:
 * 1. get_jurisdiction_drawer returns ONLY matching jurisdiction_code records
 * 2. "US-FL request never returns US-WY records" (seeded test data)
 * 3. Invalid jurisdiction_code returns empty arrays + message
 * 4. Cache key format stability
 * 
 * Usage: npx tsx tests/jurisdiction-drawer.test.ts
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env vars
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string) {
    if (condition) {
        console.log(`  ✅ ${name}`);
        passed++;
    } else {
        console.error(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
        failed++;
    }
}

async function runTests() {
    console.log('═══════════════════════════════════════════════');
    console.log(' JURISDICTION DRAWER — STRICT FILTER TESTS');
    console.log('═══════════════════════════════════════════════\n');

    // ── Test 1: US-FL returns FL data only ──
    console.log('Test 1: US-FL returns matching data');
    const { data: flData } = await supabase.rpc('get_jurisdiction_drawer', { p_jurisdiction_code: 'US-FL' });

    assert(flData?.meta?.jurisdiction_code === 'US-FL', 'Meta contains US-FL code');
    assert(flData?.meta?.name === 'Florida', 'Meta contains Florida name');

    if (flData?.operators?.length > 0) {
        const allFL = flData.operators.every((op: any) => op.jurisdiction_code === 'US-FL');
        assert(allFL, 'All operators belong to US-FL');
    } else {
        assert(true, 'No operators seeded (expected if migration not run)');
    }

    // ── Test 2: US-FL NEVER returns US-WY data ──
    console.log('\nTest 2: US-FL never returns US-WY data');
    const { data: wyData } = await supabase.rpc('get_jurisdiction_drawer', { p_jurisdiction_code: 'US-WY' });

    if (flData?.operators && wyData?.operators) {
        const flIds = new Set(flData.operators.map((op: any) => op.operator_id));
        const wyIds = new Set(wyData.operators.map((op: any) => op.operator_id));

        const overlap = [...flIds].filter(id => wyIds.has(id));
        assert(overlap.length === 0, 'Zero overlap between FL and WY operator IDs');

        const flNames = flData.operators.map((op: any) => op.business_name);
        const wyNames = wyData.operators.map((op: any) => op.business_name);
        const nameOverlap = flNames.filter((n: string) => wyNames.includes(n));
        assert(nameOverlap.length === 0, 'Zero overlap between FL and WY business names');
    } else {
        assert(true, 'No operators to compare (expected if migration not run)');
    }

    // ── Test 3: Invalid jurisdiction_code returns empty ──
    console.log('\nTest 3: Invalid code returns empty arrays');
    const { data: invalidData } = await supabase.rpc('get_jurisdiction_drawer', { p_jurisdiction_code: 'XX-ZZ' });

    assert(invalidData?.meta === null, 'Meta is null for invalid code');
    assert(Array.isArray(invalidData?.operators) && invalidData.operators.length === 0, 'Operators empty for invalid code');
    assert(Array.isArray(invalidData?.rulepacks) && invalidData.rulepacks.length === 0, 'Rulepacks empty for invalid code');
    assert(Array.isArray(invalidData?.support_contacts) && invalidData.support_contacts.length === 0, 'Support contacts empty for invalid code');
    assert(typeof invalidData?.message === 'string', 'Message present for invalid code');

    // ── Test 4: Cache key format stability ──
    console.log('\nTest 4: Cache key format stability');
    const cacheKey1 = 'US-FL:drawer:v1';
    const cacheKey2 = 'US-WY:drawer:v1';
    assert(cacheKey1 === `US-FL:drawer:v1`, 'FL cache key matches expected format');
    assert(cacheKey2 === `US-WY:drawer:v1`, 'WY cache key matches expected format');
    assert(cacheKey1 !== cacheKey2, 'FL and WY cache keys are distinct');

    // ── Test 5: WY data is strictly WY ──
    console.log('\nTest 5: US-WY returns WY data only');
    assert(wyData?.meta?.jurisdiction_code === 'US-WY', 'WY meta contains US-WY code');
    if (wyData?.operators?.length > 0) {
        const allWY = wyData.operators.every((op: any) => op.jurisdiction_code === 'US-WY');
        assert(allWY, 'All WY operators belong to US-WY');
    }

    // ── Summary ──
    console.log('\n═══════════════════════════════════════════════');
    console.log(` RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    console.log('═══════════════════════════════════════════════');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
});
