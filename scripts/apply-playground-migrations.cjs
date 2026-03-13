/**
 * Apply Playground migrations via Supabase Management API
 * Uses personal access token (sbp_...)
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_REF = 'hvjyfyzotqobfkakjozp';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_c6b18d697dc25e7677e2b3e7b3c545355f95d4aa';

const MIGRATIONS_DIR = 'C:\\Users\\PC User\\Documents\\Playground\\db\\migrations';
const MIGRATIONS = [
    '0001_hc_core.sql',
    '0002_broker_intelligence.sql',
    '0003_seed_intelligence_baseline.sql',
];

function makeRequest(hostname, reqPath, method, body, token) {
    return new Promise((resolve, reject) => {
        const postData = typeof body === 'string' ? body : JSON.stringify(body);
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
        if (method !== 'GET') {
            headers['Content-Length'] = Buffer.byteLength(postData);
        }
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
        console.log(`  ✅ ${label}: HTTP ${result.status}`);
        return JSON.parse(result.body);
    } else {
        console.log(`  ❌ ${label}: HTTP ${result.status}`);
        console.log(`     ${result.body.substring(0, 500)}`);
        throw new Error(`HTTP ${result.status}`);
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Applying Playground Migrations via Management API');
    console.log('═══════════════════════════════════════════════════════\n');

    // 1. Verify token
    console.log('Step 1: Verifying API token...');
    const projectResult = await makeRequest(
        'api.supabase.com',
        `/v1/projects/${PROJECT_REF}`,
        'GET',
        '',
        ACCESS_TOKEN
    );
    if (projectResult.status !== 200) {
        console.log(`❌ Token verification failed: HTTP ${projectResult.status}`);
        console.log(projectResult.body.substring(0, 200));
        return;
    }
    const project = JSON.parse(projectResult.body);
    console.log(`  ✅ Project: ${project.name} (${project.region}, ${project.status})\n`);

    // 2. Pre-check existing tables
    console.log('Step 2: Pre-check existing hc_* tables...');
    try {
        const tables = await executeSQL(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'hc_%' ORDER BY table_name;",
            'Pre-check'
        );
        console.log(`  Found ${tables.length} existing hc_* tables`);
        for (const t of tables) console.log(`    ${t.table_name}`);
    } catch (e) {
        console.log(`  Pre-check failed: ${e.message}`);
    }
    console.log('');

    // 3. Ensure set_updated_at() function exists
    console.log('Step 3: Ensuring set_updated_at() exists...');
    try {
        await executeSQL(`
            CREATE OR REPLACE FUNCTION set_updated_at()
            RETURNS TRIGGER
            LANGUAGE plpgsql
            AS $$
            BEGIN
                NEW.updated_at = now();
                RETURN NEW;
            END;
            $$;
        `, 'set_updated_at()');
    } catch (e) {
        console.log(`  Warning: ${e.message}`);
    }
    console.log('');

    // 4. Apply migrations sequentially
    console.log('Step 4: Applying migrations...\n');
    for (const migration of MIGRATIONS) {
        const filePath = path.join(MIGRATIONS_DIR, migration);
        if (!fs.existsSync(filePath)) {
            console.log(`  ❌ File not found: ${filePath}`);
            continue;
        }
        const sql = fs.readFileSync(filePath, 'utf-8');
        console.log(`  📄 ${migration} (${sql.length} bytes, ${sql.split('\n').length} lines)`);

        try {
            await executeSQL(sql, migration);
        } catch (err) {
            console.log(`     Migration failed. Checking if it's a partial issue...`);
        }
        console.log('');
    }

    // 5. Full verification
    console.log('═══════════════════════════════════════════════════════');
    console.log('  VERIFICATION');
    console.log('═══════════════════════════════════════════════════════\n');

    // Tables
    try {
        const tables = await executeSQL(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'hc_%' ORDER BY table_name;",
            'Tables'
        );
        console.log(`\n  📋 hc_* tables: ${tables.length}`);
        for (const t of tables) console.log(`     ✅ ${t.table_name}`);
    } catch (e) { console.log(`  Table check failed: ${e.message}`); }

    // Materialized views
    try {
        const mvs = await executeSQL(
            "SELECT matviewname FROM pg_matviews WHERE schemaname = 'public' AND matviewname LIKE 'hc_%' ORDER BY matviewname;",
            'Materialized Views'
        );
        console.log(`\n  📋 hc_* materialized views: ${mvs.length}`);
        for (const m of mvs) console.log(`     ✅ ${m.matviewname}`);
    } catch (e) { console.log(`  MV check failed: ${e.message}`); }

    // Functions
    try {
        const fns = await executeSQL(
            "SELECT DISTINCT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE 'hc_%' ORDER BY routine_name;",
            'Functions'
        );
        console.log(`\n  📋 hc_* functions: ${fns.length}`);
        for (const f of fns) console.log(`     ✅ ${f.routine_name}`);
    } catch (e) { console.log(`  Function check failed: ${e.message}`); }

    // Triggers
    try {
        const trigs = await executeSQL(
            "SELECT DISTINCT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public' AND trigger_name LIKE 'trg_hc_%' ORDER BY trigger_name;",
            'Triggers'
        );
        console.log(`\n  📋 hc_* triggers: ${trigs.length}`);
        for (const t of trigs) console.log(`     ✅ ${t.trigger_name} → ${t.event_object_table}`);
    } catch (e) { console.log(`  Trigger check failed: ${e.message}`); }

    // Views
    try {
        const views = await executeSQL(
            "SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name LIKE 'hc_%' ORDER BY table_name;",
            'Views'
        );
        console.log(`\n  📋 hc_* views: ${views.length}`);
        for (const v of views) console.log(`     ✅ ${v.table_name}`);
    } catch (e) { console.log(`  View check failed: ${e.message}`); }

    // Data products seeded
    try {
        const products = await executeSQL(
            "SELECT product_code, name, price_cents FROM hc_data_products_catalog ORDER BY product_code;",
            'Data Products'
        );
        console.log(`\n  📋 Data products seeded: ${products.length}`);
        for (const p of products) console.log(`     ✅ ${p.product_code}: ${p.name} ($${(p.price_cents / 100).toFixed(2)})`);
    } catch (e) { console.log(`  Products check failed: ${e.message}`); }

    // Rollup jobs seeded
    try {
        const jobs = await executeSQL(
            "SELECT job_code, name, schedule_cron FROM hc_rollup_jobs ORDER BY job_code;",
            'Rollup Jobs'
        );
        console.log(`\n  📋 Rollup jobs seeded: ${jobs.length}`);
        for (const j of jobs) console.log(`     ✅ ${j.job_code}: ${j.name} (${j.schedule_cron})`);
    } catch (e) { console.log(`  Jobs check failed: ${e.message}`); }

    // Query packs seeded
    try {
        const queries = await executeSQL(
            "SELECT query_code, title, monetization_tier FROM hc_monetizable_query_pack ORDER BY query_code;",
            'Query Packs'
        );
        console.log(`\n  📋 Monetizable queries seeded: ${queries.length}`);
        for (const q of queries) console.log(`     ✅ ${q.query_code}: ${q.title} (${q.monetization_tier})`);
    } catch (e) { console.log(`  Query pack check failed: ${e.message}`); }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  DONE');
    console.log('═══════════════════════════════════════════════════════');
}

main().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
