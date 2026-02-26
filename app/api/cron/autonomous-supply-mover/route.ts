import { NextResponse } from 'next/server';
import { cronGuard, supabaseAdmin, logCronRun, deadLetter } from '../_lib/cron-guard';

// ── autonomous_supply_mover_v1 ────────────────────────────────────────────
// Runs hourly. Reads corridor_scarcity_index, finds nearest idle escorts,
// writes reposition_signals. Respects 24h cooldown per escort.

const SCARCITY_THRESHOLD = 60;  // corridors above this score get repositioning signals
const REPOSITION_COOLDOWN_H = 24;  // don't spam same escort within 24h

export async function GET() {
    const guard = await cronGuard();
    if (guard) return guard;

    const startMs = Date.now();
    const sb = supabaseAdmin();

    try {
        const { data: flag } = await sb.from('feature_flags').select('enabled').eq('name', 'control_tower_enabled').maybeSingle();
        if (!flag?.enabled) {
            await logCronRun('autonomous_supply_mover_v1', startMs, 'skipped', { metadata: { reason: 'flag_off' } });
            return NextResponse.json({ ok: true, skipped: true });
        }

        // Get high-scarcity corridors
        const { data: scarceCorridors } = await sb
            .from('corridor_scarcity_index')
            .select('corridor_slug, scarcity_index')
            .gte('scarcity_index', SCARCITY_THRESHOLD)
            .order('scarcity_index', { ascending: false })
            .limit(10);

        if (!scarceCorridors || scarceCorridors.length === 0) {
            await logCronRun('autonomous_supply_mover_v1', startMs, 'skipped', { metadata: { reason: 'no_scarce_corridors' } });
            return NextResponse.json({ ok: true, skipped: true, reason: 'no_scarce_corridors' });
        }

        // Get escorts not recently notified
        const cooldownCutoff = new Date(Date.now() - REPOSITION_COOLDOWN_H * 3600_000).toISOString();
        const { data: recentlySent } = await sb
            .from('reposition_signals')
            .select('escort_id')
            .gte('created_at', cooldownCutoff);
        const recentEscortIds = new Set((recentlySent ?? []).map(r => r.escort_id));

        // Get idle escorts (no active match in last 2h)
        const { data: escorts } = await sb
            .from('driver_profiles')
            .select('id, region_code, trust_score')
            .gte('trust_score', 40)
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

        for (const corridor of scarceCorridors) {
            // Pick up to 3 escorts per corridor
            const candidates = eligibleEscorts.slice(0, 3);
            for (const escort of candidates) {
                const confidence = Math.min(0.95, corridor.scarcity_index / 100);
                signals.push({
                    escort_id: escort.id,
                    corridor_slug: corridor.corridor_slug,
                    signal_type: corridor.scarcity_index > 80 ? 'shortage' : 'opportunity',
                    confidence,
                    recommended_move: {
                        target_corridor: corridor.corridor_slug,
                        reason: `Scarcity index ${Math.round(corridor.scarcity_index)}/100 — high demand, low supply`,
                        urgency: corridor.scarcity_index > 80 ? 'high' : 'medium',
                    },
                });
            }
        }

        if (signals.length > 0) {
            await sb.from('reposition_signals').insert(signals);
        }

        await logCronRun('autonomous_supply_mover_v1', startMs, 'success', {
            rows_affected: signals.length,
            metadata: { scarce_corridors: scarceCorridors.length, signals_generated: signals.length },
        });

        return NextResponse.json({ ok: true, signals_generated: signals.length, corridors_targeted: scarceCorridors.length });

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await deadLetter('autonomous_supply_mover_v1', {}, msg);
        await logCronRun('autonomous_supply_mover_v1', startMs, 'failed', { error_message: msg });
        return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
}
