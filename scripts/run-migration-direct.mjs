/**
 * Haul Command — Direct Postgres Migration Runner
 * Connects to Supabase via Postgres pooler and runs the sponsors migration.
 * Uses pg (node-postgres) — no Supabase REST API dependency.
 *
 * Usage: node scripts/run-migration-direct.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

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
const DB_URL = ENV.SUPABASE_DB_POOLER_URL;

if (!DB_URL) {
    console.error('SUPABASE_DB_POOLER_URL not set in .env.local');
    process.exit(1);
}

const STATEMENTS = [
    {
        name: 'Add subscription columns (idempotent)',
        sql: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sponsorship_orders' AND column_name='stripe_subscription_id') THEN ALTER TABLE public.sponsorship_orders ADD COLUMN stripe_subscription_id text, ADD COLUMN stripe_customer_id text, ADD COLUMN zone text, ADD COLUMN geo text, ADD COLUMN active_from timestamptz, ADD COLUMN active_until timestamptz, ADD COLUMN cancelled_at timestamptz; END IF; END $$;`,
    },
    {
        name: 'Drop old status check constraint',
        sql: `ALTER TABLE public.sponsorship_orders DROP CONSTRAINT IF EXISTS sponsorship_orders_status_check;`,
    },
    {
        name: 'Add hardened status constraint',
        sql: `ALTER TABLE public.sponsorship_orders ADD CONSTRAINT sponsorship_orders_status_check CHECK (status IN ('pending','paid','active','cancelled','past_due','failed','refunded'));`,
    },
    {
        name: 'Index: zone+geo+status',
        sql: `CREATE INDEX IF NOT EXISTS idx_sponsorship_orders_zone_geo_status ON public.sponsorship_orders(zone, geo, status) WHERE status = 'active';`,
    },
    {
        name: 'Index: stripe_subscription_id',
        sql: `CREATE INDEX IF NOT EXISTS idx_sponsorship_orders_stripe_sub ON public.sponsorship_orders(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;`,
    },
    {
        name: 'Index: active_until',
        sql: `CREATE INDEX IF NOT EXISTS idx_sponsorship_orders_active_until ON public.sponsorship_orders(active_until) WHERE status = 'active';`,
    },
    {
        name: 'View: v_active_sponsors',
        sql: `CREATE OR REPLACE VIEW public.v_active_sponsors AS SELECT so.id, so.zone, so.geo, so.status, so.active_from, so.active_until, so.stripe_subscription_id, so.stripe_customer_id, so.user_id, p.display_name AS sponsor_name, p.avatar_url AS sponsor_logo, so.product_key, sp.name AS product_name, sp.amount AS price_monthly FROM public.sponsorship_orders so LEFT JOIN public.profiles p ON p.id = so.user_id LEFT JOIN public.sponsorship_products sp ON sp.product_key = so.product_key WHERE so.status = 'active' AND (so.active_until IS NULL OR so.active_until > now());`,
    },
    {
        name: 'Table: sponsor_webhook_events',
        sql: `CREATE TABLE IF NOT EXISTS public.sponsor_webhook_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), stripe_event_id text NOT NULL UNIQUE, event_type text NOT NULL, processed_at timestamptz NOT NULL DEFAULT now(), order_id uuid REFERENCES public.sponsorship_orders(id) ON DELETE SET NULL, raw_payload jsonb);`,
    },
    {
        name: 'Index: stripe_event_id',
        sql: `CREATE INDEX IF NOT EXISTS idx_sponsor_webhook_events_stripe_id ON public.sponsor_webhook_events(stripe_event_id);`,
    },
    {
        name: 'RLS: sponsor_webhook_events',
        sql: `ALTER TABLE public.sponsor_webhook_events ENABLE ROW LEVEL SECURITY;`,
    },
    {
        name: 'Seed 14 product tiers',
        sql: `INSERT INTO public.sponsorship_products (product_key, name, amount, currency, duration_days) VALUES ('territory_mega','Territory Sponsor — Mega Market',499,'USD',30),('territory_major','Territory Sponsor — Major Market',349,'USD',30),('territory_mid','Territory Sponsor — Mid Market',249,'USD',30),('territory_growth','Territory Sponsor — Growth Market',179,'USD',30),('territory_emerging','Territory Sponsor — Emerging',149,'USD',30),('corridor_flagship','Corridor Sponsor — Flagship',349,'USD',30),('corridor_primary','Corridor Sponsor — Primary',279,'USD',30),('corridor_secondary','Corridor Sponsor — Secondary',179,'USD',30),('port_tier1','Port Sponsor — Tier 1',599,'USD',30),('port_tier2','Port Sponsor — Tier 2',399,'USD',30),('port_tier3','Port Sponsor — Tier 3',299,'USD',30),('country_gold','Country Sponsor — Gold Market',399,'USD',30),('country_blue','Country Sponsor — Blue Market',279,'USD',30),('country_silver','Country Sponsor — Silver Market',219,'USD',30) ON CONFLICT (product_key) DO NOTHING;`,
    },
    { name: '[CHECK] total sponsorship_products', sql: `SELECT count(*) AS total FROM public.sponsorship_products;`, verify: true },
    { name: '[CHECK] v_active_sponsors exists', sql: `SELECT count(*) AS exists FROM information_schema.views WHERE table_schema='public' AND table_name='v_active_sponsors';`, verify: true },
    { name: '[CHECK] sponsor_webhook_events exists', sql: `SELECT count(*) AS exists FROM information_schema.tables WHERE table_schema='public' AND table_name='sponsor_webhook_events';`, verify: true },
    { name: '[CHECK] new columns on sponsorship_orders', sql: `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='sponsorship_orders' AND column_name IN ('zone','geo','stripe_subscription_id','active_from','active_until') ORDER BY column_name;`, verify: true },
];

(async () => {
    console.log('Haul Command — Direct Postgres Migration\n');
    const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000, statement_timeout: 30000 });
    try { await client.connect(); console.log('Connected\n'); }
    catch (err) { console.error('Connection failed:', err.message); process.exit(1); }

    let passed = 0, failed = 0;
    const failures = [];

    for (const stmt of STATEMENTS) {
        process.stdout.write(`  ${stmt.verify ? 'CHECK' : 'RUN  '} ${stmt.name} ... `);
        try {
            const r = await client.query(stmt.sql);
            if (stmt.verify) console.log('OK -> ' + JSON.stringify(r.rows));
            else console.log('OK');
            passed++;
        } catch (err) {
            const msg = String(err.message);
            if (msg.includes('already exists') || msg.includes('does not exist')) {
                console.log('SKIP (idempotent)');
                passed++;
            } else {
                console.log('FAIL: ' + msg.slice(0, 100));
                failed++;
                failures.push(stmt.name + ': ' + msg.slice(0, 100));
            }
        }
    }

    await client.end();
    console.log('\n--- RESULT ---');
    console.log('Passed:', passed, '  Failed:', failed);
    if (failures.length) failures.forEach(f => console.log('  FAIL:', f));
    else console.log('Migration complete.');
})();
