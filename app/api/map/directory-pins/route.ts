export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/map/directory-pins
 * Returns GeoJSON FeatureCollection for the map view.
 * Source: hc_places (23,530 geocoded records with real lat/lng)
 * Fallback join to hc_global_operators for claimed/verified status.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country');
    const region = searchParams.get('region');
    const category = searchParams.get('category');
    const q = searchParams.get('q');
    const limit = Math.min(Number(searchParams.get('limit') ?? 1500), 3000);
    const claimed = searchParams.get('claimed');

    // bbox: minLng,minLat,maxLng,maxLat
    const bboxParam = searchParams.get('bbox');
    let bbox: [number,number,number,number] | null = null;
    if (bboxParam) {
        const parts = bboxParam.split(',').map(Number);
        if (parts.length === 4 && parts.every(n => !isNaN(n))) {
            bbox = parts as [number,number,number,number];
        }
    }

    const supabase = getSupabaseAdmin();

    // hc_places is the canonical geocoded source — 23,530 records with real lat/lng
    const CATEGORY_TO_SURFACE_KEY: Record<string, string[]> = {
        pilot_car:  ['pilot_car_operator', 'escort_company'],
        truck_stop: ['truck_stop'],
        port:       ['port', 'seaport'],
        terminal:   ['intermodal_terminal', 'rail_terminal'],
        hotel:      ['lodging', 'hotel'],
        high_pole:  ['pilot_car_operator'],
        twic:       ['pilot_car_operator'],
    };

    let query = supabase
        .from('hc_places')
        .select('id, slug, name, locality, admin1_code, country_code, lat, lng, phone, website, claim_status, demand_score, surface_category_key')
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .limit(limit);

    if (country) query = query.ilike('country_code', country);
    if (region)  query = query.ilike('admin1_code', region);
    if (claimed === 'true') query = query.eq('claim_status', 'claimed');

    // Category filter
    if (category && category !== 'all' && CATEGORY_TO_SURFACE_KEY[category]) {
        query = query.in('surface_category_key', CATEGORY_TO_SURFACE_KEY[category]);
    }

    // Text search
    if (q) {
        query = query.or(`name.ilike.%${q}%,locality.ilike.%${q}%`);
    }

    // Bbox filter using real coordinates
    if (bbox) {
        const [minLng, minLat, maxLng, maxLat] = bbox;
        query = query
            .gte('lat', minLat).lte('lat', maxLat)
            .gte('lng', minLng).lte('lng', maxLng);
    }

    query = query.order('demand_score', { ascending: false, nullsFirst: false });

    const { data, error } = await query;

    if (error) {
        console.error('[directory-pins] hc_places query error:', error.message);
        return NextResponse.json(
            { type: 'FeatureCollection', features: [], error: error.message },
            { status: 500 }
        );
    }

    const records = data ?? [];

    function getTrustBand(demandScore: number, claimStatus: string): string {
        if (!claimStatus || claimStatus === 'unclaimed') return 'unclaimed';
        if (demandScore >= 85) return 'elite';
        if (demandScore >= 65) return 'strong';
        if (demandScore >= 45) return 'watch';
        return 'low';
    }

    const features = records.map((r: any) => {
        const demandScore = Number(r.demand_score ?? 0);
        const isClaimed = r.claim_status && r.claim_status !== 'unclaimed';
        return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [Number(r.lng), Number(r.lat)] },
            properties: {
                id: r.id,
                slug: r.slug,
                name: r.name || 'Unknown',
                entity_type: r.surface_category_key || 'place',
                city: r.locality,
                state: r.admin1_code,
                country: r.country_code,
                claim_status: r.claim_status || 'unclaimed',
                rank_score: demandScore,
                trust_band: getTrustBand(demandScore, r.claim_status),
                is_claimed: isClaimed,
                is_verified: isClaimed,
                sponsor_eligible: demandScore >= 45 && isClaimed,
                phone: r.phone || null,
                website: r.website || null,
            },
        };
    });

    return NextResponse.json(
        { type: 'FeatureCollection', features },
        {
            headers: {
                'Cache-Control': 's-maxage=120, stale-while-revalidate=60',
                'Access-Control-Allow-Origin': '*',
            },
        }
    );
}
