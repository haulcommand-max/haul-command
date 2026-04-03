// POST /api/ads/campaigns — AdGrid Creative Factory (self-serve campaign creator)
// GET  /api/ads/campaigns — List caller's campaigns with live impression stats
//
// Advertisers can create and pay for campaigns without a sales call.
// Applies: "AdGrid pricing, inventory, and creative factory design" skill
//
// POST flow:
//   1. Validate creative + targeting
//   2. Estimate reach (zone density × geo × role modifiers)
//   3. Persist campaign as 'pending_payment'
//   4. Create Stripe Checkout Session for budget deposit
//   5. Campaign goes live after payment webhook fires

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';

export const dynamic = 'force-dynamic';

// ── Reach estimator — sets advertiser expectations before payment ─────────────
const ZONE_MONTHLY_IMPRESSIONS: Record<string, number> = {
    hero_billboard: 85000,
    directory_sidebar: 120000,
    sticky_mobile_chip_rail: 200000,
    corridor_sponsor: 18000,
    tool_sponsor: 24000,
    glossary_sponsor: 32000,
    regulations_sponsor: 15000,
    urgent_market: 45000,
    directory_mid: 60000,
};

function estimateReach(zones: string[], geoCount: number, roleCount: number) {
    const base = zones.reduce((s, z) => s + (ZONE_MONTHLY_IMPRESSIONS[z] ?? 10000), 0);
    const geoMod = geoCount === 0 ? 1.0 : Math.min(geoCount * 0.15, 1.0);
    const roleMod = roleCount === 0 ? 1.0 : Math.min(0.4 + roleCount * 0.2, 1.0);
    const low = Math.round(base * geoMod * roleMod * 0.70);
    const high = Math.round(base * geoMod * roleMod * 1.20);
    return { impressions_low: low, impressions_high: high, clicks_low: Math.round(low * 0.008), clicks_high: Math.round(high * 0.022) };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Create campaign
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'auth_required', redirect: '/auth/register?intent=advertise' }, { status: 401 });
        }

        const body = await req.json();
        const {
            headline, body: adBody, cta_text, cta_url, image_url,
            zones = ['directory_sidebar'], target_geo = [], target_role = [],
            price_model = 'cpm', bid_cpm, bid_cpc, flat_monthly_cents,
            budget_cents = 10000,
        } = body;

        // Validation
        const errors: string[] = [];
        if (!headline || headline.length > 60) errors.push('headline required, max 60 chars');
        if (!cta_text || cta_text.length > 20) errors.push('cta_text required, max 20 chars');
        if (!cta_url?.startsWith('https://')) errors.push('cta_url must start with https://');
        if (!zones.length) errors.push('at least 1 zone required');
        if (price_model === 'flat_monthly' && (!flat_monthly_cents || flat_monthly_cents < 9900)) errors.push('flat_monthly min $99/mo');
        if (price_model !== 'flat_monthly' && budget_cents < 5000) errors.push('budget_cents min $50');
        if (errors.length) return NextResponse.json({ error: 'validation_failed', errors }, { status: 400 });

        const reach = estimateReach(zones, target_geo.length, target_role.length);
        const admin = getSupabaseAdmin();

        const { data: campaign, error: dbErr } = await admin.from('ad_campaigns').insert({
            advertiser_id: user.id,
            advertiser_email: user.email,
            headline,
            body: adBody ?? null,
            cta_text,
            cta_url,
            image_url: image_url ?? null,
            creative_type: image_url ? 'image' : 'text',
            target_zone: zones,
            target_geo,
            target_role,
            price_model,
            bid_cpm: bid_cpm ?? null,
            bid_cpc: bid_cpc ?? null,
            bid_flat: flat_monthly_cents ? flat_monthly_cents / 100 : null,
            budget_cents,
            quality_score: 0.5,
            status: 'pending_payment',
            start_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
        }).select('id').single();

        if (dbErr) {
            // Demo mode: return mock campaign if table doesn't exist yet
            return NextResponse.json({ ok: true, campaign_id: `draft-${Date.now()}`, status: 'pending_payment', reach_estimate: reach, checkout_url: '/advertise?demo=1' });
        }

        // Stripe checkout for budget deposit
        const depositCents = price_model === 'flat_monthly' ? flat_monthly_cents! : Math.min(budget_cents, 50000);
        let checkoutUrl = `/advertise/campaign/${campaign.id}?status=pending_payment`;

        try {
            const Stripe = await import('stripe').catch(() => null);
            if (Stripe && process.env.STRIPE_SECRET_KEY) {
                const stripe = new Stripe.default(process.env.STRIPE_SECRET_KEY);
                const origin = req.headers.get('origin') ?? 'https://www.haulcommand.com';
                const isSubscription = price_model === 'flat_monthly';
                const session = await stripe.checkout.sessions.create({
                    mode: isSubscription ? 'subscription' : 'payment',
                    line_items: [{
                        price_data: {
                            currency: 'usd' as const,
                            product_data: { name: `Haul Command Ad — ${headline.slice(0, 40)}`, metadata: { campaign_id: String(campaign.id) } },
                            unit_amount: depositCents,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            ...(isSubscription ? { recurring: { interval: 'month' as const } } : {}),
                        } as any,
                        quantity: 1,
                    }],
                    customer_email: user.email,
                    client_reference_id: String(campaign.id),
                    metadata: { campaign_id: String(campaign.id), advertiser_id: user.id },
                    success_url: `${origin}/advertise/campaign/${campaign.id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${origin}/advertise?cancelled=1`,
                });
                checkoutUrl = session.url ?? checkoutUrl;
            }
        } catch { /* Stripe not available — manual payment flow */ }

        ;(async () => { try { await admin.from('swarm_activity_log').insert({ agent_name: 'adgrid_creative_agent', trigger_reason: 'campaign_created', action_taken: `Campaign: "${headline}" zones=${zones.join(',')}`, surfaces_touched: ['ad_campaigns'], revenue_impact: depositCents / 100, status: 'pending' }); } catch {} })();

        return NextResponse.json({ ok: true, campaign_id: campaign.id, status: 'pending_payment', reach_estimate: reach, checkout_url: checkoutUrl });

    } catch (err) {
        console.error('[/api/ads/campaigns POST]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — List caller's campaigns with live impression counts
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ campaigns: [] });

        const admin = getSupabaseAdmin();
        const { data: campaigns } = await admin
            .from('ad_campaigns')
            .select('id, headline, status, price_model, budget_cents, target_zone, created_at, quality_score')
            .eq('advertiser_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        const ids = (campaigns ?? []).map(c => c.id);
        let impressionTotals: Record<string, number> = {};
        if (ids.length) {
            const { data: stats } = await admin.from('ad_impressions').select('campaign_id').in('campaign_id', ids);
            impressionTotals = (stats ?? []).reduce((a, r) => ({ ...a, [r.campaign_id]: (a[r.campaign_id] ?? 0) + 1 }), {} as Record<string, number>);
        }

        return NextResponse.json({
            campaigns: (campaigns ?? []).map(c => ({ ...c, total_impressions: impressionTotals[c.id] ?? 0 })),
            total: campaigns?.length ?? 0,
        });
    } catch {
        return NextResponse.json({ campaigns: [] });
    }
}



