/**
 * GET /api/density/markets
 *
 * Returns micro-market density classifications from H3-indexed directory_listings.
 * Powers: local market selection, sponsor pricing intelligence, ranking influence.
 *
 * Query params:
 *   - resolution: 7 (default) or 8
 *   - min_operators: minimum operator count per cell (default 1)
 *   - classification: sparse|forming|active|dense|saturated (filter)
 *   - limit: max results (default 50)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type DensityClass = 'sparse' | 'forming' | 'active' | 'dense' | 'saturated';

function classifyDensity(count: number): DensityClass {
    if (count > 30) return 'saturated';
    if (count > 15) return 'dense';
    if (count > 5) return 'active';
    if (count > 2) return 'forming';
    return 'sparse';
}

function densityLabel(cls: DensityClass): string {
    switch (cls) {
        case 'sparse': return 'Limited local supply';
        case 'forming': return 'Growing market';
        case 'active': return 'Active operator market';
        case 'dense': return 'Dense operator market';
        case 'saturated': return 'High-density market';
    }
}

function sponsorValue(cls: DensityClass, count: number): 'low' | 'medium' | 'high' | 'premium' {
    if (cls === 'saturated') return 'premium';
    if (cls === 'dense') return 'high';
    if (cls === 'active') return 'medium';
    return 'low';
}

export async function GET(req: NextRequest) {
    const supabase = getSupabaseAdmin();
    const sp = req.nextUrl.searchParams;
    const resolution = sp.get('resolution') === '8' ? 'h3_r8' : 'h3_r7';
    const minOps = parseInt(sp.get('min_operators') ?? '1', 10);
    const classFilter = sp.get('classification') as DensityClass | null;
    const limit = Math.min(200, parseInt(sp.get('limit') ?? '50', 10));

    // Fetch all H3-indexed listings
    let allRows: any[] = [];
    let offset = 0;
    const PAGE = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('hc_global_operators')
            .select(`${resolution}, city, region_code, country_code`)
            .not(resolution, 'is', null)
            .range(offset, offset + PAGE - 1);

        if (error || !data?.length) {
            hasMore = false;
        } else {
            allRows.push(...data);
            offset += PAGE;
            if (data.length < PAGE) hasMore = false;
        }
    }

    // Aggregate by H3 cell
    const cellMap: Record<string, { count: number; cities: Set<string>; regions: Set<string> }> = {};
    for (const row of allRows) {
        const cell = row[resolution];
        if (!cell) continue;
        if (!cellMap[cell]) cellMap[cell] = { count: 0, cities: new Set(), regions: new Set() };
        cellMap[cell].count++;
        if (row.city) cellMap[cell].cities.add(row.city);
        if (row.region_code) cellMap[cell].regions.add(row.region_code);
    }

    // Build markets
    let markets = Object.entries(cellMap)
        .filter(([, v]) => v.count >= minOps)
        .map(([cell, v]) => {
            const cls = classifyDensity(v.count);
            return {
                h3_cell: cell,
                operator_count: v.count,
                density_class: cls,
                density_label: densityLabel(cls),
                sponsor_value: sponsorValue(cls, v.count),
                primary_city: [...v.cities][0] ?? null,
                regions: [...v.regions],
            };
        })
        .sort((a, b) => b.operator_count - a.operator_count);

    // Filter by classification if specified
    if (classFilter) {
        markets = markets.filter(m => m.density_class === classFilter);
    }

    markets = markets.slice(0, limit);

    // Summary stats
    const allMarkets = Object.values(cellMap);
    const summary = {
        total_cells: allMarkets.length,
        total_operators_indexed: allRows.length,
        sparse: allMarkets.filter(v => v.count <= 2).length,
        forming: allMarkets.filter(v => v.count > 2 && v.count <= 5).length,
        active: allMarkets.filter(v => v.count > 5 && v.count <= 15).length,
        dense: allMarkets.filter(v => v.count > 15 && v.count <= 30).length,
        saturated: allMarkets.filter(v => v.count > 30).length,
    };

    return NextResponse.json({
        ok: true,
        resolution: resolution === 'h3_r7' ? 7 : 8,
        summary,
        markets,
    });
}
