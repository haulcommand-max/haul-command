import { NextResponse } from 'next/server';
import { cronGuard, supabaseAdmin, logCronRun, deadLetter } from '../_lib/cron-guard';
import { MAJOR_CORRIDORS } from '@/lib/seo/pilot-car-taxonomy';

// ── escort_supply_radar_v1 ────────────────────────────────────────────────
// Runs every 15 min via Vercel Cron
// Buckets escort supply by corridor, detects shortages, updates snapshot table
// Phase 1 corridors: FL/GA/TX corridors only; expands with flag

const PHASE1_CORRIDORS = new Set([
    'i-75-southeast', 'i-10-southern', 'i-95-atlantic', // FL/GA
    'i-35-central', 'i-20-west', 'i-45-gulf',           // TX
]);

export async function GET() {
    const guard = await cronGuard();
    if (guard) return guard;

    const startMs = Date.now();
    const sb = supabaseAdmin();
    const nowBucket = new Date();
    nowBucket.setMinutes(Math.floor(nowBucket.getMinutes() / 15) * 15, 0, 0);

    let rowsAffected = 0;

    try {
        // Check flag
        const { data: flag } = await sb.from('feature_flags').select('enabled').eq('name', 'control_tower_enabled').maybeSingle();
        if (!flag?.enabled) {
            await logCronRun('escort_supply_radar_v1', startMs, 'skipped', { metadata: { reason: 'flag_off' } });
            return NextResponse.json({ ok: true, skipped: true, reason: 'control_tower_enabled=false' });
        }

        // Fetch active escorts grouped by region
        const { data: escorts } = await sb
            .from('driver_profiles')
            .select('id, region_code, fill_probability, compliance_status')
            .not('trust_score', 'is', null);

        const targetCorridors = MAJOR_CORRIDORS.filter(c => PHASE1_CORRIDORS.has(c.slug));

        const snapshots = targetCorridors.map(corridor => {
            // Rough proximity: escorts in states this corridor passes through
            const corridorStates = new Set(corridor.states.map(s => s.toUpperCase().slice(0, 2)));
            const onCorridor = (escorts ?? []).filter(e =>
                e.region_code && corridorStates.has(e.region_code.toUpperCase())
            );
            const available = onCorridor.filter(e => e.compliance_status !== 'failed');
            const demandPressure = onCorridor.length === 0 ? 1.0 : Math.max(0, 1 - available.length / 10);

            return {
                corridor_slug: corridor.slug,
                timestamp_bucket: nowBucket.toISOString(),
                supply_count: onCorridor.length,
                available_count: available.length,
                acceptance_velocity_24h: available.length * 0.7, // stub; real: query match_outcomes
                demand_pressure: demandPressure,
            };
        });

        if (snapshots.length > 0) {
            const { error } = await sb.from('corridor_supply_snapshot').upsert(snapshots, {
                onConflict: 'corridor_slug,timestamp_bucket',
            });
            if (error) throw new Error(error.message);
            rowsAffected = snapshots.length;
        }

        await logCronRun('escort_supply_radar_v1', startMs, 'success', {
            rows_affected: rowsAffected,
            metadata: { corridors_scanned: snapshots.length, escort_count: escorts?.length ?? 0 },
        });

        return NextResponse.json({ ok: true, corridors_scanned: snapshots.length, rows: rowsAffected });

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await deadLetter('escort_supply_radar_v1', { timestamp: nowBucket.toISOString() }, msg);
        await logCronRun('escort_supply_radar_v1', startMs, 'failed', { error_message: msg });
        return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
}
