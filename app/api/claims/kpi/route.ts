export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/claims/kpi
 * Returns claim coverage KPIs for all countries and surface types.
 */
export async function GET() {
    try {
        const supabase = await createClient();

        // Overall counts
        const { count: total } = await supabase
            .from('surfaces')
            .select('id', { count: 'exact', head: true });

        const { count: claimed } = await supabase
            .from('surfaces')
            .select('id', { count: 'exact', head: true })
            .eq('claim_status', 'claimed');

        const { count: claimable } = await supabase
            .from('surfaces')
            .select('id', { count: 'exact', head: true })
            .eq('claim_status', 'claimable');

        const { count: pending } = await supabase
            .from('surfaces')
            .select('id', { count: 'exact', head: true })
            .eq('claim_status', 'pending_verification');

        // By country (top 10)
        const { data: byCountry } = await supabase
            .from('claim_kpi_summary')
            .select('country_code, total_surfaces, claimed, claimed_pct')
            .order('total_surfaces', { ascending: false })
            .limit(20);

        // By surface type
        const { data: byType } = await supabase
            .from('claim_kpi_summary')
            .select('surface_type, total_surfaces, claimed, claimed_pct');

        // Aggregate by type
        const typeAgg: Record<string, { total: number; claimed: number }> = {};
        for (const row of byType ?? []) {
            if (!typeAgg[row.surface_type]) typeAgg[row.surface_type] = { total: 0, claimed: 0 };
            typeAgg[row.surface_type].total += row.total_surfaces;
            typeAgg[row.surface_type].claimed += row.claimed;
        }

        return NextResponse.json({
            overview: {
                total_surfaces: total ?? 0,
                claimed: claimed ?? 0,
                claimable: claimable ?? 0,
                pending: pending ?? 0,
                coverage_pct: total ? Math.round(((claimed ?? 0) / total) * 1000) / 10 : 0,
            },
            by_country: byCountry ?? [],
            by_type: Object.entries(typeAgg).map(([type, counts]) => ({
                surface_type: type,
                total: counts.total,
                claimed: counts.claimed,
                coverage_pct: counts.total ? Math.round((counts.claimed / counts.total) * 1000) / 10 : 0,
            })),
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
