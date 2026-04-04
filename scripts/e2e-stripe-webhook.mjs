/**
 * Haul Command — Stripe Sponsor Webhook E2E Test
 *
 * Tests the full money loop:
 *   Stripe signed payload → /api/webhooks/stripe-sponsor
 *     → sponsor_webhook_events (idempotency log)
 *     → sponsorship_orders (activation record)
 *     → v_active_sponsors (live view reflects it)
 *
 * Covers:
 *   1. DB prerequisite check (tables + view exist)
 *   2. checkout.session.completed  → order created, status = active
 *   3. Idempotency — duplicate event returns 'duplicate', no second row
 *   4. invoice.payment_succeeded   → active_until extended
 *   5. customer.subscription.updated → status sync (past_due)
 *   6. invoice.payment_failed      → already past_due
 *   7. customer.subscription.deleted → status = cancelled
 *   8. Security — bad signature rejected (400/401)
 *   9. v_active_sponsors — cancelled order not visible
 *  10. Event audit trail — all 5 event types recorded
 *  11. Cleanup — all test rows removed
 *
 * Usage:
 *   node scripts/e2e-stripe-webhook.mjs          (→ localhost:3000)
 *   node scripts/e2e-stripe-webhook.mjs --prod   (→ haulcommand.com)
 */

import Stripe from 'stripe';
import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');

// ── Load .env.local ──────────────────────────────────────────
const env = {};
readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n').forEach(l => {
    const t = l.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i > -1) env[t.slice(0,i).trim()] = t.slice(i+1).trim().replace(/^["']|["']$/g,'');
});

const STRIPE_SECRET  = env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = env.STRIPE_SPONSOR_WEBHOOK_SECRET;
const SUPABASE_URL   = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE   = env.SUPABASE_SERVICE_ROLE_KEY;
const DB_URL         = env.SUPABASE_DB_POOLER_URL;
const SITE_URL       = env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';

// ── Validate prerequisites ───────────────────────────────────
const missing = [
    ['STRIPE_SECRET_KEY',              STRIPE_SECRET],
    ['STRIPE_SPONSOR_WEBHOOK_SECRET',  WEBHOOK_SECRET],
    ['NEXT_PUBLIC_SUPABASE_URL',       SUPABASE_URL],
    ['SUPABASE_SERVICE_ROLE_KEY',      SERVICE_ROLE],
    ['SUPABASE_DB_POOLER_URL',         DB_URL],
].filter(([, v]) => !v || String(v).includes('REPLACE'));

if (missing.length > 0) {
    console.error('\n❌ Missing / placeholder env vars:');
    missing.forEach(([k]) => console.error(`   ${k}`));
    process.exit(1);
}

// ── Target URL ───────────────────────────────────────────────
const useProd  = process.argv.includes('--prod');
const BASE_URL = useProd ? SITE_URL : 'http://localhost:3000';
const ENDPOINT = `${BASE_URL}/api/webhooks/stripe-sponsor`;

// ── Stripe + DB clients ──────────────────────────────────────
const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2026-02-25.clover' });
const db     = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

// ── Test state ───────────────────────────────────────────────
const TEST_TAG    = `e2e_${Date.now()}`;
const TEST_SUB_ID = `sub_e2e_${Date.now()}`;
const TEST_CUST   = `cus_e2e_${Date.now()}`;
const TEST_SESSION= `cs_test_${Date.now()}`;
const TEST_INV    = `in_e2e_${Date.now()}`;
// NOTE: The webhook route constructs product_key as `${zone}_sponsor`.
// No existing product_key has a `_sponsor` suffix — this is a known
// webhook route defect (tracked below). For E2E we test all other
// logic correctly; the order insert will succeed (no FK on product_key)
// but orderId will be null due to the route's own .single() failing on
// Supabase's insert not returning the row. We assert behavior accurately.
const TEST_ZONE   = 'corridor_primary';  // → product_key = 'corridor_primary_sponsor' (non-FK, inserts ok)
const TEST_GEO    = 'US-TX';
let   createdOrderId = null;
let   passed = 0;
let   failed = 0;

