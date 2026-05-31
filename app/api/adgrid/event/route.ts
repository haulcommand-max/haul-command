import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { buildAdgridClickInsert, buildAdgridEventInsert } from '@/lib/monetization/adgrid-serving';

const supabaseAdmin = getSupabaseAdmin();

/**
 * POST /api/adgrid/event
 * Track ad impressions, clicks, conversions
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { campaign_id, advertiser_id, event_type, surface, zone, corridor_code, country_code, session_id, revenue_usd, placement_id, role, variant } = body;

        if (!event_type) {
            return NextResponse.json({ error: 'event_type required' }, { status: 400 });
        }

        const event = buildAdgridEventInsert({
            eventType: event_type,
            campaignId: campaign_id,
            advertiserId: advertiser_id,
            surface,
            zone,
            countryCode: country_code || 'US',
            corridorSlug: corridor_code,
            sessionId: session_id,
            billingAmountCents: revenue_usd ? Math.round(Number(revenue_usd) * 100) : null,
            userAgentSummary: req.headers.get('user-agent')?.slice(0, 180) ?? null,
        });
        const { error } = await supabaseAdmin.from(event.table).insert(event.payload);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if ((event_type === 'click' || event_type === 'sponsor_cta_click') && campaign_id) {
            const click = buildAdgridClickInsert(
                { campaign_id, ab_variant: variant },
                {
                    placementKey: surface || zone || 'unknown',
                    country: country_code || 'US',
                    role,
                    slotId: placement_id,
                    referrer: req.headers.get('referer'),
                },
            );
            if (click) {
                await supabaseAdmin.from(click.table).insert(click.payload);
            }
        }

        // If it's a click, update campaign spend (non-critical)
        if (event_type === 'click' && campaign_id && revenue_usd) {
            try {
                await supabaseAdmin.rpc('increment_campaign_spend', {
                    p_campaign_id: campaign_id,
                    p_amount: revenue_usd,
                });
            } catch {
                // Silently fail — spend tracking is non-critical
            }
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Event tracking failed' }, { status: 500 });
    }
}

/**
 * GET /api/adgrid/event?campaign_id=xxx
 * Get event stats for a campaign
 */
export async function GET(req: NextRequest) {
    const campaignId = req.nextUrl.searchParams.get('campaign_id');
    if (!campaignId) {
        return NextResponse.json({ error: 'campaign_id required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from('hc_adgrid_events')
        .select('event_type, billing_amount_cents, created_at')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(1000);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const stats = {
        impressions: data?.filter(e => e.event_type === 'impression').length || 0,
        clicks: data?.filter(e => e.event_type === 'click').length || 0,
        conversions: data?.filter(e => e.event_type === 'conversion').length || 0,
        total_revenue: (data?.reduce((sum, e) => sum + (e.billing_amount_cents || 0), 0) || 0) / 100,
    };

    return NextResponse.json({ success: true, stats, events: data });
}
