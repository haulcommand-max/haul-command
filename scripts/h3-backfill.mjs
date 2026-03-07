#!/usr/bin/env node
/**
 * H3 Backfill Script — Haul Command
 *
 * Computes H3 hex cells (resolution 7) for all driver_profiles
 * that have lat/lng but are missing h3_cell_r7.
 *
 * Run: node scripts/h3-backfill.mjs
 *
 * Strategy: Since H3 extension is NOT available in Supabase Cloud,
 * we compute cells in JS using h3-js and write the bigint back.
 * The btree index on h3_cell_r7 gives us sub-10ms lookups.
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

const H3_RESOLUTION = 7; // metro-ish tile (~5.16 km² cells)
const BATCH_SIZE = 500;

/**
 * Convert H3 hex string to BigInt for storage
 * H3 indexes are 64-bit integers, stored as hex strings by h3-js
 */
function h3ToBigInt(h3Index) {
    return BigInt('0x' + h3Index);
}

async function backfill() {
    console.log('🔷 H3 Backfill — Resolution', H3_RESOLUTION);
    console.log('  Fetching driver_profiles with lat/lng but no h3_cell_r7...\n');

    let totalProcessed = 0;
    let totalUpdated = 0;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        // Fetch batch of profiles needing backfill
        const { data: profiles, error } = await supabase
            .from('driver_profiles')
            .select('user_id, base_lat, base_lng')
            .not('base_lat', 'is', null)
            .not('base_lng', 'is', null)
            .is('h3_cell_r7', null)
            .range(offset, offset + BATCH_SIZE - 1);

        if (error) {
            console.error('  ❌ Fetch error:', error.message);
            break;
        }

        if (!profiles || profiles.length === 0) {
            hasMore = false;
            break;
        }

        console.log(`  Processing batch: ${profiles.length} profiles (offset ${offset})...`);

        // Compute H3 cells
        const updates = profiles
            .filter(p => p.base_lat && p.base_lng)
            .map(p => {
                try {
                    const h3Index = latLngToCell(p.base_lat, p.base_lng, H3_RESOLUTION);
                    const h3BigInt = h3ToBigInt(h3Index);
                    return {
                        user_id: p.user_id,
                        h3_cell_r7: h3BigInt.toString(), // Supabase accepts bigint as string
                    };
                } catch (err) {
                    console.warn(`  ⚠️  Skipping ${p.user_id}: ${err.message}`);
                    return null;
                }
            })
            .filter(Boolean);

        // Batch upsert
        if (updates.length > 0) {
            for (const update of updates) {
                const { error: updateErr } = await supabase
                    .from('driver_profiles')
                    .update({ h3_cell_r7: update.h3_cell_r7 })
                    .eq('user_id', update.user_id);

                if (updateErr) {
                    console.warn(`  ⚠️  Update failed for ${update.user_id}: ${updateErr.message}`);
                } else {
                    totalUpdated++;
                }
            }
        }

        totalProcessed += profiles.length;
        offset += BATCH_SIZE;

        // If we got fewer than batch size, we're done
        if (profiles.length < BATCH_SIZE) {
            hasMore = false;
        }
    }

    console.log(`\n✅ H3 Backfill Complete`);
    console.log(`   Processed: ${totalProcessed}`);
    console.log(`   Updated:   ${totalUpdated}`);
    console.log(`   Resolution: ${H3_RESOLUTION} (~5.16 km² per cell)`);

    // Quick verification
    const { count } = await supabase
        .from('driver_profiles')
        .select('*', { count: 'exact', head: true })
        .not('h3_cell_r7', 'is', null);

    console.log(`   Total with H3 cells: ${count || 0}`);
}

backfill().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
