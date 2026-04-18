// app/api/data/buy/route.ts
// POST /api/data/buy
// Handles data product purchase initiation + revenue attribution
//
// Flow:
//  1. Validate productId + user session
//  2. Initiate Stripe checkout (or redirect to Stripe)
//  3. Attribute revenue to data_product_agent
//  4. Return checkout URL or success

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DATA_PRODUCT_CATALOG } from '@/lib/monetization/data-product-engine';
import { attributeDataSaleRevenue } from '@/lib/swarm/revenue-attribution';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, geo } = body as { productId: string; geo?: string };

        if (!productId) {
            return NextResponse.json({ error: 'productId required' }, { status: 400 });
        }

        // Find product in catalog
        const product = DATA_PRODUCT_CATALOG.find(p => p.id === productId && p.active);
        if (!product) {
            return NextResponse.json({ error: 'Product not found or inactive' }, { status: 404 });
        }

        // Get user session (optional — some products allow anonymous purchase)
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // For enterprise tier, require auth
        if (product.tier_required === 'enterprise' && !user) {
            return NextResponse.json({
                error: 'auth_required',
                message: 'Enterprise products require an account. Please sign in or register.',
                redirect: '/auth/register?intent=data_purchase&product=' + productId,
            }, { status: 401 });
        }

        // ── Revenue Attribution (fire-and-forget) ──
        // Attribute to data_product_agent regardless of whether payment completes
        // (tracks intent; actual completion tracked via Stripe webhook)
        attributeDataSaleRevenue(
            'data_product_agent',
            productId,
            product.price_usd,
            'US'
        ).catch(() => {});

        // ── Stripe Checkout Session ──
        // STRIPE_SECRET_KEY is in .env.local — sk_test_ is live
        const origin = req.headers.get('origin') ?? 'https://www.haulcommand.com';

        try {
            const stripe = await import('stripe').then(m => new m.default(process.env.STRIPE_SECRET_KEY!)).catch(() => null);

            if (stripe) {
                const mode = product.purchase_type === 'subscription' ? 'subscription' : 'payment';
                const session = await stripe.checkout.sessions.create({
                    mode,
                    line_items: [{
                        price_data: {
                            currency: 'usd' as const,
                            product_data: {
                                name: product.name,
                                description: product.description,
                                metadata: { product_id: product.id, geo: geo ?? 'US' },
                            },
                            unit_amount: Math.round(product.price_usd * 100),
                            ...(mode === 'subscription' ? { recurring: { interval: 'month' as const } } : {}),
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } as any,
                        quantity: 1,
                    }],

                    customer_email: user?.email,
                    client_reference_id: user?.id ?? `anon-${Date.now()}`,
                    metadata: { product_id: product.id, geo: geo ?? 'US', user_id: user?.id ?? '' },
                    success_url: `${origin}/data/purchase-success?product=${productId}&session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${origin}/data?cancelled=1`,
                    allow_promotion_codes: true,
                });

                return NextResponse.json({
                    ok: true,
                    product: { id: product.id, name: product.name, price_usd: product.price_usd },
                    checkout_url: session.url,
                    session_id: session.id,
                    mode,
                });
            }
        } catch (stripeErr) {
            console.error('[/api/data/buy] Stripe error:', stripeErr);
            // Fall through to stub response
        }

        // Fallback: Stripe package not installed — return stub + install instructions
        // Run: npm install stripe
        return NextResponse.json({
            ok: true,
            product: { id: product.id, name: product.name, price_usd: product.price_usd },
            checkout_url: `/checkout?product=${productId}&price=${product.price_usd}`,
            checkout_stub: true,
            install_hint: 'Run: npm install stripe  (STRIPE_SECRET_KEY is already configured)',
            user_id: user?.id ?? null,
            geo: geo ?? 'US',
        });
    } catch (err) {
        console.error('[/api/data/buy]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}


// GET /api/data/buy — return available products for a given role/tier
export async function GET(req: NextRequest) {
    const tier = req.nextUrl.searchParams.get('tier') ?? 'free';
    const geo = req.nextUrl.searchParams.get('geo') ?? 'US';

    const available = DATA_PRODUCT_CATALOG.filter(p => {
        if (!p.active) return false;
        if (tier === 'enterprise') return true;
        if (tier === 'pro' && p.tier_required !== 'enterprise') return true;
        return p.tier_required === 'free';
    });

    return NextResponse.json({
        products: available.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price_usd: p.price_usd,
            purchase_type: p.purchase_type,
            preview_fields: p.preview_fields,
            locked_field_count: p.full_fields.length - p.preview_fields.length,
            geo,
        })),
        total: available.length,
    }, {
        headers: { 'Cache-Control': 'public, s-maxage=60' },
    });
}
