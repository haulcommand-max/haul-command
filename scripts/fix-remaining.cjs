/**
 * Fix the 3 remaining failed statements
 */
const https = require('https');
const PROJECT_REF = 'hvjyfyzotqobfkakjozp';
const TOKEN = 'sbp_c6b18d697dc25e7677e2b3e7b3c545355f95d4aa';

function query(sql, label) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ query: sql });
        const options = {
            hostname: 'api.supabase.com',
            path: `/v1/projects/${PROJECT_REF}/database/query`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Length': Buffer.byteLength(postData),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`  ✅ ${label}`);
                    resolve(JSON.parse(data));
                } else {
                    console.log(`  ❌ ${label}: ${data.substring(0, 300)}`);
                    reject(new Error(data));
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function main() {
    console.log('=== Fixing 3 remaining failures ===\n');

    // 1. Check what columns hc_event_outbox actually has (0001 stmt 40 tried to create index on "status")
    console.log('--- Diagnosing hc_event_outbox ---');
    try {
        const cols = await query(
            `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='hc_event_outbox' ORDER BY ordinal_position;`,
            'hc_event_outbox columns'
        );
        console.log('  Columns:', cols.map(c => c.column_name).join(', '));

        // The outbox already existed before 0001 ran, so it may have different columns
        // Check if it needs the columns from 0001
        const hasStatus = cols.some(c => c.column_name === 'status');
        const hasAggregateType = cols.some(c => c.column_name === 'aggregate_type');

        if (!hasStatus) {
            console.log('  Adding missing "status" column...');
            try {
                await query(`ALTER TABLE hc_event_outbox ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';`, 'add status column');
            } catch (e) { }
        }
        if (!hasAggregateType) {
            console.log('  Adding missing "aggregate_type" column...');
            try {
                await query(`ALTER TABLE hc_event_outbox ADD COLUMN IF NOT EXISTS aggregate_type text NOT NULL DEFAULT 'unknown';`, 'add aggregate_type column');
                await query(`ALTER TABLE hc_event_outbox ADD COLUMN IF NOT EXISTS aggregate_id text NOT NULL DEFAULT '';`, 'add aggregate_id column');
            } catch (e) { }
        }

        // Now retry the indexes
        console.log('  Creating indexes...');
        try {
            await query(`CREATE INDEX IF NOT EXISTS idx_hc_event_outbox_status ON hc_event_outbox(status);`, 'idx status');
        } catch (e) { }
        try {
            await query(`CREATE INDEX IF NOT EXISTS idx_hc_event_outbox_aggregate ON hc_event_outbox(aggregate_type, aggregate_id);`, 'idx aggregate');
        } catch (e) { }
    } catch (e) {
        console.log(`  Diagnosis failed: ${e.message.substring(0, 100)}`);
    }

    // 2. Check what columns the corridor mat view has (0003 stmt 11 tried to use c.open_count)
    console.log('\n--- Diagnosing hc_mv_corridor_activity_30d ---');
    try {
        const cols = await query(
            `SELECT column_name FROM information_schema.columns WHERE table_name='hc_mv_corridor_activity_30d' ORDER BY ordinal_position;`,
            'corridor MV columns'
        );
        if (cols.length === 0) {
            // It's a matview, check pg_matviews
            const mvDef = await query(
                `SELECT definition FROM pg_matviews WHERE matviewname='hc_mv_corridor_activity_30d';`,
                'corridor MV definition'
            );
            console.log('  MV definition:', mvDef[0]?.definition?.substring(0, 300));
        } else {
            console.log('  Columns:', cols.map(c => c.column_name).join(', '));
        }
    } catch (e) { }

    // Check actual columns via pg_attribute
    try {
        const attrs = await query(
            `SELECT a.attname FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid WHERE c.relname = 'hc_mv_corridor_activity_30d' AND a.attnum > 0 AND NOT a.attisdropped ORDER BY a.attnum;`,
            'corridor MV pg_attributes'
        );
        const colNames = attrs.map(a => a.attname);
        console.log('  Actual columns:', colNames.join(', '));

        // Create the corridor demand view, adapting to actual columns
        const hasOpenCount = colNames.includes('open_count');
        const hasCoveredCount = colNames.includes('covered_count');

        console.log('\n--- Creating hc_dashboard_corridor_demand_v1 ---');
        const viewSQL = `
            CREATE OR REPLACE VIEW hc_dashboard_corridor_demand_v1 AS
            WITH repost AS (
                SELECT lane_key, sum(repost_count) as repost_count
                FROM hc_mv_repost_clusters GROUP BY lane_key
            )
            SELECT
                c.lane_key,
                c.post_count as total_posts_30d,
                c.broker_count as active_brokers_30d,
                ${hasOpenCount ? 'c.open_count,' : '0 as open_count,'}
                ${hasCoveredCount ? 'c.covered_count,' : '0 as covered_count,'}
                c.avg_rate,
                c.median_rate,
                coalesce(r.repost_count, 0) as repost_count_30d,
                CASE WHEN c.post_count = 0 THEN 0::numeric
                     ELSE coalesce(r.repost_count, 0)::numeric / c.post_count::numeric
                END as repost_rate_30d
            FROM hc_mv_corridor_activity_30d c
            LEFT JOIN repost r ON r.lane_key = c.lane_key;
        `;
        await query(viewSQL, 'hc_dashboard_corridor_demand_v1');

    } catch (e) {
        console.log(`  Failed: ${e.message?.substring(0, 200)}`);
    }

    // Final verification
    console.log('\n=== FINAL STATUS ===\n');

    const checks = [
        'hc_accounts', 'hc_market_clusters', 'hc_phone_inventory',
        'hc_number_assignments', 'hc_qr_routes', 'hc_print_orders',
        'hc_event_outbox', 'hc_import_batches', 'hc_source_snapshots',
        'hc_brokers', 'hc_broker_aliases', 'hc_contacts',
        'hc_broker_contacts', 'hc_locations', 'hc_lanes',
        'hc_broker_post_observations', 'hc_data_products_catalog',
        'hc_analytics_snapshots_daily', 'hc_rollup_jobs',
        'hc_monetizable_query_pack',
    ];

    let totalOk = 0;
    for (const t of checks) {
        try {
            const r = await query(
                `SELECT count(*) as cnt FROM information_schema.tables WHERE table_schema='public' AND table_name='${t}';`,
                t
            );
            if (r[0]?.cnt > 0) totalOk++;
        } catch (e) { }
    }
    console.log(`\n  Tables: ${totalOk}/${checks.length} present`);

    // Check views
    const views = ['hc_dashboard_broker_profile_v1', 'hc_dashboard_corridor_demand_v1', 'hc_dashboard_pricing_repost_v1'];
    let viewOk = 0;
    for (const v of views) {
        try {
            const r = await query(
                `SELECT count(*) as cnt FROM information_schema.views WHERE table_schema='public' AND table_name='${v}';`,
                v
            );
            if (r[0]?.cnt > 0) viewOk++;
        } catch (e) { }
    }
    console.log(`  Dashboard views: ${viewOk}/${views.length} present`);

    // Seeds
    try {
        const p = await query(`SELECT product_code, name, price_cents FROM hc_data_products_catalog ORDER BY product_code;`, 'products');
        console.log(`\n  📦 Data products: ${p.length}`);
        for (const r of p) console.log(`     ${r.product_code}: ${r.name} ($${(r.price_cents / 100).toFixed(2)})`);
    } catch (e) { }

    try {
        const j = await query(`SELECT job_code, schedule_cron FROM hc_rollup_jobs ORDER BY job_code;`, 'jobs');
        console.log(`\n  📋 Rollup jobs: ${j.length}`);
        for (const r of j) console.log(`     ${r.job_code} (${r.schedule_cron})`);
    } catch (e) { }

    try {
        const q = await query(`SELECT query_code, title FROM hc_monetizable_query_pack ORDER BY query_code;`, 'queries');
        console.log(`\n  📊 Query packs: ${q.length}`);
        for (const r of q) console.log(`     ${r.query_code}: ${r.title}`);
    } catch (e) { }
}

main().catch(console.error);
