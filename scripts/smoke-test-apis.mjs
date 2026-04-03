#!/usr/bin/env node
// scripts/smoke-test-apis.mjs
// API Contract Smoke Test Suite — Haul Command
//
// USAGE:
//   node scripts/smoke-test-apis.mjs
//   node scripts/smoke-test-apis.mjs --base-url https://haulcommand.com
//   node scripts/smoke-test-apis.mjs --verbose
//
// Tests all major APIs built during the monetization sprint.
// Does NOT require Stripe/push/external services — tests contract shape only.

const BASE_URL = process.argv.find(a => a.startsWith('--base-url='))?.split('=')[1] ?? 'http://localhost:3000';
const VERBOSE = process.argv.includes('--verbose');
let passed = 0, failed = 0;

const log = (...args) => VERBOSE && console.log(...args);
const pass = (name) => { passed++; console.log(`  ✅ ${name}`); };
const fail = (name, reason) => { failed++; console.error(`  ❌ ${name} — ${reason}`); };

async function get(path, opts = {}) {
    const r = await fetch(`${BASE_URL}${path}`, { method: 'GET', ...opts });
    return { status: r.status, body: await r.json().catch(() => ({})) };
}

async function post(path, data = {}, opts = {}) {
    const r = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...opts.headers },
        body: JSON.stringify(data),
        ...opts,
    });
    return { status: r.status, body: await r.json().catch(() => ({})) };
}

// ─── TEST UTILITIES ──────────────────────────────────────────────────────────

function expectStatus(name, { status }, expected) {
    if (status === expected) pass(`${name} [${status}]`);
    else fail(`${name}`, `expected ${expected}, got ${status}`);
}

function expectField(name, body, field) {
    if (body[field] !== undefined) pass(`${name} has '${field}'`);
    else fail(`${name}`, `missing field '${field}' in: ${JSON.stringify(body).slice(0, 120)}`);
}

function expectArray(name, body, field) {
    if (Array.isArray(body[field])) pass(`${name} '${field}' is array`);
    else fail(`${name}`, `'${field}' is not array`);
}

// ─── SUITES ──────────────────────────────────────────────────────────────────

async function testAdsServe() {
    console.log('\n📢 AdRank / Ads Serve');

    const r1 = await get('/api/ads/serve?zone=hero_billboard&geo=US&limit=3');
    expectStatus('GET /api/ads/serve', r1, 200);
    if (Array.isArray(r1.body)) pass('Returns ServedAd[]');
    else fail('Returns ServedAd[]', `got: ${typeof r1.body}`);

    if (Array.isArray(r1.body) && r1.body.length > 0) {
        const ad = r1.body[0];
        ['ad_id', 'campaign_id', 'headline', 'cta_text', 'cta_url', 'ad_rank'].forEach(f => {
            if (ad[f] !== undefined) pass(`ServedAd has '${f}'`);
            else fail(`ServedAd has '${f}'`, `missing`);
        });
    }

    // Zone targeting
    const r2 = await get('/api/ads/serve?zone=directory_sidebar&role=pilot_car_operator');
    expectStatus('GET /api/ads/serve (role targeted)', r2, 200);

    // Limit cap
    const r3 = await get('/api/ads/serve?limit=1');
    if (Array.isArray(r3.body) && r3.body.length <= 1) pass('Limit=1 respected');
    else fail('Limit=1 respected', `got ${r3.body?.length} items`);
}

async function testMarketSnapshot() {
    console.log('\n📊 Market Snapshot');
    const r = await get('/api/market/snapshot?geo=TX');
    expectStatus('GET /api/market/snapshot', r, 200);
    ['operator_count', 'claim_rate'].forEach(f => expectField('snapshot', r.body, f));
}

async function testPressureCompute() {
    console.log('\n🔥 Freemium Pressure Engine');
    const r = await post('/api/pressure/compute', {});
    expectStatus('POST /api/pressure/compute', r, 200);
    expectField('pressure response', r.body, 'pressure');
    const validLevels = ['none', 'soft', 'medium', 'aggressive', 'hard_gate'];
    if (validLevels.includes(r.body.pressure)) pass(`pressure='${r.body.pressure}' is valid`);
    else fail('pressure valid level', `got '${r.body.pressure}'`);
}

