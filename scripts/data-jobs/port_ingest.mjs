/**
 * Port Data Ingest
 *
 * Runs weekly (Wednesday) via GitHub Actions.
 * Validates ports, checks staleness, updates demand scores.
 *
 * Usage: node scripts/data-jobs/port_ingest.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { JobRunLogger } from '../ops/job_run_logger.mjs';

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const logger = new JobRunLogger('port-ingest');
    await logger.start();

    try {
        const { data: ports, error } = await supabase
            .from('ports')
            .select('id, name, slug, last_verified_at, demand_score, port_type')
            .eq('is_active', true)
            .order('demand_score', { ascending: false });

        if (error) throw new Error(`Fetch ports: ${error.message}`);

        console.log(`[port_ingest] ${ports.length} active ports`);

        const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
        const stale = ports.filter(p => !p.last_verified_at || p.last_verified_at < ninetyDaysAgo);
        console.log(`[port_ingest] ${stale.length} ports need re-verification`);

        const byType = {};
        for (const p of ports) {
            byType[p.port_type] = (byType[p.port_type] || 0) + 1;
        }
        for (const [type, count] of Object.entries(byType)) {
            console.log(`  ${type}: ${count}`);
        }

        // TODO: Pull external data sources

        await logger.finish('success', ports.length, null, {
            stale_count: stale.length,
            by_type: byType,
        });
    } catch (err) {
        await logger.finish('fail', 0, err.message);
        throw err;
    }
}

main().catch((err) => {
    console.error('[port_ingest] Fatal:', err);
    process.exit(1);
});
