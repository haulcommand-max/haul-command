/**
 * Quick diagnostic: check what applied and what didn't
 */
const https = require('https');
const PROJECT_REF = 'hvjyfyzotqobfkakjozp';
const TOKEN = 'sbp_c6b18d697dc25e7677e2b3e7b3c545355f95d4aa';

function query(sql) {
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
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function main() {
    console.log('=== MIGRATION DIAGNOSTIC ===\n');

    // Check critical tables from each migration
    const checks = [
        // From 0001_hc_core.sql
        { table: 'hc_accounts', migration: '0001' },
        { table: 'hc_market_clusters', migration: '0001' },
        { table: 'hc_phone_inventory', migration: '0001' },
        { table: 'hc_number_assignments', migration: '0001' },
        { table: 'hc_qr_routes', migration: '0001' },
        { table: 'hc_print_orders', migration: '0001' },
        { table: 'hc_event_outbox', migration: '0001' },
        // From 0002_broker_intelligence.sql
        { table: 'hc_import_batches', migration: '0002' },
        { table: 'hc_source_snapshots', migration: '0002' },
        { table: 'hc_brokers', migration: '0002' },
        { table: 'hc_broker_aliases', migration: '0002' },
        { table: 'hc_contacts', migration: '0002' },
        { table: 'hc_broker_contacts', migration: '0002' },
        { table: 'hc_locations', migration: '0002' },
        { table: 'hc_lanes', migration: '0002' },
        { table: 'hc_broker_post_observations', migration: '0002' },
        { table: 'hc_data_products_catalog', migration: '0002' },
        { table: 'hc_analytics_snapshots_daily', migration: '0002' },
        // From 0003_seed_intelligence_baseline.sql
        { table: 'hc_rollup_jobs', migration: '0003' },
        { table: 'hc_monetizable_query_pack', migration: '0003' },
    ];

    for (const check of checks) {
        try {
            const result = await query(
                `SELECT count(*) as cnt FROM information_schema.tables WHERE table_schema='public' AND table_name='${check.table}';`
            );
            const exists = result[0]?.cnt > 0;
            console.log(`  ${exists ? '✅' : '❌'} ${check.table} (${check.migration}) ${exists ? 'EXISTS' : 'MISSING'}`);
        } catch (e) {
            console.log(`  ⚠️  ${check.table} (${check.migration}) CHECK FAILED: ${e.message.substring(0, 100)}`);
        }
    }

    // Check mat views
    console.log('\n--- Materialized Views ---');
    const mvNames = [
        'hc_mv_broker_activity_7d', 'hc_mv_broker_activity_30d',
        'hc_mv_corridor_activity_7d', 'hc_mv_corridor_activity_30d',
        'hc_mv_pricing_by_lane_service_30d', 'hc_mv_repost_clusters',
        'hc_mv_broker_expansion_events'
    ];
    for (const mv of mvNames) {
        try {
            const result = await query(
                `SELECT count(*) as cnt FROM pg_matviews WHERE schemaname='public' AND matviewname='${mv}';`
            );
            const exists = result[0]?.cnt > 0;
            console.log(`  ${exists ? '✅' : '❌'} ${mv} ${exists ? 'EXISTS' : 'MISSING'}`);
        } catch (e) {
            console.log(`  ⚠️  ${mv} CHECK FAILED`);
        }
    }

    // Check dashboard views from 0003
    console.log('\n--- Dashboard Views (0003) ---');
    const viewNames = [
        'hc_dashboard_broker_profile_v1',
        'hc_dashboard_corridor_demand_v1',
        'hc_dashboard_pricing_repost_v1'
    ];
    for (const v of viewNames) {
        try {
            const result = await query(
                `SELECT count(*) as cnt FROM information_schema.views WHERE table_schema='public' AND table_name='${v}';`
            );
            const exists = result[0]?.cnt > 0;
            console.log(`  ${exists ? '✅' : '❌'} ${v} ${exists ? 'EXISTS' : 'MISSING'}`);
        } catch (e) {
            console.log(`  ⚠️  ${v} CHECK FAILED`);
        }
    }

    // Check key functions
    console.log('\n--- Key Functions ---');
    const funcs = [
        'hc_observation_fingerprint', 'hc_make_lane_key', 'hc_normalize_phone',
        'hc_refresh_intelligence_rollups', 'hc_block_observation_mutation',
        'hc_build_market_snapshot', 'hc_execute_rollup_job'
    ];
    for (const fn of funcs) {
        try {
            const result = await query(
                `SELECT count(*) as cnt FROM information_schema.routines WHERE routine_schema='public' AND routine_name='${fn}';`
            );
            const exists = result[0]?.cnt > 0;
            console.log(`  ${exists ? '✅' : '❌'} ${fn}() ${exists ? 'EXISTS' : 'MISSING'}`);
        } catch (e) {
            console.log(`  ⚠️  ${fn} CHECK FAILED`);
        }
    }

    // Check seed data
    console.log('\n--- Seed Data ---');
    try {
        const products = await query(`SELECT count(*) as cnt FROM hc_data_products_catalog;`);
        console.log(`  📦 Data products: ${products[0]?.cnt}`);
    } catch (e) {
        console.log(`  ❌ hc_data_products_catalog not queryable: ${e.message.substring(0, 100)}`);
    }
}

main().catch(console.error);