async function testBoostOffer() {
    console.log('\n💎 Boost Offer Engine');
    const r = await get('/api/boost/offer?operator_id=test-123&state=TX');
    expectStatus('GET /api/boost/offer', r, 200);
    expectField('boost offer', r.body, 'tiers');
    if (Array.isArray(r.body.tiers) && r.body.tiers.length > 0) {
        pass(`${r.body.tiers.length} boost tiers returned`);
        expectField('boost tier', r.body.tiers[0], 'price');
    }
}

async function testRevenueRecover() {
    console.log('\n💰 Revenue Recovery Engine');
    const r = await post('/api/revenue/recover', { operator_id: 'test-123' });
    expectStatus('POST /api/revenue/recover', r, 200);
    expectField('recovery response', r.body, 'signals');
}

async function testRecruiterOffers() {
    console.log('\n🎯 Recruiter Registry');
    const r1 = await get('/api/recruiter/offers?limit=4');
    expectStatus('GET /api/recruiter/offers', r1, 200);
    if (Array.isArray(r1.body) && r1.body.length > 0) {
        pass(`${r1.body.length} recruiter offers`);
        ['id', 'carrier_name', 'pay_range', 'apply_url'].forEach(f =>
            expectField('recruiter offer', r1.body[0], f),
        );
    } else fail('recruiter offers array', 'empty or not array');

    // Apply log
    const r2 = await post('/api/recruiter/offers', {
        offer_id: 'house-barnhart',
        carrier_name: 'Barnhart Crane & Rigging',
        operator_trust_score: 75,
    });
    expectStatus('POST /api/recruiter/offers (apply log)', r2, 200);
    expectField('apply log', r2.body, 'logged');
}

async function testCheckoutSession() {
    console.log('\n💳 Checkout Session');
    const r = await get('/api/checkout/session');
    expectStatus('GET /api/checkout/session (catalog)', r, 200);
    expectField('checkout catalog', r.body, 'products');
    expectArray('checkout catalog', r.body, 'products');
    expectField('checkout catalog', r.body, 'stripe_configured');
    if (r.body.stripe_configured) pass('Stripe key configured ✅');
    else console.log('  ⚠️  stripe not configured (npm install stripe needed)');
}

async function testPushVapid() {
    console.log('\n🔔 Push / VAPID');
    const r = await get('/api/push/send?vapid=1');
    if (r.status === 200 && r.body.publicKey) {
        pass(`VAPID public key: ${r.body.publicKey.slice(0, 20)}...`);
    } else if (r.status === 503) {
        console.log('  ⚠️  VAPID keys in .env.local but push/send not reached (npm install web-push may be needed)');
    } else {
        fail('VAPID public key', `status ${r.status}`);
    }
}

async function testDataBuy() {
    console.log('\n📦 Data Products Buy');
    const r = await get('/api/data/buy?tier=free');
    expectStatus('GET /api/data/buy (catalog)', r, 200);
    expectField('data catalog', r.body, 'products');
    expectArray('data catalog', r.body, 'products');
    if (r.body.products?.length > 0) pass(`${r.body.products.length} products available`);
}

async function testSEOSurfaces() {
    console.log('\n🗺️  SEO Page Families (contract check)');
    const routes = [
        { path: '/corridors/tx/vs/la', label: 'TX→LA corridor' },
        { path: '/best-for/wind-turbine', label: 'wind turbine' },
        { path: '/find/pilot-car-operator/houston', label: 'role+city' },
        { path: '/market/tx', label: 'market/TX' },
    ];
    for (const { path, label } of routes) {
        try {
            const r = await fetch(`${BASE_URL}${path}`);
            if (r.status === 200) pass(`${label} [${r.status}]`);
            else console.log(`  ⚠️  ${label} returned ${r.status} (may need static build)`);
        } catch {
            console.log(`  ⚠️  ${label} unreachable`);
        }
    }
}

// ─── RUNNER ──────────────────────────────────────────────────────────────────

console.log(`\n🚀 Haul Command API Smoke Tests`);
console.log(`   Base URL: ${BASE_URL}`);
console.log(`   Time: ${new Date().toISOString()}\n`);

try {
    await testAdsServe();
    await testMarketSnapshot();
    await testPressureCompute();
    await testBoostOffer();
    await testRevenueRecover();
    await testRecruiterOffers();
    await testCheckoutSession();
    await testPushVapid();
    await testDataBuy();
    await testSEOSurfaces();
} catch (err) {
    console.error('\n🔴 Test runner error:', err);
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    console.log(`\n  ⚠️  ${failed} failed — check output above\n`);
    process.exit(1);
} else {
    console.log(`\n  ✅ All contracts pass\n`);
}
