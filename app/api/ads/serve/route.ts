import { serveAds, recordImpression } from '@/lib/ads/adrank';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
    adgridUuidOrNull,
    buildAdgridClickInsert,
    buildAdgridEventInsert,
} from '@/lib/monetization/adgrid-serving';

export const dynamic = 'force-dynamic';

// GET /api/ads/serve?zone=hero_billboard&geo=US&role=pilot_car_operator&limit=3
// Returns ServedAd[] — always returns at least house ads, never empty.
// Called by HeroBillboard, StickyMobileChipRail, and any client ad surface.
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const zone = searchParams.get('zone') ?? searchParams.get('placement') ?? 'hero_billboard';
    const geo = searchParams.get('geo') || undefined;
    const role = searchParams.get('role') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '3'), 10);

    const ads = await serveAds({ zone, geo, role, limit });

    // Fire impression records (best-effort, don't await)
    ads.forEach(ad => {
        recordImpression(ad, { zone, geo, role }).catch(() => {});
    });

    return Response.json(ads, {
        headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    });
}



// Click tracking
export async function POST(req: Request) {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const campaignId = adgridUuidOrNull(
        (body.campaign_id as string | undefined) ?? searchParams.get('campaign_id') ?? searchParams.get('id'),
    );
    if (!campaignId) {
        return Response.json({ recorded: false, reason: 'valid_campaign_id_required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const placementKey = (body.placement_id as string | undefined) ?? searchParams.get('placement') ?? 'legacy_ads_serve';
    const slotId = (body.slot_id as string | undefined) ?? searchParams.get('slot_id') ?? searchParams.get('placement');
    const country = (body.country_code as string | undefined) ?? searchParams.get('country_code') ?? searchParams.get('geo');
    const role = (body.role as string | undefined) ?? searchParams.get('role');

    const click = buildAdgridClickInsert(
        { campaign_id: campaignId, ab_variant: body.variant as string | undefined },
        {
            placementKey,
            country,
            role,
            slotId,
            referrer: req.headers.get('referer'),
        },
    );
    if (click) await supabase.from(click.table).insert(click.payload);

    const event = buildAdgridEventInsert({
        eventType: 'click',
        campaignId,
        slotId,
        surface: placementKey,
        countryCode: country,
        sessionId: (body.session_id as string | undefined) ?? null,
        userAgentSummary: req.headers.get('user-agent')?.slice(0, 180) ?? null,
    });
    await supabase.from(event.table).insert(event.payload);

    return Response.json({ recorded: true });
}
