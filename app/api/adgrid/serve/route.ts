import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
    buildAdgridImpressionInsert,
    buildAdgridPlacementKey,
    buildAdgridEventInsert,
    creativeMatchesAdgridContext,
    normalizeAdgridCreative,
} from '@/lib/monetization/adgrid-serving';
import { pickHouseAd } from '@/lib/ads/house-ads';

export const dynamic = 'force-dynamic';

/**
 * GET /api/adgrid/serve?surface=directory&corridor=I-10&country=US
 *   — Legacy: serve via DB RPC (serve_adgrid_ad)
 * GET /api/adgrid/serve?zone=homepage_hero&role=pilot
 *   — New: serve from hc_adgrid_inventory by zone + optional role targeting
 *
 * Merged route: tries RPC first (stronger), falls back to direct query.
 */
export async function GET(req: NextRequest) {
    const surface = req.nextUrl.searchParams.get('surface');
    const zone = req.nextUrl.searchParams.get('zone');
    const corridor = req.nextUrl.searchParams.get('corridor');
    const country = req.nextUrl.searchParams.get('country') || 'US';
    const state = req.nextUrl.searchParams.get('state');
    const role = req.nextUrl.searchParams.get('role');
    const pagePath = req.nextUrl.searchParams.get('page_path') || req.nextUrl.searchParams.get('path');

    const supabaseAdmin = getSupabaseAdmin();
    const placementKey = buildAdgridPlacementKey({ surface, zone, corridor, country, role });

    async function recordServedAd(ad: { campaign_id?: string | null; creative_id?: string | null; ab_variant?: string | null }, source: string) {
        const impression = buildAdgridImpressionInsert(ad, {
            placementKey: pagePath || placementKey,
            country,
            state,
            corridor,
            role,
        });
        if (!impression) return { logged: false, reason: 'missing_campaign_id' };

        const { error: impressionError } = await supabaseAdmin.from(impression.table).insert(impression.payload);
        const event = buildAdgridEventInsert({
            eventType: 'impression',
            campaignId: ad.campaign_id,
            surface: surface || zone || placementKey,
            zone,
            countryCode: country,
            corridorSlug: corridor,
            sessionId: req.nextUrl.searchParams.get('session_id'),
            userAgentSummary: req.headers.get('user-agent')?.slice(0, 180) ?? null,
        });
        const { error: eventError } = await supabaseAdmin.from(event.table).insert(event.payload);

        return {
            logged: !impressionError && !eventError,
            reason: impressionError?.message || eventError?.message || null,
            source,
        };
    }

    try {
        // ── PATH A: legacy RPC approach (strongest — uses bid ranking) ──
        if (surface) {
            const { data, error } = await supabaseAdmin.rpc('serve_adgrid_ad', {
                p_surface: surface,
                p_corridor: corridor,
                p_country: country,
            });

            if (!error && data && Object.keys(data).length > 0) {
                const tracking = await recordServedAd(data, 'adgrid');
                return NextResponse.json({ ad: data, source: 'adgrid', tracking });
            }
        }

        // ── PATH B: zone-based query (new — for AdGridSlot component) ──
        const { data: creativeRows } = await supabaseAdmin
            .from('hc_ad_creatives')
            .select(
                'campaign_id, creative_id, headline, description, body, subhead, cta_text, cta_label, cta_url, image_url, image_landscape_url, image_square_url, sponsor_label, advertiser_name, page_types, country_slugs, corridor_slugs, service_slugs, ab_variant',
            )
            .eq('active', true)
            .in('status', ['approved', 'active'])
            .limit(20);

        const ads = (creativeRows ?? [])
            .map(normalizeAdgridCreative)
            .filter((creative) => creativeMatchesAdgridContext(creative, { surface, zone, corridor, country, role }));

        if (ads.length > 0) {
            const ad = ads[Math.floor(Math.random() * ads.length)];
            const tracking = await recordServedAd(ad, 'inventory');
            return NextResponse.json({ ad, source: 'inventory', tracking });
        }

        // ── PATH C: no ads available ──
        const houseAd = pickHouseAd({
            surface: surface ?? zone ?? placementKey,
            placementId: placementKey,
            role: role ?? undefined,
        });
        return NextResponse.json({ ad: houseAd, source: 'house', tracking: { logged: false, reason: 'house_ad' } });
    } catch {
        const houseAd = pickHouseAd({
            surface: surface ?? zone ?? placementKey,
            placementId: placementKey,
            role: role ?? undefined,
        });
        return NextResponse.json({ ad: houseAd, source: 'house', tracking: { logged: false, reason: 'serve_failed_house_fallback' } });
    }
}
