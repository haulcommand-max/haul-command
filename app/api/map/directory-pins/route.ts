export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );
}

/**
 * GET /api/map/directory-pins
 * Returns GeoJSON FeatureCollection from directory_listings for the map view.
 * Supports filtering by entity_type, region, country, text search.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country');
    const region = searchParams.get('region');
    const category = searchParams.get('category');
    const q = searchParams.get('q');
    const limit = Math.min(Number(searchParams.get('limit') ?? 1500), 3000);
    const claimed = searchParams.get('claimed');

    const supabase = getSupabase();

    // Map UI category keys to entity_type values
    const CATEGORY_MAP: Record<string, string[]> = {
        pilot_car: ['pilot_car_operator', 'pilot_driver'],
        truck_stop: ['truck_stop'],
        port: ['port', 'port_infrastructure', 'seaport'],
        terminal: ['terminal', 'intermodal_rail_yard'],
        hotel: ['hotel', 'support_hotel'],
        high_pole: ['pilot_car_operator'], // filter by metadata later
        twic: ['pilot_car_operator'],      // filter by metadata later
    };

    let query = supabase
        .from('directory_listings')
        .select('id, name, slug, entity_type, city, city_slug, region_code, country_code, latitude, longitude, claim_status, rank_score, metadata, profile_completeness')
        .eq('is_visible', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(limit);

    if (country) query = query.ilike('country_code', country);
    if (region) query = query.ilike('region_code', region);
    if (claimed === 'true') query = query.neq('claim_status', 'unclaimed');

    // Category filter (entity_type-based)
    if (category && category !== 'all' && CATEGORY_MAP[category]) {
        query = query.in('entity_type', CATEGORY_MAP[category]);
    }

    // Text search
    if (q) {
        query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%`);
    }

    // Sort by rank_score descending for best results first
    query = query.order('rank_score', { ascending: false, nullsFirst: false });

    const { data, error } = await query;

    if (error) {
        console.error('[directory-pins] Query error:', error.message);
        return NextResponse.json(
            { type: 'FeatureCollection', features: [], error: error.message },
            { status: 500 }
        );
    }

    const records = data ?? [];

    // Optional: metadata-based filtering for high_pole/twic
    let filtered = records;
    if (category === 'high_pole') {
        filtered = records.filter((r: any) => {
            const meta = r.metadata || {};
            return meta.has_high_pole || meta.high_pole || meta.equipment_tags?.includes('high_pole');
        });
    } else if (category === 'twic') {
        filtered = records.filter((r: any) => {
            const meta = r.metadata || {};
            return meta.twic || meta.twic_on_file || meta.certifications?.includes('twic');
        });
    }

    const features = filtered.map((r: any) => {
        const meta = r.metadata || {};
        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [r.longitude, r.latitude],
            },
            properties: {
                id: r.id,
                slug: r.slug,
                name: r.name || 'Unknown',
                entity_type: r.entity_type,
                city: r.city,
                state: r.region_code,
                country: r.country_code,
                claim_status: r.claim_status,
                rank_score: r.rank_score ?? 0,
                completeness: r.profile_completeness ?? 0,
                // Extracted from metadata where available
                phone: meta.phone || null,
                verified: r.claim_status === 'claimed' || r.claim_status === 'verified',
                has_high_pole: meta.has_high_pole || meta.high_pole || false,
                twic: meta.twic || meta.twic_on_file || false,
                rating: meta.rating || meta.rating_score || 0,
                review_count: meta.review_count || 0,
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
