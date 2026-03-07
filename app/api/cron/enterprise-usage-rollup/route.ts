export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cronGuard, supabaseAdmin, logCronRun, deadLetter } from '../_lib/cron-guard';

const JOB_ID = 'enterprise-usage-rollup';

/**
 * GET /api/cron/enterprise-usage-rollup
 *
 * Daily cron job that:
 *   1. Aggregates enterprise_usage_events into enterprise_usage_rollups
 *   2. Checks quota thresholds and emits quota events
 *   3. Resets monthly counters on the 1st of each month
 *
 * Schedule: daily at 00:15 UTC (after midnight boundary)
 */
export async function GET() {
    const startMs = Date.now();

    // Auth gate
    const guard = await cronGuard();
    if (guard) return guard;

    const sb = supabaseAdmin();

    try {
        // 1. Run daily rollup for yesterday
        const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
        const { data: rollupCount, error: rollupErr } = await sb.rpc('rollup_enterprise_usage', {
            p_date: yesterday,
        });

        if (rollupErr) {
            await deadLetter(JOB_ID, { date: yesterday }, rollupErr.message);
            await logCronRun(JOB_ID, startMs, 'failed', { error_message: rollupErr.message });
            return NextResponse.json({ error: rollupErr.message }, { status: 500 });
        }

        // 2. Check if it's the 1st of the month → reset monthly counters
        let resetCount = 0;
        const today = new Date();
        if (today.getUTCDate() === 1) {
            const { data: rc } = await sb.rpc('reset_monthly_enterprise_counters');
            resetCount = rc ?? 0;
        }

        // 3. Identify customers approaching quota
        const { data: activeKeys } = await sb
            .from('enterprise_api_keys')
            .select('customer_id')
            .eq('active', true);

        const uniqueCustomers = [...new Set((activeKeys ?? []).map((k: any) => k.customer_id))];
        let quotaWarnings = 0;

        for (const cid of uniqueCustomers) {
            const { data: quota } = await sb.rpc('check_enterprise_quota', {
                p_customer_id: cid,
            });
            if (quota && ['warning', 'critical', 'exceeded'].includes((quota as any).status)) {
                quotaWarnings++;
            }
        }

        await logCronRun(JOB_ID, startMs, 'success', {
            rows_affected: rollupCount ?? 0,
            metadata: {
                rollup_date: yesterday,
                customers_rolled_up: rollupCount,
                monthly_reset: resetCount > 0,
                monthly_reset_count: resetCount,
                quota_warnings: quotaWarnings,
            },
        });

        return NextResponse.json({
            success: true,
            rollup_date: yesterday,
            customers_rolled_up: rollupCount,
            monthly_reset: resetCount > 0 ? resetCount : undefined,
            quota_warnings: quotaWarnings,
            duration_ms: Date.now() - startMs,
        });

    } catch (err: any) {
        await deadLetter(JOB_ID, {}, err.message);
        await logCronRun(JOB_ID, startMs, 'failed', { error_message: err.message });
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
