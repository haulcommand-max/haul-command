export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const placement = searchParams.get('placement') || 'default';
    const geo = searchParams.get('geo') || '';
    const page = searchParams.get('page') || '';
    const format = searchParams.get('format') || 'banner';

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Try RTB edge function first, fall back to featured placements
    try {
        const rtbUrl = `${process.env.SUPABASE_URL}/functions/v1/rtb-ad-serve`;
        const rtbRes = await fetch(rtbUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ placement, geo, page, format }),
        });

        if (rtbRes.ok) {
            const rtbData = await rtbRes.json();
            if (rtbData?.creative_url) {
                return Response.json(rtbData);
            }
        }
    } catch {
        // RTB failed, fall back
    }

    // Fallback: fetch active featured placement
    const { data } = await supabase
        .from('featured_placements')
        .select('id, creative_url, click_url, sponsor_name, format')
        .eq('active', true)
        .eq('placement_key', placement)
        .limit(1)
        .maybeSingle();

    if (data) return Response.json(data);
    return Response.json(null);
}

// Click tracking
export async function POST(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });

    // Fire-and-forget click log
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    await supabase.from('ad_click_log').insert({ placement_id: id, clicked_at: new Date().toISOString() });
    return Response.json({ ok: true });
}
