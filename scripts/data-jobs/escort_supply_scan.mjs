/**
 * Escort Supply Scan
 *
 * Runs daily via GitHub Actions.
 * Recomputes regional supply density, identifies shortage zones.
 *
 * Usage: node scripts/data-jobs/escort_supply_scan.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { JobRunLogger } from '../ops/job_run_logger.mjs';

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const logger = new JobRunLogger('escort-supply-scan');
    await logger.start();

    try {
        const { data: operators, error } = await supabase
            .from('directory_drivers')
            .select('state')
            .not('state', 'is', null);

        if (error) throw new Error(`Fetch operators: ${error.message}`);

        const byState = {};
        for (const op of operators) {
            byState[op.state] = (byState[op.state] || 0) + 1;
        }

        const states = Object.entries(byState).sort(([, a], [, b]) => b - a);

        console.log(`[escort_supply] ${operators.length} operators across ${states.length} states`);
        for (const [state, count] of states.slice(0, 10)) {
            console.log(`  ${state}: ${count} operators`);
        }

        // TODO: Compute shortage zones, density metrics

        await logger.finish('success', operators.length, null, {
            state_count: states.length,
            top_state: states[0]?.[0],
        });
    } catch (err) {
        await logger.finish('fail', 0, err.message);
        throw err;
    }
}

main().catch((err) => {
    console.error('[escort_supply] Fatal:', err);
    process.exit(1);
});
