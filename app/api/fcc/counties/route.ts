export const dynamic = 'force-dynamic';
/**
 * GET /api/fcc/counties
 * Returns FCC county data with scoring overrides for the specified state.
 * Consumed by: AMM, surge engine, FCC observability dashboard.
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET(req: NextRequest) {
    const svc = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const state = req.nextUrl.searchParams.get('state') ?? 'FL';

    const { data: counties } = await svc
        .from('fcc_scoring_overrides')
        .select('*')
        .eq('state_code', state.toUpperCase())
        .order('adjusted_deficit_score', { ascending: false });

    const { data: snapshots } = await svc
        .from('fcc_coverage_snapshots')
        .select('county_slug, active_operators, supply_gap_score, snapshotted_at')
        .eq('state_code', state.toUpperCase())
        .order('snapshotted_at', { ascending: false })
        .limit(100);

    // Merge most recent snapshot per county
    const latestByCounty = new Map<string, Record<string, unknown>>();
    for (const s of (snapshots ?? [])) {
        if (!latestByCounty.has((s as any).county_slug)) {
            latestByCounty.set((s as any).county_slug, s as Record<string, unknown>);
        }
    }

    const enriched = (counties ?? []).map((c: any) => ({
        ...c,
        latest_snapshot: latestByCounty.get(c.county_slug) ?? null,
    }));

    return NextResponse.json({
        state,
        fcc_counties: enriched,
        count: enriched.length,
        critical_shortage: enriched.filter((c: any) => c.surge_mode === 'critical_shortage').length,
        aggressive_surge: enriched.filter((c: any) => c.surge_mode === 'aggressive_surge').length,
        refreshed_at: new Date().toISOString(),
    });
}
