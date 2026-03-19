import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { cronGuard, supabaseAdmin, logCronRun, deadLetter } from '../_lib/cron-guard';

// ── control_tower_scan_v2 ────────────────────────────────────────────────
// Runs every 30 min — merges demand signals + supply snapshot
// to produce forward-looking CT alerts for the admin dashboard.
//
// UPGRADED from v1: corridor_scarcity_index → corridor_demand_signals + corridor_supply_snapshot (live)

const PRESSURE_CRITICAL = 0.7;
const PRESSURE_WARNING = 0.4;

export async function GET() {
    const guard = await cronGuard();
    if (guard) return guard;

    const startMs = Date.now();
    const sb = supabaseAdmin();

    try {
        const { data: flag } = await sb.from('feature_flags').select('enabled').eq('name', 'control_tower_enabled').maybeSingle();
        if (!flag?.enabled) {
            await logCronRun('control_tower_scan_v2', startMs, 'skipped', { metadata: { reason: 'flag_off' } });
            return NextResponse.json({ ok: true, skipped: true });
        }

        // Read current demand signals (live)
        const { data: demandRows } = await sb
            .from('corridor_demand_signals')
            .select('corridor_id, demand_pressure, surge_active, surge_multiplier')
            .order('demand_pressure', { ascending: false });

        // Read supply snapshot (live)
        const { data: supplyRows } = await sb
            .from('corridor_supply_snapshot')
            .select('corridor_slug, supply_count, supply_level, demand_pressure')
            .order('demand_pressure', { ascending: false });

        const supplyMap = new Map<string, { count: number; level: string }>();
        for (const s of (supplyRows ?? [])) {
            supplyMap.set(s.corridor_slug, { count: s.supply_count ?? 0, level: s.supply_level ?? 'unknown' });
        }

        let alertsInserted = 0;
        const corridorsEvaluated = (demandRows ?? []).length;

        for (const row of (demandRows ?? [])) {
            const supply = supplyMap.get(row.corridor_id);
            const pressure = row.demand_pressure ?? 0;

            if (pressure >= PRESSURE_CRITICAL || row.surge_active) {
                const { data: existing } = await sb
                    .from('ct_alerts')
                    .select('id')
                    .eq('alert_type', 'pressure_critical')
                    .eq('geo_key', row.corridor_id)
                    .gte('created_at', new Date(Date.now() - 60 * 60_000).toISOString())
                    .maybeSingle();

                if (!existing) {
                    await sb.from('ct_alerts').insert({
                        alert_type: 'pressure_critical',
                        severity: row.surge_active ? 'critical' : 'high',
                        corridor_slug: row.corridor_id,
                        geo_key: row.corridor_id,
                        message: row.surge_active
                            ? `⚡ SURGE on ${row.corridor_id} — demand pressure ${Math.round(pressure * 100)}%, ${supply?.count ?? '?'} operators (${supply?.level ?? 'unknown'})`
                            : `Critical pressure on ${row.corridor_id} — demand ${Math.round(pressure * 100)}%, supply ${supply?.level ?? 'unknown'}`,
                        details: {
                            demand_pressure: pressure,
                            surge_active: row.surge_active,
                            surge_multiplier: row.surge_multiplier,
                            supply_count: supply?.count ?? 0,
                            supply_level: supply?.level ?? 'unknown',
                        },
                    });
                    alertsInserted++;
                }
            } else if (pressure >= PRESSURE_WARNING) {
                const { data: existing } = await sb
                    .from('ct_alerts')
                    .select('id')
                    .eq('alert_type', 'pressure_warning')
                    .eq('geo_key', row.corridor_id)
                    .gte('created_at', new Date(Date.now() - 2 * 60 * 60_000).toISOString())
                    .maybeSingle();

                if (!existing) {
                    await sb.from('ct_alerts').insert({
                        alert_type: 'pressure_warning',
                        severity: 'warning',
                        corridor_slug: row.corridor_id,
                        geo_key: row.corridor_id,
                        message: `Tightening pressure on ${row.corridor_id} — demand ${Math.round(pressure * 100)}%, supply ${supply?.level ?? 'unknown'}`,
                        details: {
                            demand_pressure: pressure,
                            supply_count: supply?.count ?? 0,
                            supply_level: supply?.level ?? 'unknown',
                        },
                    });
                    alertsInserted++;
                }
            }
        }

        await logCronRun('control_tower_scan_v2', startMs, 'success', {
            rows_affected: alertsInserted,
            metadata: { corridors_evaluated: corridorsEvaluated, alerts_inserted: alertsInserted },
        });

        return NextResponse.json({ ok: true, corridors: corridorsEvaluated, alerts_inserted: alertsInserted });

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await deadLetter('control_tower_scan_v2', {}, msg);
        await logCronRun('control_tower_scan_v2', startMs, 'failed', { error_message: msg });
        return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
}
