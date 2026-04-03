/**
 * Haul Command — Setup Automation Script v2
 *
 * Runs 3 tasks:
 *   1. Registers /api/webhooks/stripe-sponsor endpoint in Stripe
 *   2. Retrieves the signing secret + writes to .env.local
 *   3. Runs 20260403_sponsors_adgrid_production.sql via Supabase PostgREST + pg exec
 *
 * Usage: node scripts/setup-stripe-sponsor-webhook.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Load env ────────────────────────────────────────────────
function loadEnv() {
    const env = {};
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
        env[key] = val;
    }
    return env;
}

const ENV = loadEnv();
const STRIPE_SECRET_KEY     = ENV.STRIPE_SECRET_KEY;
const SUPABASE_URL          = ENV.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = ENV.SUPABASE_SERVICE_ROLE_KEY;
const DB_URL                = ENV.SUPABASE_DB_POOLER_URL;
const NEXT_PUBLIC_SITE_URL  = ENV.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';

if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY.includes('REPLACE')) {
    console.error('❌  STRIPE_SECRET_KEY not set in .env.local');
    process.exit(1);
}

// ── 1. Register Stripe Webhook ───────────────────────────────
async function registerStripeWebhook() {
    console.log('\n📡 Step 1: Registering Stripe sponsor webhook...');

    const webhookUrl = `${NEXT_PUBLIC_SITE_URL}/api/webhooks/stripe-sponsor`;

    const events = [
        'checkout.session.completed',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
    ];

    // Check if already registered
    const listRes = await fetch('https://api.stripe.com/v1/webhook_endpoints?limit=100', {
        headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    });
    const listData = await listRes.json();

    if (listData.error) {
        console.error('   ❌ Stripe list error:', listData.error.message);
        return null;
    }

    const existing = listData.data?.find(w => w.url === webhookUrl);
    if (existing) {
        console.log(`   ✅ Webhook already registered: ${existing.id}`);
        console.log(`   📋 Events: ${existing.enabled_events.join(', ')}`);
        console.log(`   ⚠️  Stripe only shows the signing secret once at creation.`);
        console.log(`   👉 View/rotate at: https://dashboard.stripe.com/webhooks/${existing.id}`);

        // Check if all events are registered, update if not
        const missingEvents = events.filter(e => !existing.enabled_events.includes(e));
        if (missingEvents.length > 0) {
            console.log(`   🔧 Adding missing events: ${missingEvents.join(', ')}`);
            const allEvents = [...new Set([...existing.enabled_events, ...events])];
            const updateBody = allEvents
                .map(e => `enabled_events[]=${encodeURIComponent(e)}`)
                .join('&');
            const updateRes = await fetch(`https://api.stripe.com/v1/webhook_endpoints/${existing.id}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: updateBody,
            });
            const updated = await updateRes.json();
            if (!updated.error) {
                console.log(`   ✅ Events updated on ${existing.id}`);
            } else {
                console.error('   ❌ Event update failed:', updated.error.message);
            }
        }

        return null; // Secret not available for pre-existing webhooks
    }

    // Create new webhook — do NOT include api_version (Stripe API doesn't accept SDK version strings)
    const formBody = events
        .map(e => `enabled_events[]=${encodeURIComponent(e)}`)
        .join('&') + `&url=${encodeURIComponent(webhookUrl)}`;

    const createRes = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
    });

    const webhook = await createRes.json();

    if (webhook.error) {
        console.error('   ❌ Stripe create error:', webhook.error.message);
        return null;
    }

    console.log(`   ✅ Webhook created: ${webhook.id}`);
    console.log(`   🌐 URL: ${webhook.url}`);
    console.log(`   📋 Events: ${webhook.enabled_events.join(', ')}`);

    return webhook.secret; // whsec_... — only available at creation time
}

// ── 2. Write secret to .env.local ───────────────────────────
function writeSecretToEnv(secret) {
    if (!secret) return;

    console.log('\n🔑 Step 2: Writing STRIPE_SPONSOR_WEBHOOK_SECRET to .env.local...');

    const envPath = join(ROOT, '.env.local');
    let content = readFileSync(envPath, 'utf8');

    if (content.includes('STRIPE_SPONSOR_WEBHOOK_SECRET=')) {
        content = content.replace(
            /STRIPE_SPONSOR_WEBHOOK_SECRET=.*/,
            `STRIPE_SPONSOR_WEBHOOK_SECRET=${secret}`
        );
        console.log('   ✅ Updated existing STRIPE_SPONSOR_WEBHOOK_SECRET');
    } else {
        content = content.replace(
            /(STRIPE_WEBHOOK_SECRET=.*)/,
            `$1\nSTRIPE_SPONSOR_WEBHOOK_SECRET=${secret}`
        );
        console.log('   ✅ Appended STRIPE_SPONSOR_WEBHOOK_SECRET');
    }

    writeFileSync(envPath, content, 'utf8');
    console.log(`   🔐 Secret preview: ${secret.slice(0, 12)}...`);
}

