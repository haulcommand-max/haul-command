import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { cronGuard, supabaseAdmin, logCronRun, deadLetter } from '../_lib/cron-guard';

// ── autonomous_supply_mover_v2 ────────────────────────────────────────────
// Runs hourly. Reads corridor_demand_signals + corridor_supply_snapshot
// to find high-pressure corridors, finds nearest idle escorts from
// directory_listings, writes reposition_signals. Respects 24h cooldown.
//
// UPGRADED from v1: corridor_scarcity_index → corridor_demand_signals (live)
//                   driver_profiles → directory_listings (6,949 operators)

const PRESSURE_THRESHOLD = 0.4;  // corridors above this demand_pressure get repositioning signals
const REPOSITION_COOLDOWN_H = 24;  // don't spam same escort within 24h

export async function GET() {
    const guard = await cronGuard();
    if (guard) return guard;

    const startMs = Date.now();
    const sb = supabaseAdmin();

    try {
        const { data: flag } = await sb.from('feature_flags').select('enabled').eq('name', 'control_tower_enabled').maybeSingle();
        if (!flag?.enabled) {
            await logCronRun('autonomous_supply_mover_v2', startMs, 'skipped', { metadata: { reason: 'flag_off' } });
            return NextResponse.json({ ok: true, skipped: true });
        }

        // Get high-pressure corridors from live demand signals
        const { data: demandCorridors } = await sb
            .from('corridor_demand_signals')
            .select('corridor_id, demand_pressure, surge_active, surge_multiplier')
            .gte('demand_pressure', PRESSURE_THRESHOLD)
            .order('demand_pressure', { ascending: false })
            .limit(10);

        if (!demandCorridors || demandCorridors.length === 0) {
            await logCronRun('autonomous_supply_mover_v2', startMs, 'skipped', { metadata: { reason: 'no_high_pressure_corridors' } });
            return NextResponse.json({ ok: true, skipped: true, reason: 'no_high_pressure_corridors' });
        }

        // Cross-reference with supply to find true shortages
        const corridorSlugs = demandCorridors.map(c => c.corridor_id);
        const { data: supplyRows } = await sb
            .from('corridor_supply_snapshot')
            .select('corridor_slug, supply_count, supply_level')
            .in('corridor_slug', corridorSlugs);

        const supplyMap = new Map<string, { count: number; level: string }>();
        for (const s of (supplyRows ?? [])) {
            supplyMap.set(s.corridor_slug, { count: s.supply_count ?? 0, level: s.supply_level ?? 'unknown' });
        }

        // Get escorts not recently notified
        const cooldownCutoff = new Date(Date.now() - REPOSITION_COOLDOWN_H * 3600_000).toISOString();
        const { data: recentlySent } = await sb
            .from('reposition_signals')
            .select('escort_id')
            .gte('created_at', cooldownCutoff);
        const recentEscortIds = new Set((recentlySent ?? []).map(r => r.escort_id));

        // Get available operators from directory_listings (live, 6,949 operators)
        const { data: escorts } = await sb
            .from('hc_global_operators')
            .select('id, region, country')
            .not('confidence_score', 'is', null)
            .limit(100);

        const eligibleEscorts = (escorts ?? []).filter(e => !recentEscortIds.has(e.id));

        // Generate reposition signals
        const signals: Array<{
            escort_id: string;
            corridor_slug: string;
            signal_type: string;
            confidence: number;
            recommended_move: object;
        }> = [];

        for (const corridor of demandCorridors) {
            const supply = supplyMap.get(corridor.corridor_id);
            const candidates = eligibleEscorts.slice(0, 3);
            for (const escort of candidates) {
                const confidence = Math.min(0.95, corridor.demand_pressure);
                signals.push({
                    escort_id: escort.id,
                    corridor_slug: corridor.corridor_id,
                    signal_type: corridor.surge_active ? 'shortage' : 'opportunity',
                    confidence,
                    recommended_move: {
                        target_corridor: corridor.corridor_id,
                        reason: `Demand pressure ${Math.round(corridor.demand_pressure * 100)}% — ${supply?.level ?? 'unknown'} supply (${supply?.count ?? 0} operators)`,
                        urgency: corridor.surge_active ? 'critical' : corridor.demand_pressure > 0.6 ? 'high' : 'medium',
                    },
                });
            }
        }

        if (signals.length > 0) {
            await sb.from('reposition_signals').insert(signals);
        }

        await logCronRun('autonomous_supply_mover_v2', startMs, 'success', {
            rows_affected: signals.length,
            metadata: {
                high_pressure_corridors: demandCorridors.length,
                signals_generated: signals.length,
                surge_corridors: demandCorridors.filter(c => c.surge_active).length,
            },
        });

        return NextResponse.json({
            ok: true,
            signals_generated: signals.length,
            corridors_targeted: demandCorridors.length,
        });

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await deadLetter('autonomous_supply_mover_v2', {}, msg);
        await logCronRun('autonomous_supply_mover_v2', startMs, 'failed', { error_message: msg });
        return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
}
