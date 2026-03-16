/**
 * POST /api/sponsor/territory
 * 
 * Purchase a territory sponsorship for a specific country/state/corridor.
 * Creates a Stripe checkout session for the sponsorship.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';


const TERRITORY_PLANS = {
    state: {
        name: 'State Sponsorship',
        price_monthly: 199,
        features: ['Top banner on state page', 'Featured in state search results', 'Monthly performance report'],
    },
    corridor: {
        name: 'Corridor Sponsorship',
        price_monthly: 149,
        features: ['Corridor page banner', 'Featured in corridor listings', 'Demand alert reports'],
    },
    city: {
        name: 'City Sponsorship',
        price_monthly: 79,
        features: ['City page placement', 'Local search priority', 'Weekly traffic report'],
    },
    country: {
        name: 'Country Sponsorship',
        price_monthly: 499,
        features: ['Country page hero', 'All state/city pages sidebar', 'Premium analytics', 'Dedicated support'],
    },
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as {
            territory_type: keyof typeof TERRITORY_PLANS;
            territory_value: string;
            sponsor_id?: string;
            company_name: string;
            email: string;
        };

        const { territory_type, territory_value, company_name, email } = body;

        if (!territory_type || !territory_value || !company_name || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const plan = TERRITORY_PLANS[territory_type];
        if (!plan) {
            return NextResponse.json({ error: 'Invalid territory type' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Check if territory is already sponsored
        const { data: existing } = await supabase
            .from('territory_sponsorships')
            .select('id, sponsor_company')
            .eq('territory_type', territory_type)
            .eq('territory_value', territory_value)
            .eq('status', 'active')
            .maybeSingle();

        if (existing) {
            return NextResponse.json({
                error: 'Territory already sponsored',
                current_sponsor: existing.sponsor_company,
                suggestion: 'Try a nearby territory or join the waitlist',
            }, { status: 409 });
        }

        // Create Stripe checkout
        let checkoutUrl = `/sponsor/success?territory=${territory_type}&value=${territory_value}`;

        if (process.env.STRIPE_SECRET_KEY) {
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                customer_email: email,
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${plan.name}: ${territory_value}`,
                            description: plan.features.join(' · '),
                            metadata: { territory_type, territory_value },
                        },
                        unit_amount: plan.price_monthly * 100,
                        recurring: { interval: 'month' },
                    },
                    quantity: 1,
                }],
                metadata: {
                    type: 'territory_sponsorship',
                    territory_type,
                    territory_value,
                    company_name,
                },
                success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sponsor/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sponsor/checkout`,
            });

            checkoutUrl = session.url;
        }

        // Record the pending sponsorship
        await supabase.from('territory_sponsorships').insert({
            territory_type,
            territory_value,
            sponsor_company: company_name,
            sponsor_email: email,
            plan_price_monthly: plan.price_monthly,
            status: 'pending',
            created_at: new Date().toISOString(),
        });

        return NextResponse.json({
            ok: true,
            checkoutUrl,
            plan: {
                name: plan.name,
                price: `$${plan.price_monthly}/mo`,
                features: plan.features,
                territory: `${territory_type}: ${territory_value}`,
            },
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * GET /api/sponsor/territory?type=state&value=TX
 * Check territory availability and pricing
 */
export async function GET(req: NextRequest) {
    const type = req.nextUrl.searchParams.get('type') as keyof typeof TERRITORY_PLANS;
    const value = req.nextUrl.searchParams.get('value');

    if (!type || !value) {
        return NextResponse.json({ error: 'type and value params required' }, { status: 400 });
    }

    const plan = TERRITORY_PLANS[type];
    if (!plan) {
        return NextResponse.json({ error: 'Invalid territory type' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase
        .from('territory_sponsorships')
        .select('sponsor_company, status')
        .eq('territory_type', type)
        .eq('territory_value', value)
        .eq('status', 'active')
        .maybeSingle();

    return NextResponse.json({
        territory: { type, value },
        available: !existing,
        current_sponsor: existing?.sponsor_company || null,
        plan: {
            name: plan.name,
            price_monthly: plan.price_monthly,
            features: plan.features,
        },
    }, {
        headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    });
}
