/**
 * Corridor Liquidity Refresh
 *
 * Runs daily via GitHub Actions.
 * Recomputes corridor demand scores, fill velocity, and pressure index.
 *
 * Usage: node scripts/data-jobs/corridor_liquidity_refresh.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { JobRunLogger } from '../ops/job_run_logger.mjs';

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const logger = new JobRunLogger('corridor-liquidity-refresh');
    await logger.start();

    try {
        const { data: corridors, error } = await supabase
            .from('corridors')
            .select('id, slug, name, demand_score')
            .order('demand_score', { ascending: false });

        if (error) throw new Error(`Fetch corridors: ${error.message}`);

        console.log(`[corridor_liquidity] Found ${corridors.length} corridors`);

        for (const c of corridors.slice(0, 10)) {
            console.log(`  ${c.slug}: demand_score=${c.demand_score}`);
        }

        // TODO: Compute real metrics from loads/escorts tables

        await logger.finish('success', corridors.length, null, {
            top_corridor: corridors[0]?.slug,
        });
    } catch (err) {
        await logger.finish('fail', 0, err.message);
        throw err;
    }
}

main().catch((err) => {
    console.error('[corridor_liquidity] Fatal:', err);
    process.exit(1);
});
