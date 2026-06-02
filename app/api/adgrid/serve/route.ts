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

    const placementKey = buildAdgridPlacementKey({ surface, zone, corridor, country, role });
    const slotId = req.nextUrl.searchParams.get('slot_id');
    const sessionId = req.nextUrl.searchParams.get('session_id');
    const userAgentSummary = req.headers.get('user-agent')?.slice(0, 180) ?? null;
    let supabaseAdmin: ReturnType<typeof getSupabaseAdmin> | null = null;

    function getAdmin() {
        supabaseAdmin ??= getSupabaseAdmin();
        return supabaseAdmin;
    }

    async function recordServeEvent(eventType: 'request' | 'no_fill') {
        const event = buildAdgridEventInsert({
            eventType,
            slotId,
            surface: surface || zone || placementKey,
            zone,
            countryCode: country,
            corridorSlug: corridor,
            sessionId,
            userAgentSummary,
        });
        const { error } = await getAdmin().from(event.table).insert(event.payload);
        return { logged: !error, reason: error?.message ?? null, eventType };
    }

    async function recordServedAd(ad: { campaign_id?: string | null; creative_id?: string | null; ab_variant?: string | null }, source: string) {
        const impression = buildAdgridImpressionInsert(ad, {
            placementKey: pagePath || placementKey,
            country,
            state,
            corridor,
            role,
            slotId,
        });
        if (!impression) return { logged: false, reason: 'missing_campaign_id' };

        const { error: impressionError } = await getAdmin().from(impression.table).insert(impression.payload);
        const event = buildAdgridEventInsert({
            eventType: 'impression',
            campaignId: ad.campaign_id,
            slotId,
            surface: surface || zone || placementKey,
            zone,
            countryCode: country,
            corridorSlug: corridor,
            sessionId,
            userAgentSummary,
        });
        const { error: eventError } = await getAdmin().from(event.table).insert(event.payload);

        return {
            logged: !impressionError && !eventError,
            reason: impressionError?.message || eventError?.message || null,
            source,
        };
    }

    try {
        const requestTracking = await recordServeEvent('request').catch((error) => ({
            logged: false,
            reason: error instanceof Error ? error.message : String(error),
            eventType: 'request' as const,
        }));
        // ── PATH A: legacy RPC approach (strongest — uses bid ranking) ──
        if (surface) {
            const { data, error } = await getAdmin().rpc('serve_adgrid_ad', {
                p_surface: surface,
                p_corridor: corridor,
                p_country: country,
            });

            if (!error && data && Object.keys(data).length > 0) {
                const tracking = await recordServedAd(data, 'adgrid');
                return NextResponse.json({ ad: data, source: 'adgrid', tracking: { ...tracking, request: requestTracking } });
            }
        }

        // ── PATH B: zone-based query (new — for AdGridSlot component) ──
        const { data: creativeRows } = await getAdmin()
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
            return NextResponse.json({ ad, source: 'inventory', tracking: { ...tracking, request: requestTracking } });
        }

        // ── PATH C: no ads available ──
        const noFillTracking = await recordServeEvent('no_fill').catch((error) => ({
            logged: false,
            reason: error instanceof Error ? error.message : String(error),
            eventType: 'no_fill' as const,
        }));
        const houseAd = pickHouseAd({
            surface: surface ?? zone ?? placementKey,
            placementId: placementKey,
            role: role ?? undefined,
        });
        return NextResponse.json({ ad: houseAd, source: 'house', tracking: { request: requestTracking, noFill: noFillTracking, reason: 'house_ad' } });
    } catch {
        const noFillTracking = await recordServeEvent('no_fill').catch((error) => ({
            logged: false,
            reason: error instanceof Error ? error.message : String(error),
            eventType: 'no_fill' as const,
        }));
        const houseAd = pickHouseAd({
            surface: surface ?? zone ?? placementKey,
            placementId: placementKey,
            role: role ?? undefined,
        });
        return NextResponse.json({ ad: houseAd, source: 'house', tracking: { noFill: noFillTracking, reason: 'serve_failed_house_fallback' } });
    }
}
