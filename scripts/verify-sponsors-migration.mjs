import pg from 'pg';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const env = {};
fs.readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n').forEach(line => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i > -1) { env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, ''); }
});

const DB_URL = env.SUPABASE_DB_POOLER_URL;
const c = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

// Check if view exists in pg_views
const { rows: viewRows } = await c.query(
    `SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname = 'v_active_sponsors'`
);
console.log('View exists in pg_views:', viewRows.length > 0);

if (viewRows.length === 0) {
    console.log('Creating v_active_sponsors...');
    await c.query(`
        CREATE OR REPLACE VIEW public.v_active_sponsors AS
        SELECT
            so.id, so.zone, so.geo, so.status, so.active_from, so.active_until,
            so.stripe_subscription_id, so.stripe_customer_id, so.user_id,
            p.display_name AS sponsor_name, p.photo_url AS sponsor_logo,
            so.product_key, sp.name AS product_name, sp.amount AS price_monthly
        FROM public.sponsorship_orders so
        LEFT JOIN public.profiles p ON p.id = so.user_id
        LEFT JOIN public.sponsorship_products sp ON sp.product_key = so.product_key
        WHERE so.status = 'active'
          AND (so.active_until IS NULL OR so.active_until > now())
    `);
    console.log('View created successfully');
} else {
    console.log('View already exists — verifying columns...');
    const { rows: cols } = await c.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_active_sponsors' ORDER BY ordinal_position`
    );
    console.log('Columns:', cols.map(r => r.column_name).join(', '));
}

// Final verification
const { rows: final } = await c.query(`SELECT count(*) AS n FROM pg_views WHERE schemaname = 'public' AND viewname = 'v_active_sponsors'`);
const { rows: products } = await c.query(`SELECT count(*) AS n FROM public.sponsorship_products`);
const { rows: wh } = await c.query(`SELECT count(*) AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sponsor_webhook_events'`);

console.log('\n=== FINAL VERIFICATION ===');
console.log('v_active_sponsors:       ', final[0].n === '1' ? 'EXISTS' : 'MISSING');
console.log('sponsor_webhook_events:  ', wh[0].n === '1' ? 'EXISTS' : 'MISSING');
console.log('sponsorship_products:    ', products[0].n, 'rows');

await c.end();
