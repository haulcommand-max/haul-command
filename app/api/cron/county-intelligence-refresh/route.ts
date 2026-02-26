import { NextResponse } from 'next/server';
import { cronGuard, supabaseAdmin, logCronRun, deadLetter } from '../_lib/cron-guard';

// ── county_intelligence_refresh_v1 ────────────────────────────────────────
// Runs weekly (Sunday 02:00 UTC) via Vercel Cron
// 1. Recomputes supply_risk_score from live escort counts
// 2. Detects status drift (escorted counties going unserved)
// 3. Logs verification timestamps for audit trail
//
// Data coverage targets:
//   Phase 1: 67 FL counties (seeded) ✅
//   Phase 2: TX (254) + GA (159) counties — seed via /api/admin/county-seed
//   Phase 3: All ~3,100 US + ~293 CA census divisions
//
// External ingestion sources (yearly batch, run separately):
//   FL: https://floridarevenue.com/property/Documents/fcco.pdf
//   US: https://www.ers.usda.gov/data-products/rural-urban-continuum-codes/
//   US: https://www.census.gov/data.html
//   CA: https://www12.statcan.gc.ca/census-recensement

export async function GET() {
    const guard = await cronGuard();
    if (guard) return guard;

    const startMs = Date.now();
    const sb = supabaseAdmin();

    try {
        const { data: flag } = await sb
            .from('feature_flags').select('enabled')
            .eq('name', 'control_tower_enabled').maybeSingle();
        if (!flag?.enabled) {
            await logCronRun('county_intelligence_refresh_v1', startMs, 'skipped', { metadata: { reason: 'flag_off' } });
            return NextResponse.json({ ok: true, skipped: true });
        }

        // Step 1: Recompute active escort counts per state/province
        // (precise county-level geo matching requires geocoded lat/lng — use region_code proxy for now)
        const { data: regions } = await sb
            .from('geo_county_intelligence')
            .select('id, state_province, fiscally_constrained_flag, rural_classification, population_density, active_escort_count, supply_risk_score');

        if (!regions || regions.length === 0) {
            await logCronRun('county_intelligence_refresh_v1', startMs, 'skipped', { metadata: { reason: 'no_counties_seeded' } });
            return NextResponse.json({ ok: true, skipped: true, reason: 'no_counties_seeded' });
        }

        // Get live escort counts per state (rough proxy until lat/lng geocoding is complete)
        const { data: escortsByState } = await sb
            .from('driver_profiles')
            .select('region_code')
            .eq('availability_status', 'available');

        const stateEscortMap = new Map<string, number>();
        for (const e of (escortsByState ?? [])) {
            if (e.region_code) {
                stateEscortMap.set(e.region_code, (stateEscortMap.get(e.region_code) ?? 0) + 1);
            }
        }

        // Step 2: Batch-update supply risk scores, flag drift
        let updatedCount = 0;
        const driftAlerts: string[] = [];

        for (const county of regions) {
            const stateEscorts = stateEscortMap.get(county.state_province) ?? 0;
            // Rough distribution: divide state escorts across counties (improves with geocoding)
            const estimatedEscorts = Math.max(0, Math.floor(stateEscorts / 10));

            // Compute new risk score
            const newRisk = computeRisk(
                county.fiscally_constrained_flag,
                county.rural_classification,
                county.population_density,
                estimatedEscorts
            );

            // Drift detection: risk jumped by >20 points
            if (Math.abs(newRisk - (county.supply_risk_score ?? 0)) > 20) {
                driftAlerts.push(`${county.state_province}/${county.id}: ${county.supply_risk_score} → ${newRisk}`);
            }

            await sb.from('geo_county_intelligence')
                .update({
                    active_escort_count: estimatedEscorts,
                    supply_risk_score: newRisk,
                    last_verified_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', county.id);

            updatedCount++;
        }

        // Step 3: Write drift alerts to ct_alerts if any
        if (driftAlerts.length > 0) {
            await sb.from('ct_alerts').insert({
                alert_type: 'county_drift_detected',
                severity: 'info',
                message: `${driftAlerts.length} county supply risk scores shifted >20 points`,
                details: { drift_samples: driftAlerts.slice(0, 10) },
            });
        }

        await logCronRun('county_intelligence_refresh_v1', startMs, 'success', {
            rows_affected: updatedCount,
            metadata: {
                counties_updated: updatedCount,
                drift_alerts: driftAlerts.length,
                states_with_escorts: stateEscortMap.size,
            },
        });

        return NextResponse.json({
            ok: true,
            counties_updated: updatedCount,
            drift_alerts: driftAlerts.length,
        });

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await deadLetter('county_intelligence_refresh_v1', {}, msg);
        await logCronRun('county_intelligence_refresh_v1', startMs, 'failed', { error_message: msg });
        return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
}

// ── Inline risk computation (mirrors the DB function) ─────────────────────
function computeRisk(
    fiscallyConstrained: boolean,
    ruralClass: string | null,
    populationDensity: number | null,
    escortCount: number
): number {
    let score = 0;
    if (fiscallyConstrained) score += 25;
    const ruralScores: Record<string, number> = {
        frontier: 30, rural_nonadjacent: 25, rural_adjacent: 20,
        urban_nonadjacent: 15, urban_adjacent: 10,
    };
    score += ruralScores[ruralClass ?? ''] ?? 0;
    if (populationDensity !== null) {
        if (populationDensity < 10) score += 20;
        else if (populationDensity < 50) score += 10;
    }
    if (escortCount === 0) score += 25;
    else if (escortCount < 3) score += 15;
    else if (escortCount < 8) score += 5;
    return Math.min(100, Math.max(0, score));
}
