/**
 * Fix: Apply missing parts of 0001 and all of 0003
 * Strip begin/commit wrappers which the Management API doesn't support
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_REF = 'hvjyfyzotqobfkakjozp';
const TOKEN = 'sbp_c6b18d697dc25e7677e2b3e7b3c545355f95d4aa';
const MIGRATIONS_DIR = 'C:\\Users\\PC User\\Documents\\Playground\\db\\migrations';

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
                    console.log(`  ✅ ${label}: HTTP ${res.statusCode}`);
                    resolve(JSON.parse(data));
                } else {
                    console.log(`  ❌ ${label}: HTTP ${res.statusCode}`);
                    const msg = data.substring(0, 500);
                    console.log(`     ${msg}`);
                    reject(new Error(`HTTP ${res.statusCode}: ${msg}`));
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function stripTransactionWrapper(sql) {
    return sql
        .replace(/^\s*begin\s*;\s*\n/im, '')
        .replace(/\n\s*commit\s*;\s*$/im, '');
}

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Fixing Missing Migrations');
    console.log('═══════════════════════════════════════════════════════\n');

    // Re-apply 0001 without begin/commit
    console.log('--- Re-applying 0001_hc_core.sql (no transaction wrapper) ---\n');
    const sql0001 = stripTransactionWrapper(
        fs.readFileSync(path.join(MIGRATIONS_DIR, '0001_hc_core.sql'), 'utf-8')
    );
    try {
        await query(sql0001, '0001_hc_core.sql');
    } catch (e) {
        console.log(`  0001 failed as single block. Trying statement-by-statement...\n`);

        // Split into individual statements
        // Need to handle DO $$ blocks and CREATE FUNCTION blocks carefully
        const statements = splitSQLStatements(sql0001);
        console.log(`  Split into ${statements.length} statements\n`);

        let success = 0, fail = 0, skip = 0;
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i].trim();
            if (stmt.length < 5) { skip++; continue; }

            try {
                await query(stmt, `0001[${i + 1}/${statements.length}]`);
                success++;
            } catch (e) {
                fail++;
                // Continue — CREATE IF NOT EXISTS means some will fail benignly
            }
        }
        console.log(`\n  0001 result: ${success} success, ${fail} failed, ${skip} skipped\n`);
    }

    // Apply 0003 without begin/commit
    console.log('\n--- Applying 0003_seed_intelligence_baseline.sql ---\n');
    const sql0003 = stripTransactionWrapper(
        fs.readFileSync(path.join(MIGRATIONS_DIR, '0003_seed_intelligence_baseline.sql'), 'utf-8')
    );
    try {
        await query(sql0003, '0003_seed_intelligence_baseline.sql');
    } catch (e) {
        console.log(`  0003 failed as single block. Trying statement-by-statement...\n`);

        const statements = splitSQLStatements(sql0003);
        console.log(`  Split into ${statements.length} statements\n`);

        let success = 0, fail = 0, skip = 0;
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i].trim();
            if (stmt.length < 5) { skip++; continue; }

            try {
                await query(stmt, `0003[${i + 1}/${statements.length}]`);
                success++;
            } catch (e) {
                fail++;
            }
        }
        console.log(`\n  0003 result: ${success} success, ${fail} failed, ${skip} skipped\n`);
    }

    // Final verification
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  FINAL VERIFICATION');
    console.log('═══════════════════════════════════════════════════════\n');

    const criticalChecks = [
        'hc_accounts', 'hc_market_clusters', 'hc_phone_inventory',
        'hc_number_assignments', 'hc_qr_routes', 'hc_print_orders',
        'hc_rollup_jobs', 'hc_monetizable_query_pack',
    ];
    for (const t of criticalChecks) {
        try {
            const r = await query(
                `SELECT count(*) as cnt FROM information_schema.tables WHERE table_schema='public' AND table_name='${t}';`,
                t
            );
            console.log(`     ${r[0]?.cnt > 0 ? '✅' : '❌'} ${t}`);
        } catch (e) { console.log(`     ⚠️ ${t}`); }
    }

    // Check seed data
    try {
        const p = await query(`SELECT count(*) as cnt FROM hc_data_products_catalog;`, 'products');
        console.log(`\n  📦 Data products: ${p[0]?.cnt}`);
    } catch (e) { }

    try {
        const j = await query(`SELECT count(*) as cnt FROM hc_rollup_jobs;`, 'jobs');
        console.log(`  📋 Rollup jobs: ${j[0]?.cnt}`);
    } catch (e) { }

    try {
        const q = await query(`SELECT count(*) as cnt FROM hc_monetizable_query_pack;`, 'queries');
        console.log(`  📊 Query packs: ${q[0]?.cnt}`);
    } catch (e) { }
}

/**
 * Smart SQL statement splitter that handles:
 * - DO $$ ... $$; blocks
 * - CREATE FUNCTION ... $$ ... $$; blocks
 * - Regular semicolon-terminated statements
 */
function splitSQLStatements(sql) {
    const statements = [];
    let current = '';
    let inDollarBlock = false;
    const lines = sql.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();

        // Detect start of $$ block
        if (!inDollarBlock && (trimmed.includes('$$') && !trimmed.endsWith('$$;'))) {
            inDollarBlock = true;
            current += line + '\n';
            continue;
        }

        // Detect end of $$ block  
        if (inDollarBlock && trimmed.endsWith('$$;')) {
            inDollarBlock = false;
            current += line + '\n';
            statements.push(current.trim());
            current = '';
            continue;
        }

        if (inDollarBlock) {
            current += line + '\n';
            continue;
        }

        // Regular statement ending with ;
        current += line + '\n';
        if (trimmed.endsWith(';') && !trimmed.startsWith('--')) {
            statements.push(current.trim());
            current = '';
        }
    }

    if (current.trim().length > 3) {
        statements.push(current.trim());
    }

    return statements.filter(s => s.length > 3);
}

main().catch(console.error);
