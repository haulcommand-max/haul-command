#!/usr/bin/env node
/**
 * H3 Backfill — Uses session_replication_role=replica to bypass triggers.
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

    console.log('🔷 H3 Backfill — directory_listings (replica mode)');

    // Fetch all listings with coordinates
    const { data: listings } = await supabase
        .from('directory_listings')
        .select('id, latitude, longitude')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

    if (!listings?.length) {
        console.log('  No listings');
        return;
    }

    console.log(`  ${listings.length} listings with coordinates`);

    // Compute H3 cells
    const updates = [];
    for (const row of listings) {
        try {
            updates.push({
                id: row.id,
                r7: h3.latLngToCell(row.latitude, row.longitude, 7),
                r8: h3.latLngToCell(row.latitude, row.longitude, 8),
            });
        } catch {}
    }
    console.log(`  ${updates.length} H3 cells computed`);

    // Batch update via SQL with replica mode to bypass triggers
    const BATCH_SIZE = 200;
    let updated = 0;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batch = updates.slice(i, i + BATCH_SIZE);
        const cases_r7 = batch.map(u => `WHEN '${u.id}'::uuid THEN '${u.r7}'`).join(' ');
        const cases_r8 = batch.map(u => `WHEN '${u.id}'::uuid THEN '${u.r8}'`).join(' ');
        const ids = batch.map(u => `'${u.id}'::uuid`).join(',');

        const sql = `
            SET session_replication_role = 'replica';
            UPDATE public.directory_listings SET
                h3_r7 = CASE id ${cases_r7} END,
                h3_r8 = CASE id ${cases_r8} END
            WHERE id IN (${ids});
            SET session_replication_role = 'origin';
        `;

        const result = await executeSql(sql);
        if (result.status === 200 || result.status === 201) {
            updated += batch.length;
            if ((i / BATCH_SIZE) % 3 === 0) {
                console.log(`  ... ${updated}/${updates.length}`);
            }
        } else {
            console.error(`  ❌ Batch failed:`, result.body.substring(0, 300));
            // Re-enable origin mode
            await executeSql("SET session_replication_role = 'origin';");
            break;
        }
    }

    console.log(`\n✅ H3 Backfill: ${updated}/${updates.length}`);

    // Density summary
    const { data: sample } = await supabase
        .from('directory_listings')
        .select('h3_r7')
        .not('h3_r7', 'is', null)
        .limit(5000);

    if (sample?.length) {
        const cc = {};
        for (const r of sample) cc[r.h3_r7] = (cc[r.h3_r7] || 0) + 1;
        const cells = Object.entries(cc).sort((a, b) => b[1] - a[1]);
        console.log(`\n   H3 r7 cells: ${cells.length} unique`);
        console.log(`   Top 10:`);
        for (const [c, n] of cells.slice(0, 10)) console.log(`     ${c}: ${n} ops`);
        const sparse = cells.filter(([,n]) => n <= 2).length;
        const forming = cells.filter(([,n]) => n > 2 && n <= 5).length;
        const active = cells.filter(([,n]) => n > 5 && n <= 15).length;
        const dense = cells.filter(([,n]) => n > 15 && n <= 30).length;
        const saturated = cells.filter(([,n]) => n > 30).length;
        console.log(`\n   Density:`);
        console.log(`     Sparse (1-2):    ${sparse}`);
        console.log(`     Forming (3-5):   ${forming}`);
        console.log(`     Active (6-15):   ${active}`);
        console.log(`     Dense (16-30):   ${dense}`);
        console.log(`     Saturated (30+): ${saturated}`);
    }
}

backfill().catch(err => {
    console.error('Fatal:', err);
    executeSql("SET session_replication_role = 'origin';").then(() => process.exit(1));
});