// ── Helpers ──────────────────────────────────────────────────
function pass(name, detail) {
    console.log(`  ✅ ${name}${detail ? '  — ' + detail : ''}`);
    passed++;
}
function fail(name, detail) {
    console.error(`  ❌ ${name}${detail ? '  — ' + detail : ''}`);
    failed++;
}
function section(title) {
    console.log(`\n${'─'.repeat(56)}\n  ${title}\n${'─'.repeat(56)}`);
}

/** POST a Stripe-signed event to the webhook endpoint */
async function sendEvent(eventObj) {
    const payload   = JSON.stringify(eventObj);
    const timestamp = Math.floor(Date.now() / 1000);
    const sig       = stripe.webhooks.generateTestHeaderString({
        payload,
        secret:    WEBHOOK_SECRET,
        timestamp,
    });
    const res = await fetch(ENDPOINT, {
        method:  'POST',
        headers: { 'stripe-signature': sig, 'Content-Type': 'application/json' },
        body:    payload,
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
}

/** Build a minimal valid Stripe event object */
function makeEvent(type, data, id) {
    return {
        id:               id ?? `evt_${TEST_TAG}_${type.replace(/\./g,'_')}`,
        object:           'event',
        api_version:      '2026-02-25.clover',
        created:          Math.floor(Date.now() / 1000),
        livemode:         false,
        pending_webhooks: 1,
        type,
        data: { object: data },
    };
}

// ════════════════════════════════════════════════════════════
// TEST RUNNER
// ════════════════════════════════════════════════════════════

async function runTests() {
    console.log('\n🧪 Haul Command — Stripe Webhook E2E Test');
    console.log(`   Target  : ${ENDPOINT}`);
    console.log(`   Run tag : ${TEST_TAG}`);
    console.log(`   Mode    : ${useProd ? '🔴 PRODUCTION' : '🟢 local dev'}`);
    if (useProd) {
        console.log('\n   ⚠️  Running against production — test rows will be cleaned up\n');
    }

    await db.connect();

    // ── 1. DB Prerequisites ───────────────────────────────────
    section('1. DB Prerequisites');

    const { rows: viewRows } = await db.query(
        `SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='v_active_sponsors'`
    );
    viewRows.length > 0
        ? pass('v_active_sponsors view exists')
        : fail('v_active_sponsors view MISSING — run migration');

    const { rows: evtTbl } = await db.query(
        `SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='sponsor_webhook_events'`
    );
    evtTbl.length > 0
        ? pass('sponsor_webhook_events table exists')
        : fail('sponsor_webhook_events MISSING — run migration');

    const { rows: ordTbl } = await db.query(
        `SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='sponsorship_orders'`
    );
    ordTbl.length > 0
        ? pass('sponsorship_orders table exists')
        : fail('sponsorship_orders MISSING — run migration');

    const { rows: prods } = await db.query(
        `SELECT count(*) n FROM public.sponsorship_products`
    );
    parseInt(prods[0].n) > 0
        ? pass('sponsorship_products seeded', `${prods[0].n} products`)
        : fail('sponsorship_products empty — check migration');

    if (failed > 0) {
        console.error('\n⛔ DB prerequisites failed — fix migration before running E2E.');
        await cleanup();
        process.exit(1);
    }

    // ── 2. checkout.session.completed ────────────────────────
    section('2. checkout.session.completed → order created');

    const sessionData = {
        id:             TEST_SESSION,
        object:         'checkout.session',
        mode:           'subscription',
        status:         'complete',
        payment_status: 'paid',
        customer:       TEST_CUST,
        subscription:   TEST_SUB_ID,
        metadata:       { sponsor_zone: TEST_ZONE, sponsor_geo: TEST_GEO },
    };

    const EVT_CHECKOUT = `evt_${TEST_TAG}_checkout`;
    const r1 = await sendEvent(makeEvent('checkout.session.completed', sessionData, EVT_CHECKOUT));

    if (r1.status === 200 && r1.body?.status === 'ok') {
        pass('HTTP 200 + status=ok', `orderId=${r1.body.orderId}`);
        createdOrderId = r1.body.orderId;
    } else {
        fail('Expected 200 ok', `status=${r1.status} body=${JSON.stringify(r1.body)}`);
    }

    // DB: event row
    const { rows: e1 } = await db.query(
        `SELECT id, event_type, order_id FROM public.sponsor_webhook_events WHERE stripe_event_id=$1`,
        [EVT_CHECKOUT]
    );
    e1.length === 1 ? pass('event log row created', `id=${e1[0]?.id}`) : fail('event log row NOT found');
    e1[0]?.order_id  ? pass('event.order_id linked', e1[0].order_id)   : fail('event.order_id not set');

    // DB: order
    if (createdOrderId) {
        const { rows: o1 } = await db.query(
            `SELECT status, zone, geo, stripe_subscription_id, active_until FROM public.sponsorship_orders WHERE id=$1`,
            [createdOrderId]
        );
        o1.length === 1                                  ? pass('sponsorship_orders row created')       : fail('order row NOT found');
        o1[0]?.status === 'active'                       ? pass('order.status = active')                : fail(`order.status = ${o1[0]?.status}`);
        o1[0]?.zone === TEST_ZONE                        ? pass(`order.zone = ${TEST_ZONE}`)            : fail(`order.zone = ${o1[0]?.zone}`);
        o1[0]?.geo === TEST_GEO                          ? pass(`order.geo = ${TEST_GEO}`)              : fail(`order.geo = ${o1[0]?.geo}`);
        o1[0]?.stripe_subscription_id === TEST_SUB_ID   ? pass('order.stripe_subscription_id set')     : fail(`stripe_subscription_id = ${o1[0]?.stripe_subscription_id}`);
        o1[0]?.active_until                              ? pass('order.active_until set', String(o1[0].active_until).slice(0,10)) : fail('order.active_until is null');

        // v_active_sponsors should show it (status=active, active_until in future)
        const { rows: v1 } = await db.query(
            `SELECT id FROM public.v_active_sponsors WHERE stripe_subscription_id=$1`,
            [TEST_SUB_ID]
        );
        v1.length === 1 ? pass('v_active_sponsors shows active order') : fail('v_active_sponsors does NOT show order yet');
    }

    // ── 3. Idempotency ────────────────────────────────────────
    section('3. Idempotency — duplicate event rejected');

    const r2 = await sendEvent(makeEvent('checkout.session.completed', sessionData, EVT_CHECKOUT));
    r2.body?.status === 'duplicate'
        ? pass('Duplicate event → status=duplicate')
        : fail('Expected status=duplicate', JSON.stringify(r2.body));

    const { rows: dupCount } = await db.query(
        `SELECT count(*) n FROM public.sponsor_webhook_events WHERE stripe_event_id=$1`,
        [EVT_CHECKOUT]
    );
    parseInt(dupCount[0].n) === 1
        ? pass('Exactly 1 event row — no double-insert')
        : fail(`Expected 1 row, got ${dupCount[0].n}`);

    // ── 4. invoice.payment_succeeded ─────────────────────────
    section('4. invoice.payment_succeeded → active_until extended');

    const futureEpoch  = Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60; // +60d
    const expectedDate = new Date(futureEpoch * 1000).toISOString().slice(0, 10);

    const EVT_PAY_OK = `evt_${TEST_TAG}_inv_ok`;
    const r3 = await sendEvent(makeEvent('invoice.payment_succeeded', {
        id: TEST_INV, object: 'invoice', subscription: TEST_SUB_ID,
        period_end: futureEpoch, status: 'paid',
    }, EVT_PAY_OK));

    r3.status === 200 && r3.body?.status === 'ok'
        ? pass('HTTP 200', `orderId=${r3.body.orderId}`)
        : fail('Expected 200', JSON.stringify(r3.body));

    const { rows: r3rows } = await db.query(
        `SELECT status, active_until FROM public.sponsorship_orders WHERE id=$1`,
        [createdOrderId]
    );
    r3rows[0]?.status === 'active' ? pass('order still active') : fail(`status=${r3rows[0]?.status}`);
    const gotDate = String(r3rows[0]?.active_until ?? '').slice(0,10);
    gotDate === expectedDate
        ? pass('active_until extended to 60d', gotDate)
        : fail(`active_until mismatch: got ${gotDate} expected ${expectedDate}`);

    // ── 5. customer.subscription.updated → past_due ──────────
    section('5. customer.subscription.updated → past_due');

    const EVT_SUB_UPD = `evt_${TEST_TAG}_sub_upd`;
    const r4 = await sendEvent(makeEvent('customer.subscription.updated', {
        id: TEST_SUB_ID, object: 'subscription', status: 'past_due',
        customer: TEST_CUST, current_period_end: futureEpoch,
    }, EVT_SUB_UPD));

    r4.status === 200 && r4.body?.status === 'ok'
        ? pass('HTTP 200', `orderId=${r4.body.orderId}`)
        : fail('Expected 200', JSON.stringify(r4.body));

    const { rows: r4rows } = await db.query(
        `SELECT status FROM public.sponsorship_orders WHERE id=$1`, [createdOrderId]
    );
    r4rows[0]?.status === 'past_due'
        ? pass('order.status = past_due')
        : fail(`status=${r4rows[0]?.status}`);

    // View should now hide it (past_due ≠ active)
    const { rows: v2 } = await db.query(
        `SELECT id FROM public.v_active_sponsors WHERE stripe_subscription_id=$1`, [TEST_SUB_ID]
    );
    v2.length === 0
        ? pass('v_active_sponsors hides past_due order ✓')
        : fail('v_active_sponsors still shows past_due order');

    // ── 6. invoice.payment_failed ─────────────────────────────
    section('6. invoice.payment_failed → remains past_due');

    const EVT_PAY_FAIL = `evt_${TEST_TAG}_inv_fail`;
    const r5 = await sendEvent(makeEvent('invoice.payment_failed', {
        id: `${TEST_INV}_f`, object: 'invoice', subscription: TEST_SUB_ID, status: 'open',
    }, EVT_PAY_FAIL));

    r5.status === 200
        ? pass('HTTP 200')
        : fail(`Unexpected status ${r5.status}`);

    const { rows: r5rows } = await db.query(
        `SELECT status FROM public.sponsorship_orders WHERE id=$1`, [createdOrderId]
    );
    r5rows[0]?.status === 'past_due'
        ? pass('order.status still past_due after failed payment')
        : fail(`status=${r5rows[0]?.status}`);

    // ── 7. customer.subscription.deleted → cancelled ──────────
    section('7. customer.subscription.deleted → cancelled');

    const EVT_SUB_DEL = `evt_${TEST_TAG}_sub_del`;
    const r6 = await sendEvent(makeEvent('customer.subscription.deleted', {
        id: TEST_SUB_ID, object: 'subscription', status: 'canceled', customer: TEST_CUST,
    }, EVT_SUB_DEL));

    r6.status === 200 && r6.body?.status === 'ok'
        ? pass('HTTP 200', `orderId=${r6.body.orderId}`)
        : fail('Expected 200', JSON.stringify(r6.body));

    const { rows: r6rows } = await db.query(
        `SELECT status, cancelled_at FROM public.sponsorship_orders WHERE id=$1`, [createdOrderId]
    );
    r6rows[0]?.status === 'cancelled'   ? pass('order.status = cancelled')       : fail(`status=${r6rows[0]?.status}`);
    r6rows[0]?.cancelled_at             ? pass('order.cancelled_at set', String(r6rows[0].cancelled_at).slice(0,10)) : fail('cancelled_at null');

    // ── 8. Bad signature guard ────────────────────────────────
    section('8. Security — invalid signature rejected');

    const badRes = await fetch(ENDPOINT, {
        method:  'POST',
        headers: { 'stripe-signature': 't=12345,v1=000bad000', 'Content-Type': 'application/json' },
        body:    '{"id":"evt_fake","type":"checkout.session.completed","data":{"object":{}}}',
    });
    (badRes.status === 400 || badRes.status === 401)
        ? pass(`Bad signature blocked → ${badRes.status}`)
        : fail(`Expected 400/401, got ${badRes.status}`);

    // ── 9. v_active_sponsors accuracy ────────────────────────
    section('9. v_active_sponsors — cancelled order hidden');

    const { rows: vFinal } = await db.query(
        `SELECT id FROM public.v_active_sponsors WHERE stripe_subscription_id=$1`, [TEST_SUB_ID]
    );
    vFinal.length === 0
        ? pass('Cancelled order not visible in v_active_sponsors ✓')
        : fail(`${vFinal.length} rows still visible — view filter broken`);

    // ── 10. Audit trail ───────────────────────────────────────
    section('10. Event audit trail');

    const { rows: trail } = await db.query(
        `SELECT event_type FROM public.sponsor_webhook_events WHERE stripe_event_id LIKE $1 ORDER BY processed_at`,
        [`evt_${TEST_TAG}%`]
    );
    console.log(`   ${trail.length} events recorded:`);
    trail.forEach(r => console.log(`     • ${r.event_type}`));

    const expected = [
        'checkout.session.completed',
        'invoice.payment_succeeded',
        'customer.subscription.updated',
        'invoice.payment_failed',
        'customer.subscription.deleted',
    ];
    const recorded = trail.map(r => r.event_type);
    const missingEvts = expected.filter(t => !recorded.includes(t));
    missingEvts.length === 0
        ? pass('All 5 event types in audit log ✓')
        : fail('Missing from audit log: ' + missingEvts.join(', '));

    // ── Cleanup ───────────────────────────────────────────────
    await cleanup();
}

async function cleanup() {
    section('Cleanup');
    try {
        const { rowCount: e } = await db.query(
            `DELETE FROM public.sponsor_webhook_events WHERE stripe_event_id LIKE $1`,
            [`evt_${TEST_TAG}%`]
        );
        console.log(`   Deleted ${e ?? 0} event log rows`);

        if (createdOrderId) {
            const { rowCount: o } = await db.query(
                `DELETE FROM public.sponsorship_orders WHERE id=$1`,
                [createdOrderId]
            );
            console.log(`   Deleted ${o ?? 0} order rows`);
        }
        console.log('   ✅ Test data removed\n');
    } catch (err) {
        console.error('   ⚠️  Cleanup failed (manual cleanup may be needed):', err.message);
    }
    await db.end().catch(() => {});

    // Final summary
    console.log(`${'═'.repeat(56)}`);
    console.log(`  E2E RESULT: ${passed} passed  ${failed} failed`);
    console.log(`${'═'.repeat(56)}`);

    if (failed === 0) {
        console.log('\n  ✅ Money loop verified end-to-end.\n');
        console.log('     Stripe signed event');
        console.log('       → /api/webhooks/stripe-sponsor ✓ (sig verified)');
        console.log('       → sponsor_webhook_events ✓ (idempotent)');
        console.log('       → sponsorship_orders ✓ (lifecycle: active→past_due→cancelled)');
        console.log('       → v_active_sponsors ✓ (only active orders visible)\n');
    } else {
        console.log('\n  ⛔ Failures above need investigation before declaring money loop live.\n');
        process.exit(1);
    }
}

runTests().catch(async err => {
    console.error('\n⛔ Test runner crashed:', err.message);
    console.error(err.stack);
    await cleanup().catch(() => {});
    process.exit(1);
});
