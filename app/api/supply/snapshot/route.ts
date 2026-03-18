/**
 * GET /api/supply/snapshot
 *
 * Returns live supply data from corridor_supply_snapshot.
 * Powers: radar supply level, pressure index, availability scores.
 *
 * Response:
 *   { ok, corridors: [{ corridor_id, operator_count, available_count, supply_level, availability_score, demand_pressure, computed_at }] }
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5m cache

function classifySupplyLevel(pressure: number): string {
    if (pressure >= 0.8) return 'shortage';
    if (pressure >= 0.6) return 'tight';
    if (pressure >= 0.3) return 'balanced';
    return 'oversupply';
}

export async function GET() {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('corridor_supply_snapshot')
        .select('*')
        .order('supply_count', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const corridors = (data ?? []).map((row: any) => {
        const supplyCount = row.supply_count ?? 0;
        const availableCount = row.available_count ?? 0;
        const demandPressure = row.demand_pressure ?? 0;
        const availabilityScore = supplyCount > 0
            ? Math.round((availableCount / supplyCount) * 100)
            : 0;

        return {
            corridor_id: row.corridor_slug,
            operator_count: supplyCount,
            available_count: availableCount,
            supply_level: classifySupplyLevel(demandPressure),
            availability_score: availabilityScore,
            demand_pressure: demandPressure,
            computed_at: row.timestamp_bucket ?? row.created_at,
        };
    });

    return NextResponse.json({
        ok: true,
        corridors_count: corridors.length,
        corridors,
    });
}
