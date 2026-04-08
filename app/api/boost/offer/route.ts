// app/api/boost/offer/route.ts
// GET /api/boost/offer?placeId=...&countryCode=US
//
// Activates the dormant profile-boost-engine.ts
// Returns a full BoostOffer for a given place — tiered pricing, claim CTA,
// competitor pressure, estimated ROI. Used by:
//   - Directory listing cards (claim pressure)
//   - Profile pages (upgrade prompt)
//   - Dashboard (boost up-sell)
//   - AdGrid targeting (boost-eligible surfaces)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';
import { buildBoostOffer, generateClaimCTA, getBoostPricing } from '@/lib/platform/profile-boost-engine';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const placeId = req.nextUrl.searchParams.get('placeId');
    const countryCode = req.nextUrl.searchParams.get('countryCode') ?? 'US';
    const city = req.nextUrl.searchParams.get('city') ?? undefined;

    if (!placeId) {
        // No placeId — return pricing table for the given country
        const pricing = getBoostPricing(countryCode);
        return NextResponse.json({ pricing, countryCode }, {
            headers: { 'Cache-Control': 'public, s-maxage=3600' },
        });
    }

    try {
        const admin = getSupabaseAdmin();

        // Fetch the place
        const { data: place } = await admin
            .from('hc_places')
            .select('id, name, type, city, state, country_code, is_claimed, boost_tier, visit_count_30d, trust_score')
            .eq('id', placeId)
            .maybeSingle();

        if (!place) {
            return NextResponse.json({ error: 'Place not found' }, { status: 404 });
        }

        // Count competitors in same city + type
        const { count: competitorsInArea } = await admin
            .from('hc_places')
            .select('id', { count: 'exact', head: true })
            .eq('city', place.city ?? '')
            .eq('type', place.type ?? '')
            .neq('id', placeId);

        const { count: competitorsVerified } = await admin
            .from('hc_places')
            .select('id', { count: 'exact', head: true })
            .eq('city', place.city ?? '')
            .eq('type', place.type ?? '')
            .eq('is_claimed', true)
            .neq('id', placeId);

        // Build full offer
        const dynamicHeat = Math.min(0.98, 0.45 + ((competitorsInArea ?? 0) * 0.03));
        
        const offer = buildBoostOffer({
            placeId: place.id,
            placeName: place.name ?? 'Your Business',
            placeType: place.type ?? 'escort_service',
            countryCode: place.country_code ?? countryCode,
            city: place.city ?? city,
            currentTier: (place.boost_tier as 'free' | 'verified' | 'premium' | 'featured' | 'dominant') ?? 'free',
            monthlyViews: place.visit_count_30d ?? 0,
            competitorsInArea: competitorsInArea ?? 0,
            competitorsVerified: competitorsVerified ?? 0,
            corridorHeat: dynamicHeat, // Generated dynamically based on market density
        });

        return NextResponse.json(offer, {
            headers: { 'Cache-Control': 'private, s-maxage=300' },
        });

    } catch (err) {
        console.error('[/api/boost/offer]', err);
        // Return static pricing on DB error so page still renders
        return NextResponse.json({
            error: 'db_unavailable',
            localPricing: getBoostPricing(countryCode),
            claimCTA: generateClaimCTA({
                placeName: 'Your Business',
                placeType: 'escort_service',
                countryCode,
                city,
                monthlyViews: 0,
                competitorsInArea: 0,
                competitorsVerified: 0,
                corridorHeat: 0,
            }),
        }, { status: 206 });
    }
}
