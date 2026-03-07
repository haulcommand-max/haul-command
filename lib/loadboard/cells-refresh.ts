// lib/loadboard/cells-refresh.ts
//
// Haul Command — Coverage Cells Refresh Job
// Spec: Map-First Load Board v1.0.0
//
// Background job: aggregates jobs + operators into coverage_cells,
// computes freshness-weighted effective counts and coverage confidence.
// Runs every 60s for hot cells, every 10m full sweep.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";
import {
    computeCoverageConfidence,
    computeJobEffectiveWeight,
    computeOperatorEffectiveWeight,
    type JobSignal,
    type OperatorSignal,
    type CoverageCellResult,
    type VerificationLevel,
    type EscortType,
} from "./coverage-confidence";

// ============================================================
// GEOHASH HELPERS
// ============================================================

const GEOHASH_BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

function encodeGeohash(lat: number, lng: number, precision: number): string {
    let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;
    let hash = '';
    let bit = 0;
    let ch = 0;
    let isLng = true;

    while (hash.length < precision) {
        const mid = isLng ? (lngMin + lngMax) / 2 : (latMin + latMax) / 2;
        const val = isLng ? lng : lat;
        if (val >= mid) {
            ch |= (1 << (4 - bit));
            if (isLng) lngMin = mid; else latMin = mid;
        } else {
            if (isLng) lngMax = mid; else latMax = mid;
        }
        isLng = !isLng;
        if (++bit === 5) {
            hash += GEOHASH_BASE32[ch];
            bit = 0;
            ch = 0;
        }
    }
    return hash;
}

/**
 * Precision mapping based on zoom level:
 *   zoom 1-4  → precision 2 (≈630km cells)
 *   zoom 5-7  → precision 3 (≈78km cells)
 *   zoom 8-10 → precision 4 (≈20km cells)
 *   zoom 11-13→ precision 5 (≈2.4km cells)
 *   zoom 14+  → precision 6 (≈610m cells)
 */
export function geohashPrecisionForZoom(zoom: number): number {
    if (zoom <= 4) return 2;
    if (zoom <= 7) return 3;
    if (zoom <= 10) return 4;
    if (zoom <= 13) return 5;
    return 6;
}

// ============================================================
// MAIN REFRESH
// ============================================================

export interface RefreshResult {
    cells_updated: number;
    jobs_processed: number;
    operators_processed: number;
    duration_ms: number;
}

/**
 * Full sweep: recompute all coverage cells from raw data.
 */
