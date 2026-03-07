export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cronGuard, supabaseAdmin, logCronRun, deadLetter } from '../_lib/cron-guard';

const JOB_ID = 'sla-window-aggregator';

/**
 * GET /api/cron/sla-window-aggregator
 *
 * Runs every 5 minutes. Aggregates enterprise_usage_events into
 * SLA tracking windows, computes latency percentiles, detects
 * SLA breaches, and creates incidents automatically.
 */
export async function GET() {
    const guard = await cronGuard();
    if (guard) return guard;

    const startMs = Date.now();
    const sb = supabaseAdmin();

    try {
        const now = new Date();
        const windowStart = new Date(Math.floor((now.getTime() - 300000) / 300000) * 300000);
        const windowEnd = new Date(windowStart.getTime() + 300000);

        // Aggregate usage events by endpoint family for this window
        const { data: events } = await sb
            .from('enterprise_usage_events')
            .select('endpoint_family, response_time_ms, status_code')
            .gte('created_at', windowStart.toISOString())
            .lt('created_at', windowEnd.toISOString());

        if (!events || events.length === 0) {
            await logCronRun(JOB_ID, startMs, 'skipped', { metadata: { reason: 'no_events' } });
            return NextResponse.json({ ok: true, skipped: true });
        }

        // Group by endpoint family
        const families = new Map<string, { latencies: number[]; errors: number }>();
        for (const e of events) {
            const family = (e as any).endpoint_family ?? 'unknown';
            if (!families.has(family)) families.set(family, { latencies: [], errors: 0 });
            const f = families.get(family)!;
            f.latencies.push((e as any).response_time_ms ?? 0);
            if (((e as any).status_code ?? 200) >= 400) f.errors++;
        }

        let windowsCreated = 0;

        for (const [family, d] of families.entries()) {
            const sorted = [...d.latencies].sort((a, b) => a - b);
            const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
            const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
            const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 0;

            await sb.rpc('record_sla_window', {
                p_endpoint_family: family,
                p_window_start: windowStart.toISOString(),
                p_request_count: d.latencies.length,
                p_error_count: d.errors,
                p_p50_ms: Math.round(p50),
                p_p95_ms: Math.round(p95),
                p_p99_ms: Math.round(p99),
            });

            windowsCreated++;
        }

        // Check for geo credibility recomputation (once per hour on minute 0-5)
        if (now.getMinutes() < 5) {
            const regions = ['US-TX', 'US-CA', 'US-FL', 'US-OH', 'US-PA', 'CA-ON', 'CA-AB'];
            for (const region of regions) {
                try { await sb.rpc('compute_geo_credibility', { p_region: region }); } catch { /* ignore */ }
            }
        }

        await logCronRun(JOB_ID, startMs, 'success', {
            rows_affected: windowsCreated,
            metadata: {
                window_start: windowStart.toISOString(),
                total_events: events.length,
                families_tracked: windowsCreated,
            },
        });

        return NextResponse.json({
            ok: true,
            window_start: windowStart.toISOString(),
            events_processed: events.length,
            families_tracked: windowsCreated,
            duration_ms: Date.now() - startMs,
        });

    } catch (err: any) {
        await deadLetter(JOB_ID, {}, err.message);
        await logCronRun(JOB_ID, startMs, 'failed', { error_message: err.message });
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
}
