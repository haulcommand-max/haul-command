import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const supabaseAdmin = getSupabaseAdmin();

/**
 * POST /api/adgrid/partner — Register new ad partner
 * GET  /api/adgrid/partner?id=xxx — Get partner dashboard data
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { company_name, contact_email, contact_phone, website_url, partner_type, billing_method, monthly_budget_usd } = body;

        if (!company_name || !contact_email || !partner_type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('hc_ad_campaigns')
            .select('advertiser_id')
            .limit(0);

        if (error) {
            return NextResponse.json({ error: 'AdGrid campaign storage unavailable' }, { status: 503 });
        }

        // Insert into existing advertisers table or create campaign-level entry
        const affiliateCode = `HC-${company_name.replace(/\s+/g, '').substring(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

        // Create a draft campaign intake record; do not treat it as an approved advertiser account.
        const { data: campaign, error: campError } = await supabaseAdmin
            .from('hc_ad_campaigns')
            .insert({
                name: `${company_name} - Self-Service`,
                campaign_type: partner_type === 'sponsor' ? 'sponsorship' : 'awareness',
                status: 'draft',
                billing_model: billing_method || 'cpc',
                bid_amount_cents: 50,
                geo_targets: body.countries || ['US'],
                targeting: {
                    partner_type,
                    company_name,
                    contact_email,
                    contact_phone,
                    website_url,
                    affiliate_code: affiliateCode,
                    monthly_budget_usd: monthly_budget_usd || 500,
                },
            })
            .select('campaign_id')
            .single();

        if (campError) {
            return NextResponse.json({ error: campError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            campaign_id: campaign?.campaign_id,
            advertiser_status: 'pending_review',
            affiliate_code: affiliateCode,
            message: 'Draft campaign intake created. Advertiser account is pending review.',
        });
    } catch (error) {
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const advertiserId = req.nextUrl.searchParams.get('id');
    if (!advertiserId) {
        return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    try {
        const { data, error } = await supabaseAdmin.rpc('get_partner_dashboard', {
            p_advertiser_id: advertiserId,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, dashboard: data });
    } catch {
        return NextResponse.json({ error: 'Dashboard fetch failed' }, { status: 500 });
    }
}