export async function refreshAllCells(precision: number = 4): Promise<RefreshResult> {
    const startTime = Date.now();
    const supabase = getSupabaseAdmin();

    // ── Fetch open jobs ──
    const { data: jobs } = await supabase
        .from('job_posts')
        .select('job_id, created_at, updated_at, verification_level, payout_min, payout_max, poster_reputation, escort_type, origin_geohash, origin_point')
        .eq('status', 'open');

    const allJobs = (jobs || []).map(j => ({
        ...j,
        payout_mid: ((j.payout_min || 0) + (j.payout_max || 0)) / 2,
    }));

    // ── Fetch active operators (active in last 7 days) ──
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: operators } = await supabase
        .from('operator_profiles')
        .select('operator_id, last_active_at, verification_level, responsiveness_score, completion_score, escort_types_supported, service_radius_miles, home_point')
        .gte('last_active_at', sevenDaysAgo);

    const allOperators = operators || [];

    // ── Group by geohash cell ──
    const cellJobs = new Map<string, JobSignal[]>();
    const cellOperators = new Map<string, OperatorSignal[]>();

    for (const job of allJobs) {
        // Truncate geohash to precision
        const cellId = (job.origin_geohash || '').slice(0, precision);
        if (!cellId) continue;

        const existing = cellJobs.get(cellId) || [];
        existing.push({
            job_id: job.job_id,
            created_at: job.created_at,
            updated_at: job.updated_at,
            verification_level: (job.verification_level || 'unverified') as VerificationLevel,
            payout_mid: job.payout_mid,
            poster_reputation: job.poster_reputation || 0.5,
            escort_type: (job.escort_type || 'chase_only') as EscortType,
        });
        cellJobs.set(cellId, existing);
    }

    // Map operators to cells using their home_point coordinates
    for (const op of allOperators) {
        // home_point is PostGIS POINT stored as GeoJSON { type: 'Point', coordinates: [lng, lat] }
        const point = op.home_point as any;
        if (!point?.coordinates) continue;
        const [lng, lat] = point.coordinates;
        const cellId = encodeGeohash(lat, lng, precision);
        if (!cellId) continue;

        const existing = cellOperators.get(cellId) || [];
        existing.push({
            operator_id: op.operator_id,
            last_active_at: op.last_active_at,
            verification_level: (op.verification_level || 'unverified') as VerificationLevel,
            responsiveness_score: op.responsiveness_score || 0.5,
            completion_score: op.completion_score || 0.5,
            escort_types_supported: op.escort_types_supported || ['chase_only'],
            service_radius_miles: op.service_radius_miles || 100,
        });
        cellOperators.set(cellId, existing);
    }

    // ── Compute coverage per cell ──
    const allCellIds = new Set([...cellJobs.keys(), ...cellOperators.keys()]);
    const results: CoverageCellResult[] = [];

    for (const cellId of allCellIds) {
        const jobsInCell = cellJobs.get(cellId) || [];
        const opsInCell = cellOperators.get(cellId) || [];

        const result = computeCoverageConfidence({
            cell_id: cellId,
            jobs: jobsInCell,
            operators: opsInCell,
            trailing_7d_volume: jobsInCell.length,  // Simplified; would query historical
            trailing_30d_volume: jobsInCell.length * 4, // Simplified
        });

        results.push(result);
    }

    // ── Upsert cells ──
    let updated = 0;
    for (const cell of results) {
        const { error } = await supabase.from('coverage_cells').upsert({
            cell_id: cell.cell_id,
            geohash: cell.cell_id,
            centroid_point: null, // Would compute from geohash centroid
            updated_at: new Date().toISOString(),
            active_jobs_raw: cell.active_jobs_raw,
            active_operators_raw: cell.active_operators_raw,
            active_jobs_effective: cell.active_jobs_effective,
            active_operators_effective: cell.active_operators_effective,
            coverage_confidence: cell.coverage_confidence,
            coverage_band: cell.coverage_band,
            demand_norm: cell.demand_norm,
            supply_norm: cell.supply_norm,
            balance_score: cell.balance_score,
            matchability_score: cell.matchability_score,
            reliability_score: cell.reliability_score,
            volatility_penalty: cell.volatility_penalty,
            trailing_7d_volume: cell.trailing_7d_volume,
            trailing_30d_volume: cell.trailing_30d_volume,
        }, { onConflict: 'cell_id' });

        if (!error) updated++;
    }

    return {
        cells_updated: updated,
        jobs_processed: allJobs.length,
        operators_processed: allOperators.length,
        duration_ms: Date.now() - startTime,
    };
}

// ============================================================
// STALE JOB EXPIRER
// ============================================================

/**
 * Expire jobs past pickup_latest + grace_hours.
 * Runs every 5 minutes.
 */
export async function expireStaleJobs(): Promise<number> {
    const supabase = getSupabaseAdmin();

    // Find open jobs where pickup_latest + grace has passed
    const { data: staleJobs } = await supabase
        .from('job_posts')
        .select('job_id, pickup_latest, grace_hours')
        .eq('status', 'open')
        .not('pickup_latest', 'is', null);

    let expired = 0;
    const now = Date.now();

    for (const job of staleJobs || []) {
        const graceMs = (job.grace_hours || 6) * 60 * 60 * 1000;
        const expiryTime = new Date(job.pickup_latest).getTime() + graceMs;

        if (now > expiryTime) {
            await supabase
                .from('job_posts')
                .update({ status: 'expired', updated_at: new Date().toISOString() })
                .eq('job_id', job.job_id);
            expired++;
        }
    }

    return expired;
}
