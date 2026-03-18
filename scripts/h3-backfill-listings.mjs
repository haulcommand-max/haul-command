#!/usr/bin/env node
/**
 * H3 Backfill Script — Haul Command (directory_listings)
 *
 * Computes H3 hex cells (resolutions 7 + 8) for all directory_listings
 * that have lat/lng. Writes h3_r7 and h3_r8 columns.
 *
 * Run: node --experimental-modules scripts/h3-backfill-listings.mjs
 *
 * Strategy: Since H3 extension is NOT available in Supabase Cloud,
 * we compute cells in JS using h3-js and write back.
 */

import { createClient } from '@supabase/supabase-js';
import { latLngToCell } from 'h3-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BATCH_SIZE = 500;

async function ensureColumns() {
    console.log('🔷 Ensuring h3_r7 and h3_r8 columns on directory_listings...');

    // Try adding columns via management API (safe: IF NOT EXISTS semantics)
    const https = await import('https');
    const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1];
    const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

    if (PROJECT_REF && ACCESS_TOKEN) {
        const sql = `
            ALTER TABLE IF EXISTS public.directory_listings ADD COLUMN IF NOT EXISTS h3_r7 text;
            ALTER TABLE IF EXISTS public.directory_listings ADD COLUMN IF NOT EXISTS h3_r8 text;
            CREATE INDEX IF NOT EXISTS idx_directory_listings_h3_r7 ON public.directory_listings (h3_r7);
            CREATE INDEX IF NOT EXISTS idx_directory_listings_h3_r8 ON public.directory_listings (h3_r8);
        `;

        try {
            const data = JSON.stringify({ query: sql });
            const result = await new Promise((resolve, reject) => {
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
            console.log('  Column creation:', result.status === 200 || result.status === 201 ? '✅' : `⚠️ status ${result.status}`);
        } catch (err) {
            console.log('  ⚠️ Could not add columns via API — they may already exist');
        }
    } else {
        console.log('  ⚠️ No SUPABASE_ACCESS_TOKEN — assuming columns exist');
    }
}

async function backfill() {
    await ensureColumns();

    console.log('\n🔷 H3 Backfill — directory_listings');
    console.log('  Resolutions: r7 (~5.16 km²) + r8 (~0.74 km²)\n');

    // Count listings with coordinates
    const { count: totalWithCoords } = await supabase
        .from('directory_listings')
        .select('*', { count: 'exact', head: true })
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

    console.log(`  Listings with lat/lng: ${totalWithCoords}`);

    let totalProcessed = 0;
    let totalUpdated = 0;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const { data: listings, error } = await supabase
            .from('directory_listings')
            .select('id, latitude, longitude')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .range(offset, offset + BATCH_SIZE - 1);

        if (error) {
            console.error('  ❌ Fetch error:', error.message);
            break;
        }

        if (!listings || listings.length === 0) {
            hasMore = false;
            break;
        }

        console.log(`  Processing batch: ${listings.length} listings (offset ${offset})...`);

        // Compute H3 cells
        const updates = listings
            .filter(p => p.latitude && p.longitude)
            .map(p => {
                try {
                    return {
                        id: p.id,
                        h3_r7: latLngToCell(p.latitude, p.longitude, 7),
                        h3_r8: latLngToCell(p.latitude, p.longitude, 8),
                    };
                } catch (err) {
                    return null;
                }
            })
            .filter(Boolean);

        // Batch update
        if (updates.length > 0) {
            for (const update of updates) {
                const { error: updateErr } = await supabase
                    .from('directory_listings')
                    .update({ h3_r7: update.h3_r7, h3_r8: update.h3_r8 })
                    .eq('id', update.id);

                if (updateErr) {
                    // Column might not exist yet — skip silently
                    if (totalUpdated === 0) {
                        console.warn(`  ⚠️ First update failed: ${updateErr.message}`);
                        console.warn('  → H3 columns may not exist. Run the ALTER TABLE SQL first.');
                        hasMore = false;
                        break;
                    }
                } else {
                    totalUpdated++;
                }
            }
        }

        totalProcessed += listings.length;
        offset += BATCH_SIZE;

        if (listings.length < BATCH_SIZE) {
            hasMore = false;
        }
    }

    console.log(`\n✅ H3 Backfill Complete`);
    console.log(`   Processed: ${totalProcessed}`);
    console.log(`   Updated:   ${totalUpdated}`);
    console.log(`   Resolutions: r7 (~5.16 km²) + r8 (~0.74 km²)`);

    // Density summary
    if (totalUpdated > 0) {
        const { data: densitySample } = await supabase
            .from('directory_listings')
            .select('h3_r7')
            .not('h3_r7', 'is', null)
            .limit(5000);

        if (densitySample) {
            const cellCounts = {};
            for (const row of densitySample) {
                cellCounts[row.h3_r7] = (cellCounts[row.h3_r7] || 0) + 1;
            }
            const cells = Object.entries(cellCounts).sort((a, b) => b[1] - a[1]);
            console.log(`\n   Unique H3 r7 cells: ${cells.length}`);
            console.log(`   Top 10 densest cells:`);
            for (const [cell, count] of cells.slice(0, 10)) {
                console.log(`     ${cell}: ${count} operators`);
            }
        }
    }
}

backfill().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