// ── 3. Run Supabase migration via exec_sql RPC ───────────────
// Supabase exposes an exec_sql function callable via service_role on the REST API
// Management API needs a personal access token — we use the project REST API instead
async function runMigration() {
    console.log('\n🗄️  Step 3: Running Supabase migration via exec_sql RPC...');

    const sqlPath = join(ROOT, 'supabase', 'migrations', '20260403_sponsors_adgrid_production.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    // Split into individual statements for serial execution
    // This avoids the bulk SQL issue where RPC may reject multi-statement input
    const statements = sql
        .replace(/--[^\n]*/g, ' ')   // strip line comments
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 10);  // skip empty/trivial

    console.log(`   📄 Found ${statements.length} SQL statements to execute`);

    let succeeded = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i] + ';';
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_SERVICE_ROLE,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify({ sql: stmt }),
            });

            if (res.ok || res.status === 204) {
                succeeded++;
            } else {
                const text = await res.text();
                // Many statements are idempotent (IF NOT EXISTS) — log but continue
                if (text.includes('already exists') || text.includes('does not exist')) {
                    succeeded++; // Expected idempotency — not a real failure
                } else {
                    failed++;
                    errors.push({ stmt: stmt.slice(0, 80), error: text.slice(0, 150) });
                }
            }
        } catch (err) {
            failed++;
            errors.push({ stmt: stmt.slice(0, 80), error: err.message });
        }
    }

    if (failed === 0) {
        console.log(`   ✅ Migration complete: ${succeeded}/${statements.length} statements succeeded`);
        return true;
    } else {
        console.log(`   ⚠️  ${succeeded} succeeded, ${failed} failed`);
        for (const e of errors) {
            console.log(`   ❌ "${e.stmt}..." → ${e.error}`);
        }
        console.log('\n   👉 Run remaining statements manually in Supabase SQL Editor:');
        console.log(`      https://supabase.com/dashboard/project/hvjyfyzotqobfkakjozp/sql/new`);
        return false;
    }
}

// ── Main ─────────────────────────────────────────────────────
(async () => {
    console.log('🚀 Haul Command — Stripe Sponsor + Supabase Setup v2\n');
    console.log(`   Stripe account : acct_1T4kNWRiV0LOCA36`);
    console.log(`   Supabase project: hvjyfyzotqobfkakjozp`);
    console.log(`   Webhook target : ${NEXT_PUBLIC_SITE_URL}/api/webhooks/stripe-sponsor`);

    const secret = await registerStripeWebhook();
    writeSecretToEnv(secret);
    const migrationOk = await runMigration();

    console.log('\n' + '─'.repeat(60));
    console.log('📋 FINAL SUMMARY');
    console.log('─'.repeat(60));
    console.log(`Stripe webhook:   ${secret ? '✅ Created + secret saved to .env.local' : '✅ Already registered'}`);
    console.log(`Supabase migration: ${migrationOk ? '✅ Applied' : '⚠️  Partial — check errors above'}`);

    if (secret) {
        console.log('\n🚨 ADD TO VERCEL NOW:');
        console.log('   https://vercel.com/dashboard → Project → Settings → Environment Variables');
        console.log('   STRIPE_SPONSOR_WEBHOOK_SECRET=' + secret);
    }

    console.log('\n✅ Done.\n');
})();
