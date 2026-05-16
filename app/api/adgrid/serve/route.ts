import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { pickHouseAd } from '@/lib/ads/house-ads';

export const dynamic = 'force-dynamic';

/**
 * GET /api/adgrid/serve?surface=directory&corridor=I-10&country=US
 * GET /api/adgrid/serve?zone=homepage_hero&role=pilot
 *
 * Serve paid creatives when present, but never return an empty visual slot.
 */
export async function GET(req: NextRequest) {
    const surface = req.nextUrl.searchParams.get('surface');
    const zone = req.nextUrl.searchParams.get('zone');
    const corridor = req.nextUrl.searchParams.get('corridor');
    const country = req.nextUrl.searchParams.get('country') || 'US';
    const role = req.nextUrl.searchParams.get('role');

    const supabaseAdmin = getSupabaseAdmin();
    const fallback = () =>
        NextResponse.json({
            ad: pickHouseAd({
                surface: surface ?? zone ?? 'adgrid',
                placementId: zone ?? surface ?? 'adgrid-house',
                role: role ?? undefined,
                country,
                corridor: corridor ?? undefined,
                pageType: surface ?? zone ?? 'adgrid',
            }),
            source: 'house',
        });

    try {
        if (surface) {
            const { data, error } = await supabaseAdmin.rpc('serve_adgrid_ad', {
                p_surface: surface,
                p_corridor: corridor,
                p_country: country,
            });

            if (!error && data && Object.keys(data).length > 0) {
                return NextResponse.json({ ad: data, source: 'adgrid' });
            }
        }

        const { data: ads } = await supabaseAdmin
            .from('hc_ad_creatives')
            .select(
                'campaign_id, creative_id, headline, description, body, cta_text, cta_label, cta_url, image_url, image_landscape_url, image_square_url, sponsor_label, advertiser_name, page_types, country_slugs, corridor_slugs, service_slugs, ab_variant',
            )
            .eq('active', true)
            .in('status', ['approved', 'active'])
            .limit(20);

        if (ads && ads.length > 0) {
            const ad = ads[Math.floor(Math.random() * ads.length)];
            return NextResponse.json({ ad, source: 'inventory' });
        }

        return fallback();
    } catch {
        return fallback();
    }
}
