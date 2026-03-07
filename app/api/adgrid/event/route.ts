import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * POST /api/adgrid/event
 * Track ad impressions, clicks, conversions
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { creative_id, campaign_id, advertiser_id, event_type, surface, corridor_code, country_code, operator_id, session_id, revenue_usd } = body;

        if (!event_type) {
            return NextResponse.json({ error: 'event_type required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('hc_ad_events')
            .insert({
                creative_id,
                campaign_id,
                advertiser_id,
                event_type,
                surface: surface || 'unknown',
                corridor_code,
                country_code: country_code || 'US',
                operator_id,
                session_id,
                revenue_usd: revenue_usd || 0,
            });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
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
    } catch (error) {
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
        .from('hc_ad_events')
        .select('event_type, revenue_usd, created_at')
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
        total_revenue: data?.reduce((sum, e) => sum + (e.revenue_usd || 0), 0) || 0,
    };

    return NextResponse.json({ success: true, stats, events: data });
}
