import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { LoadSearchResult } from '@/lib/search/types';

/**
 * GET /api/search/loads
 *
 * HC Search Engine V2 — Load Board Search
 * Uses: search_documents table with FTS + trigram + geo scoring
 *
 * Query params:
 *   q           — search query (title, origin, destination)
 *   country     — country filter
 *   region      — origin state/province
 *   city        — origin city
 *   status      — load status (default: "open")
 *   lat, lng    — origin proximity scoring
 *   radius_km   — search radius in km
 *   limit       — results per page (default: 25, max: 50)
 *   offset      — pagination offset
 */


export async function GET(request: NextRequest) {
    const sp = request.nextUrl.searchParams;

    const q = sp.get('q') || null;
    const country = sp.get('country') || null;
    const region = sp.get('region') || sp.get('state') || null;
    const city = sp.get('city') || null;
    const status = sp.get('status') || 'open';

    const lat = sp.get('lat');
    const lng = sp.get('lng');
    const radiusRaw = sp.get('radius_km') ?? sp.get('radiusKm') ?? sp.get('radius');

    const p_lat = lat ? Number(lat) : null;
    const p_lng = lng ? Number(lng) : null;
    let p_radius_km: number | null = null;
    if (radiusRaw) {
        const val = Number(radiusRaw);
        if (sp.has('radius') && !sp.has('radius_km') && !sp.has('radiusKm')) {
            p_radius_km = val * 1.60934;
        } else {
            p_radius_km = val;
        }
    }

    const limit = Math.min(parseInt(sp.get('limit') ?? '25', 10), 50);
    const offset = Math.max(parseInt(sp.get('offset') ?? '0', 10), 0);

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc('hc_search_loads', {
        p_q: q,
        p_country_code: country,
        p_region: region,
        p_city: city,
        p_status: status === 'all' ? null : status,
        p_lat,
        p_lng,
        p_radius_km,
        p_h3_cells: null, // client can provide pre-computed H3 k-ring cells
        p_limit: limit,
        p_offset: offset,
    });

    if (error) {
        console.error('[search/loads] RPC error:', error);
        return NextResponse.json(
            { error: 'Search failed', detail: error.message },
            { status: 500 },
        );
    }

    const results = (data ?? []) as LoadSearchResult[];

    return NextResponse.json({
        results,
        meta: {
            query: q,
            status,
            filters: { country, region, city },
            geo: p_lat && p_lng ? { lat: p_lat, lng: p_lng, radius_km: p_radius_km } : null,
            count: results.length,
            limit,
            offset,
        },
    }, {
        headers: {
            'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
        },
    });
}
