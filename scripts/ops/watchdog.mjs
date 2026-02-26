/**
 * Job Watchdog — checks ops_job_runs for freshness SLA violations.
 *
 * Schedule: every 6 hours via GitHub Actions.
 * Alerts via Slack when jobs are stale or failing.
 *
 * Usage: node scripts/ops/watchdog.mjs
 *
 * Env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   SLACK_WEBHOOK_URL (optional)
 *   WATCHDOG_ENFORCED=true (exit non-zero on critical violations)
 */

import { createClient } from '@supabase/supabase-js';
import { notify } from './notify.mjs';

const FRESHNESS_SLA = [
    { job: 'corridor-liquidity-refresh', max_age_hours: 30 },
    { job: 'escort-supply-scan', max_age_hours: 30 },
    { job: 'seo-regenerator', max_age_hours: 200 },
    { job: 'port-ingest', max_age_hours: 200 },
];

const ENFORCED = process.env.WATCHDOG_ENFORCED === 'true';

async function main() {
    console.log('[watchdog] Starting freshness check...');
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.warn('[watchdog] Missing Supabase credentials — skipping');
        return;
    }

    const supabase = createClient(url, key);
    const now = Date.now();
    const violations = [];
    const summary = [];

    for (const sla of FRESHNESS_SLA) {
        // Get the most recent run for this job
        const { data: runs, error } = await supabase
            .from('ops_job_runs')
            .select('job_name, status, finished_at, rows_written, duration_ms')
            .eq('job_name', sla.job)
            .order('finished_at', { ascending: false })
            .limit(1);

        if (error) {
            // Try legacy cron_runs table
            const { data: legacyRuns } = await supabase
                .from('cron_runs')
                .select('job_name, status, finished_at, items_processed')
                .eq('job_name', sla.job)
                .order('finished_at', { ascending: false })
                .limit(1);

            if (!legacyRuns?.length) {
                violations.push({ job: sla.job, reason: 'never_run', severity: 'warn' });
                summary.push(`⚠️ ${sla.job}: never run`);
                continue;
            }

            const lastRun = legacyRuns[0];
            const ageHours = (now - new Date(lastRun.finished_at).getTime()) / 3600000;

            if (ageHours > sla.max_age_hours) {
                violations.push({ job: sla.job, reason: 'stale', age_hours: Math.round(ageHours), max: sla.max_age_hours, severity: 'critical' });
                summary.push(`🔴 ${sla.job}: stale (${Math.round(ageHours)}h > ${sla.max_age_hours}h SLA)`);
            } else if (lastRun.status === 'fail') {
                violations.push({ job: sla.job, reason: 'last_run_failed', severity: 'high' });
                summary.push(`🟠 ${sla.job}: last run failed`);
            } else {
                summary.push(`✅ ${sla.job}: fresh (${Math.round(ageHours)}h ago, ${lastRun.items_processed ?? '?'} rows)`);
            }
            continue;
        }

        if (!runs?.length) {
            violations.push({ job: sla.job, reason: 'never_run', severity: 'warn' });
            summary.push(`⚠️ ${sla.job}: never run`);
            continue;
        }

        const lastRun = runs[0];
        const ageHours = (now - new Date(lastRun.finished_at).getTime()) / 3600000;

        if (ageHours > sla.max_age_hours) {
            violations.push({ job: sla.job, reason: 'stale', age_hours: Math.round(ageHours), max: sla.max_age_hours, severity: 'critical' });
            summary.push(`🔴 ${sla.job}: stale (${Math.round(ageHours)}h > ${sla.max_age_hours}h SLA)`);
        } else if (lastRun.status === 'fail') {
            violations.push({ job: sla.job, reason: 'last_run_failed', severity: 'high' });
            summary.push(`🟠 ${sla.job}: last run failed`);
        } else {
            summary.push(`✅ ${sla.job}: fresh (${Math.round(ageHours)}h ago, ${lastRun.rows_written ?? '?'} rows, ${lastRun.duration_ms ?? '?'}ms)`);
        }
    }

    // Print summary
    console.log('\n── Watchdog Report ──');
    summary.forEach(s => console.log(s));

    // Alert on violations
    const criticals = violations.filter(v => v.severity === 'critical');
    if (violations.length > 0) {
        await notify({
            status: criticals.length > 0 ? 'fail' : 'warn',
            title: `Watchdog: ${violations.length} issue(s) detected`,
            details: summary.join('\n'),
            fields: {
                'Critical': String(criticals.length),
                'Total Issues': String(violations.length),
            },
        });
    } else {
        console.log('[watchdog] All jobs healthy ✅');
    }

    // Exit non-zero in enforced mode on critical violations
    if (ENFORCED && criticals.length > 0) {
        console.error(`[watchdog] ENFORCED mode: ${criticals.length} critical violations — exiting 1`);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('[watchdog] Fatal:', err);
    process.exit(1);
});
