import { NextResponse } from 'next/server';
import { cronGuard, supabaseAdmin, logCronRun, deadLetter } from '../_lib/cron-guard';

// ── control_tower_scan_v1 ────────────────────────────────────────────────
// Runs every 30 min — merges escort supply + broker intent + scarcity
// to produce forward-looking CT alerts for the admin dashboard.

const SCARCITY_CRITICAL = 80;
const SCARCITY_WARNING = 55;

export async function GET() {
    const guard = await cronGuard();
    if (guard) return guard;

    const startMs = Date.now();
    const sb = supabaseAdmin();

    try {
        const { data: flag } = await sb.from('feature_flags').select('enabled').eq('name', 'control_tower_enabled').maybeSingle();
        if (!flag?.enabled) {
            await logCronRun('control_tower_scan_v1', startMs, 'skipped', { metadata: { reason: 'flag_off' } });
            return NextResponse.json({ ok: true, skipped: true });
        }

        // Read current scarcity index
        const { data: scarcityRows } = await sb
            .from('corridor_scarcity_index')
            .select('corridor_slug, scarcity_index, supply_available, computed_at')
            .order('scarcity_index', { ascending: false });

        let alertsInserted = 0;

        for (const row of (scarcityRows ?? [])) {
            if (row.scarcity_index >= SCARCITY_CRITICAL) {
                const { data: existing } = await sb
                    .from('ct_alerts')
                    .select('id')
                    .eq('alert_type', 'scarcity_critical')
                    .eq('geo_key', row.corridor_slug)
                    .gte('created_at', new Date(Date.now() - 60 * 60_000).toISOString()) // dedupe within 1h
                    .maybeSingle();

                if (!existing) {
                    await sb.from('ct_alerts').insert({
                        alert_type: 'scarcity_critical',
                        severity: 'critical',
                        corridor_slug: row.corridor_slug,
                        geo_key: row.corridor_slug,
                        message: `Critical shortage on ${row.corridor_slug} — scarcity index ${Math.round(row.scarcity_index)}/100`,
                        details: { scarcity_index: row.scarcity_index, supply_available: row.supply_available },
                    });
                    alertsInserted++;
                }
            } else if (row.scarcity_index >= SCARCITY_WARNING) {
                const { data: existing } = await sb
                    .from('ct_alerts')
                    .select('id')
                    .eq('alert_type', 'scarcity_warning')
                    .eq('geo_key', row.corridor_slug)
                    .gte('created_at', new Date(Date.now() - 2 * 60 * 60_000).toISOString()) // dedupe within 2h
                    .maybeSingle();

                if (!existing) {
                    await sb.from('ct_alerts').insert({
                        alert_type: 'scarcity_warning',
                        severity: 'warning',
                        corridor_slug: row.corridor_slug,
                        geo_key: row.corridor_slug,
                        message: `Tightening supply on ${row.corridor_slug} — scarcity index ${Math.round(row.scarcity_index)}/100`,
                        details: { scarcity_index: row.scarcity_index },
                    });
                    alertsInserted++;
                }
            }
        }

        await logCronRun('control_tower_scan_v1', startMs, 'success', {
            rows_affected: alertsInserted,
            metadata: { corridors_evaluated: scarcityRows?.length ?? 0, alerts_inserted: alertsInserted },
        });

        return NextResponse.json({ ok: true, corridors: scarcityRows?.length ?? 0, alerts_inserted: alertsInserted });

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await deadLetter('control_tower_scan_v1', {}, msg);
        await logCronRun('control_tower_scan_v1', startMs, 'failed', { error_message: msg });
        return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
}
