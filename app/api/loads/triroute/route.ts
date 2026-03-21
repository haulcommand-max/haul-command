/**
 * GET /api/loads/triroute?load_id=X
 *
 * Haul Command — TriRoute Anti-Deadhead Engine
 *
 * Given a load, finds compatible return/triangle loads near the delivery point.
 * Uses PostGIS spatial queries + corridor intelligence for scoring.
 *
 * Query params:
 *   load_id:       UUID of the current load (required)
 *   radius_miles:  Search radius from delivery point (default: 75, max: 200)
 *   days_ahead:    How many days ahead to search (default: 5, max: 14)
 *   limit:         Max results (default: 5, max: 20)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { calculateDeadheadProfit } from '@/core/calculators/deadhead';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const loadId = searchParams.get('load_id');
        const radiusMiles = Math.min(parseInt(searchParams.get('radius_miles') || '75'), 200);
        const daysAhead = Math.min(parseInt(searchParams.get('days_ahead') || '5'), 14);
        const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20);

        if (!loadId) {
            return NextResponse.json(
                { error: 'Missing required param: load_id' },
                { status: 400 },
            );
        }

        // ── 1. Get the reference load ──
        const { data: refLoad, error: loadError } = await supabase
            .from('lb_observations')
            .select(`
                id, destination_city, destination_admin_division,
                destination_geom, origin_city, origin_admin_division,
                corridor_key, service_type, quoted_amount,
                derived_pay_per_mile, observed_date, country_code
            `)
            .eq('id', loadId)
            .single();

        if (loadError || !refLoad) {
            return NextResponse.json(
                { error: 'Load not found' },
                { status: 404 },
            );
        }

        // ── 2. Extract delivery coordinates ──
        // If we have destination_geom, extract lat/lng. Otherwise, try geocoding.
        let deliveryLat: number | null = null;
        let deliveryLng: number | null = null;

        if (refLoad.destination_geom) {
            // PostGIS geometry — extract coordinates via RPC or parse
            const { data: coords } = await supabase.rpc('extract_point_coords', {
                p_geom: refLoad.destination_geom,
            }).single();

            const c = coords as { lat: number; lng: number } | null;
            if (c) {
                deliveryLat = c.lat;
                deliveryLng = c.lng;
            }
        }

        // Fallback: use corridor lookup + state centroid approximation
        if (deliveryLat === null || deliveryLng === null) {
            const centroid = getStateCentroid(refLoad.destination_admin_division);
            if (centroid) {
                deliveryLat = centroid.lat;
                deliveryLng = centroid.lng;
            }
        }

        if (deliveryLat === null || deliveryLng === null) {
            return NextResponse.json({
                status: 'ok',
                load_id: loadId,
                suggestions: [],
                message: 'No geolocation data available for delivery point. TriRoute suggestions unavailable.',
            });
        }

        // ── 3. Call PostGIS spatial search ──
        const departAfter = new Date().toISOString().split('T')[0];
        const departBefore = new Date(Date.now() + daysAhead * 86400000).toISOString().split('T')[0];

        const { data: matches, error: matchError } = await supabase.rpc('find_triroute_matches', {
            p_delivery_lat: deliveryLat,
            p_delivery_lng: deliveryLng,
            p_radius_miles: radiusMiles,
            p_depart_after: departAfter,
            p_depart_before: departBefore,
            p_exclude_id: loadId,
            p_limit: limit,
        });

        if (matchError) {
            console.error('[TriRoute] PostGIS query error:', matchError);
            return NextResponse.json(
                { error: 'TriRoute search failed' },
                { status: 500 },
            );
        }

        // ── 4. Enrich results with deadhead profit calculations ──
        const suggestions = (matches || []).map((m: any) => {
            const deadheadMiles = m.deadhead_miles || 0;
            const paidRate = m.derived_ppm || (m.quoted_amount ? m.quoted_amount / 300 : 1.75); // fallback estimate
            const paidMiles = 300; // average corridor distance estimate

            const profitCalc = calculateDeadheadProfit({
                paidRate,
                paidMiles,
                deadheadMiles,
                mpg: 12,
                fuelCost: 3.50,
                dailyOpCost: 150,
            });

            return {
                load_id: m.load_id,
                route: {
                    origin: `${m.origin_city || '?'}, ${m.origin_admin || '?'}`,
                    destination: `${m.dest_city || '?'}, ${m.dest_admin || '?'}`,
                },
                corridor: m.corridor_key,
                service_type: m.service_type,
                deadhead_miles: Math.round(deadheadMiles),
                rate: {
                    quoted_amount: m.quoted_amount,
                    per_mile: m.derived_ppm,
                },
                observed_date: m.observed_date,
                match_score: m.match_score,
                profit_estimate: {
                    gross_revenue: profitCalc.grossRevenue,
                    total_expense: profitCalc.totalExpense,
                    net_profit: profitCalc.netProfit,
                    real_rate_per_mile: profitCalc.realRatePerMile,
                    is_profitable: profitCalc.isProfitable,
                },
                badge: deadheadMiles < 25 ? 'PRIME_TRIROUTE'
                    : deadheadMiles < 50 ? 'STRONG_MATCH'
                    : 'VIABLE_RETURN',
            };
        });

        // ── 5. Calculate savings summary ──
        const totalDeadheadSaved = suggestions.reduce(
            (sum: number, s: any) => sum + Math.max(0, radiusMiles - s.deadhead_miles), 0,
        );

        return NextResponse.json({
            status: 'ok',
            load_id: loadId,
            reference_load: {
                origin: `${refLoad.origin_city || '?'}, ${refLoad.origin_admin_division || '?'}`,
                destination: `${refLoad.destination_city || '?'}, ${refLoad.destination_admin_division || '?'}`,
                corridor: refLoad.corridor_key,
            },
            search_params: {
                delivery_lat: deliveryLat,
                delivery_lng: deliveryLng,
                radius_miles: radiusMiles,
                days_ahead: daysAhead,
            },
            suggestions,
            summary: {
                total_matches: suggestions.length,
                avg_deadhead_miles: suggestions.length > 0
                    ? Math.round(suggestions.reduce((s: number, m: any) => s + m.deadhead_miles, 0) / suggestions.length)
                    : null,
                best_deadhead_miles: suggestions.length > 0
                    ? Math.min(...suggestions.map((s: any) => s.deadhead_miles))
                    : null,
                prime_matches: suggestions.filter((s: any) => s.badge === 'PRIME_TRIROUTE').length,
                estimated_savings_miles: totalDeadheadSaved,
            },
        });

    } catch (error: any) {
        console.error('[TriRoute] Unhandled error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

// ── State centroid lookup (US states) for fallback geocoding ──
function getStateCentroid(admin: string | null): { lat: number; lng: number } | null {
    if (!admin) return null;
    const centroids: Record<string, { lat: number; lng: number }> = {
        'AL': { lat: 32.806671, lng: -86.791130 }, 'AK': { lat: 61.370716, lng: -152.404419 },
        'AZ': { lat: 33.729759, lng: -111.431221 }, 'AR': { lat: 34.969704, lng: -92.373123 },
        'CA': { lat: 36.116203, lng: -119.681564 }, 'CO': { lat: 39.059811, lng: -105.311104 },
        'CT': { lat: 41.597782, lng: -72.755371 }, 'DE': { lat: 39.318523, lng: -75.507141 },
        'FL': { lat: 27.766279, lng: -81.686783 }, 'GA': { lat: 33.040619, lng: -83.643074 },
        'HI': { lat: 21.094318, lng: -157.498337 }, 'ID': { lat: 44.240459, lng: -114.478828 },
        'IL': { lat: 40.349457, lng: -88.986137 }, 'IN': { lat: 39.849426, lng: -86.258278 },
        'IA': { lat: 42.011539, lng: -93.210526 }, 'KS': { lat: 38.526600, lng: -96.726486 },
        'KY': { lat: 37.668140, lng: -84.670067 }, 'LA': { lat: 31.169546, lng: -91.867805 },
        'ME': { lat: 44.693947, lng: -69.381927 }, 'MD': { lat: 39.063946, lng: -76.802101 },
        'MA': { lat: 42.230171, lng: -71.530106 }, 'MI': { lat: 43.326618, lng: -84.536095 },
        'MN': { lat: 45.694454, lng: -93.900192 }, 'MS': { lat: 32.741646, lng: -89.678696 },
        'MO': { lat: 38.456085, lng: -92.288368 }, 'MT': { lat: 46.921925, lng: -110.454353 },
        'NE': { lat: 41.125370, lng: -98.268082 }, 'NV': { lat: 38.313515, lng: -117.055374 },
        'NH': { lat: 43.452492, lng: -71.563896 }, 'NJ': { lat: 40.298904, lng: -74.521011 },
        'NM': { lat: 34.840515, lng: -106.248482 }, 'NY': { lat: 42.165726, lng: -74.948051 },
        'NC': { lat: 35.630066, lng: -79.806419 }, 'ND': { lat: 47.528912, lng: -99.784012 },
        'OH': { lat: 40.388783, lng: -82.764915 }, 'OK': { lat: 35.565342, lng: -96.928917 },
        'OR': { lat: 44.572021, lng: -122.070938 }, 'PA': { lat: 40.590752, lng: -77.209755 },
        'RI': { lat: 41.680893, lng: -71.511780 }, 'SC': { lat: 33.856892, lng: -80.945007 },
        'SD': { lat: 44.299782, lng: -99.438828 }, 'TN': { lat: 35.747845, lng: -86.692345 },
        'TX': { lat: 31.054487, lng: -97.563461 }, 'UT': { lat: 40.150032, lng: -111.862434 },
        'VT': { lat: 44.045876, lng: -72.710686 }, 'VA': { lat: 37.769337, lng: -78.169968 },
        'WA': { lat: 47.400902, lng: -121.490494 }, 'WV': { lat: 38.491226, lng: -80.954456 },
        'WI': { lat: 44.268543, lng: -89.616508 }, 'WY': { lat: 42.755966, lng: -107.302490 },
        'DC': { lat: 38.897438, lng: -77.026817 },
        // Canadian provinces
        'ON': { lat: 51.253775, lng: -85.323214 }, 'QC': { lat: 52.939916, lng: -73.549136 },
        'BC': { lat: 53.726669, lng: -127.647621 }, 'AB': { lat: 53.933271, lng: -116.576504 },
        'SK': { lat: 52.939916, lng: -106.450864 }, 'MB': { lat: 53.760861, lng: -98.813873 },
    };
    const key = admin.toUpperCase().trim();
    return centroids[key] || null;
}
