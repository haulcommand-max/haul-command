#!/usr/bin/env node
/**
 * H3 Backfill — Full paginated (all 3,663+ listings)
 * Uses session_replication_role=replica to bypass triggers.
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = 'hvjyfyzotqobfkakjozp';
const ACCESS_TOKEN = 'sbp_c6b18d697dc25e7677e2b3e7b3c545355f95d4aa';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function executeSql(sql) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ query: sql });
        const req = https.request({
            hostname: 'api.supabase.com',
            path: `/v1/projects/${PROJECT_REF}/database/query`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Length': Buffer.byteLength(data),
            },
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function backfill() {
    const h3 = await import('h3-js');
    console.log('🔷 H3 FULL Backfill — all directory_listings with coordinates');

    // Paginated fetch — get ALL listings (not just 1000 default)
    let allListings = [];
    let offset = 0;
    const PAGE = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('directory_listings')
            .select('id, latitude, longitude')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .range(offset, offset + PAGE - 1);

        if (error || !data?.length) {
            hasMore = false;
        } else {
            allListings.push(...data);
            offset += PAGE;
            if (data.length < PAGE) hasMore = false;
        }
    }

    console.log(`  Fetched ${allListings.length} listings total`);

    // Compute H3 cells
    const updates = [];
    for (const row of allListings) {
        try {
            updates.push({
                id: row.id,
                r7: h3.latLngToCell(row.latitude, row.longitude, 7),
                r8: h3.latLngToCell(row.latitude, row.longitude, 8),
            });
        } catch {}
    }
    console.log(`  ${updates.length} H3 cells computed`);

    // Batch SQL updates with replica mode
    const BATCH_SIZE = 200;
    let updated = 0;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batch = updates.slice(i, i + BATCH_SIZE);
        const cases_r7 = batch.map(u => `WHEN '${u.id}'::uuid THEN '${u.r7}'`).join(' ');
        const cases_r8 = batch.map(u => `WHEN '${u.id}'::uuid THEN '${u.r8}'`).join(' ');
        const ids = batch.map(u => `'${u.id}'::uuid`).join(',');

        const sql = `SET session_replication_role = 'replica'; UPDATE public.directory_listings SET h3_r7 = CASE id ${cases_r7} END, h3_r8 = CASE id ${cases_r8} END WHERE id IN (${ids}); SET session_replication_role = 'origin';`;

        const result = await executeSql(sql);
        if (result.status === 200 || result.status === 201) {
            updated += batch.length;
            if ((i / BATCH_SIZE) % 5 === 0) {
                console.log(`  ... ${updated}/${updates.length}`);
            }
        } else {
            console.error(`  ❌ Batch failed:`, result.body.substring(0, 200));
            break;
        }
    }

    console.log(`\n✅ H3 FULL Backfill: ${updated}/${updates.length}`);

    // Density report
    let allH3 = [];
    offset = 0;
    hasMore = true;
    while (hasMore) {
        const { data } = await supabase
            .from('directory_listings')
            .select('h3_r7')
            .not('h3_r7', 'is', null)
            .range(offset, offset + PAGE - 1);
        if (!data?.length) { hasMore = false; } else { allH3.push(...data); offset += PAGE; if (data.length < PAGE) hasMore = false; }
    }

    const cc = {};
    for (const r of allH3) cc[r.h3_r7] = (cc[r.h3_r7] || 0) + 1;
    const cells = Object.entries(cc).sort((a, b) => b[1] - a[1]);
    console.log(`\n   Total operators with H3: ${allH3.length}`);
    console.log(`   Unique H3 r7 cells: ${cells.length}`);
    console.log(`   Top 15 densest:`);
    for (const [c, n] of cells.slice(0, 15)) console.log(`     ${c}: ${n} operators`);
    console.log(`\n   Density classification:`);
    console.log(`     Sparse (1-2):    ${cells.filter(([,n]) => n <= 2).length}`);
    console.log(`     Forming (3-5):   ${cells.filter(([,n]) => n > 2 && n <= 5).length}`);
    console.log(`     Active (6-15):   ${cells.filter(([,n]) => n > 5 && n <= 15).length}`);
    console.log(`     Dense (16-30):   ${cells.filter(([,n]) => n > 15 && n <= 30).length}`);
    console.log(`     Saturated (30+): ${cells.filter(([,n]) => n > 30).length}`);
}

backfill().catch(err => {
    console.error('Fatal:', err);
    executeSql("SET session_replication_role = 'origin';").then(() => process.exit(1));
});
