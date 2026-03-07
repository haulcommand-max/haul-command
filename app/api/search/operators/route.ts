import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { OperatorSearchResult } from '@/lib/search/types';

/**
 * GET /api/search/operators
 *
 * HC Search Engine V2 — Operator Directory
 * Uses: search_documents table with FTS + trigram + trust + verified + recency + geo scoring
 *
 * Query params:
 *   q           — search query (fuzzy + full-text)
 *   country     — country filter (US, CA, etc.)
 *   region      — state/province
 *   city        — city filter
 *   tags        — comma-separated tag filter (e.g., "pilot_car,high_pole")
 *   verified    — "1" or "true" for verified only
 *   lat, lng    — user location for geo proximity scoring
 *   radius_km   — search radius in km (default: none)
 *   limit       — results per page (default: 25, max: 50)
 *   offset      — pagination offset
 */

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
    );
}

function parseArrayParam(v: string | null): string[] | null {
    if (!v) return null;
    const arr = v.split(',').map(s => s.trim()).filter(Boolean);
    return arr.length ? arr : null;
}

export async function GET(request: NextRequest) {
    const sp = request.nextUrl.searchParams;

    const q = sp.get('q') || null;
    const country = sp.get('country') || null;
    const region = sp.get('region') || sp.get('state') || null;  // backward compat
    const city = sp.get('city') || null;
    const tags = parseArrayParam(sp.get('tags'));
    const verifiedOnly = sp.get('verified') === '1' || sp.get('verified') === 'true';

    const lat = sp.get('lat');
    const lng = sp.get('lng');
    const radiusRaw = sp.get('radius_km') ?? sp.get('radiusKm') ?? sp.get('radius');

    const p_lat = lat ? Number(lat) : null;
    const p_lng = lng ? Number(lng) : null;
    // If radius was in miles (old API), convert; radius_km takes precedence
    let p_radius_km: number | null = null;
    if (radiusRaw) {
        const val = Number(radiusRaw);
        // If caller used old 'radius' param (in miles), convert to km
        if (sp.has('radius') && !sp.has('radius_km') && !sp.has('radiusKm')) {
            p_radius_km = val * 1.60934;
        } else {
            p_radius_km = val;
        }
    }

    const limit = Math.min(parseInt(sp.get('limit') ?? '25', 10), 50);
    const offset = Math.max(parseInt(sp.get('offset') ?? '0', 10), 0);

    const supabase = getSupabase();

    const { data, error } = await supabase.rpc('hc_search_operators', {
        p_q: q,
        p_country_code: country,
        p_region: region,
        p_city: city,
        p_tags: tags,
        p_verified_only: verifiedOnly,
        p_lat,
        p_lng,
        p_radius_km,
        p_limit: limit,
        p_offset: offset,
    });

    if (error) {
        console.error('[search/operators] RPC error:', error);
        return NextResponse.json(
            { error: 'Search failed', detail: error.message },
            { status: 500 },
        );
    }

    const results = (data ?? []) as OperatorSearchResult[];

    return NextResponse.json({
        results,
        meta: {
            query: q,
            filters: { country, region, city, tags, verified: verifiedOnly },
            geo: p_lat && p_lng ? { lat: p_lat, lng: p_lng, radius_km: p_radius_km } : null,
            count: results.length,
            limit,
            offset,
        },
    }, {
        headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
    });
}
