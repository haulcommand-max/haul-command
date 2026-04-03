import { serveAds, recordImpression } from '@/lib/ads/adrank';
import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';

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
    const id = searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });

    // Fire-and-forget click log
    const supabase = getSupabaseAdmin();
    await supabase.from('ad_click_log').insert({ placement_id: id, clicked_at: new Date().toISOString() });
    return Response.json({ ok: true });
}
