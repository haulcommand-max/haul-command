import { NextResponse } from 'next/server';
import { cronGuard, supabaseAdmin, logCronRun, deadLetter } from '../_lib/cron-guard';

// ── match_health_monitor_v1 ───────────────────────────────────────────────
// Runs every 10 min. Detects stale/failing match requests and emits alerts.

const RESPONSE_TIMEOUT_MINUTES = 45; // emit match_at_risk after 45 min no response
const DECLINE_SPIKE_THRESHOLD = 0.6; // >60% decline rate in last hour = liquidity warning

export async function GET() {
    const guard = await cronGuard();
    if (guard) return guard;

    const startMs = Date.now();
    const sb = supabaseAdmin();

    try {
        const { data: flag } = await sb.from('feature_flags').select('enabled').eq('name', 'dispatch_brain_enabled').maybeSingle();
        if (!flag?.enabled) {
            await logCronRun('match_health_monitor_v1', startMs, 'skipped', { metadata: { reason: 'flag_off' } });
            return NextResponse.json({ ok: true, skipped: true });
        }

        const thresholdTime = new Date(Date.now() - RESPONSE_TIMEOUT_MINUTES * 60_000).toISOString();

        // Find stale dispatched match requests
        const { data: staleMatches } = await sb
            .from('match_requests')
            .select('id, created_at, candidate_count')
            .eq('status', 'scored')
            .lte('created_at', thresholdTime)
            .limit(50);

        // Check decline rate in last 1 hour
        const { data: recentOutcomes } = await sb
            .from('match_outcomes')
            .select('outcome')
            .gte('created_at', new Date(Date.now() - 3600_000).toISOString());

        const declines = (recentOutcomes ?? []).filter(o => o.outcome === 'declined').length;
        const total = (recentOutcomes ?? []).length;
        const declineRate = total > 5 ? declines / total : 0;

        const alerts: string[] = [];

        if ((staleMatches ?? []).length > 0) {
            alerts.push('match_at_risk');
            // Write ct_alert
            await sb.from('ct_alerts').insert({
                alert_type: 'match_at_risk',
                severity: 'warning',
                message: `${staleMatches!.length} match request(s) have no response after ${RESPONSE_TIMEOUT_MINUTES} min`,
                details: { match_ids: staleMatches!.map(m => m.id) },
            });
        }

        if (declineRate > DECLINE_SPIKE_THRESHOLD) {
            alerts.push('liquidity_warning');
            await sb.from('ct_alerts').insert({
                alert_type: 'liquidity_warning',
                severity: 'critical',
                message: `Escort decline rate spike: ${Math.round(declineRate * 100)}% in last 60 min`,
                details: { decline_rate: declineRate, sample_size: total },
            });
        }

        await logCronRun('match_health_monitor_v1', startMs, 'success', {
            rows_affected: alerts.length,
            metadata: { stale_matches: staleMatches?.length ?? 0, decline_rate: declineRate, alerts },
        });

        return NextResponse.json({ ok: true, alerts, stale_count: staleMatches?.length ?? 0, decline_rate: declineRate });

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await deadLetter('match_health_monitor_v1', {}, msg);
        await logCronRun('match_health_monitor_v1', startMs, 'failed', { error_message: msg });
        return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
}
