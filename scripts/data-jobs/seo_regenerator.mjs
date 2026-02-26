/**
 * SEO Page Regenerator
 *
 * Runs weekly (Monday) via GitHub Actions.
 * Checks freshness, re-queues stale pages.
 *
 * Usage: node scripts/data-jobs/seo_regenerator.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { JobRunLogger } from '../ops/job_run_logger.mjs';

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const logger = new JobRunLogger('seo-regenerator');
    await logger.start();

    try {
        const { data: pages, error } = await supabase
            .from('seo_pages')
            .select('type, status, updated_at')
            .order('updated_at', { ascending: true });

        if (error) throw new Error(`Fetch pages: ${error.message}`);

        const summary = {};
        for (const p of pages || []) {
            const key = `${p.type}:${p.status}`;
            summary[key] = (summary[key] || 0) + 1;
        }

        console.log(`[seo_regen] ${(pages || []).length} total SEO pages`);
        for (const [key, count] of Object.entries(summary)) {
            console.log(`  ${key}: ${count}`);
        }

        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
        const stale = (pages || []).filter(p => p.updated_at < thirtyDaysAgo);
        console.log(`[seo_regen] ${stale.length} stale pages (>30d old)`);

        // TODO: Re-enqueue stale pages

        await logger.finish('success', (pages || []).length, null, {
            stale_count: stale.length,
            summary,
        });
    } catch (err) {
        await logger.finish('fail', 0, err.message);
        throw err;
    }
}

main().catch((err) => {
    console.error('[seo_regen] Fatal:', err);
    process.exit(1);
});
