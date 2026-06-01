// app/api/data/buy/route.ts
// Starts a Stripe checkout for data products. Access unlocks through webhook fulfillment.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { DataProductEngine, DATA_PRODUCT_CATALOG, type DataProduct } from '@/lib/monetization/data-product-engine';
import { attributeDataSaleRevenue } from '@/lib/swarm/revenue-attribution';
import { getStripeCheckoutBlockReason } from '@/lib/launch/production-guards';
import { recordCheckoutIntent } from '@/lib/revenue/checkout-intent';
import type { User } from '@supabase/supabase-js';

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll() {},
            },
        },
    );

    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function recordDataProductCheckoutIntent(input: {
    user: User;
    product: DataProduct;
    geo: string;
    stripeSessionId?: string | null;
    checkoutUnavailableReason?: string | null;
}) {
    return recordCheckoutIntent({
        userId: input.user.id,
        userEmail: input.user.email ?? null,
        buyerRole: 'data_buyer',
        productKind: 'data_product',
        productKey: input.product.id,
        priceCents: Math.round(input.product.price_usd * 100),
        currency: 'usd',
        countryCode: input.geo,
        stripeSessionId: input.stripeSessionId ?? null,
        sourcePath: '/api/data/buy',
        recommendation: `Follow up on data product checkout intent for ${input.product.name}.`,
        meta: {
            product_type: input.product.type,
            purchase_type: input.product.purchase_type,
            checkout_unavailable_reason: input.checkoutUnavailableReason ?? null,
        },
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, geo } = body as { productId: string; geo?: string };
        const geoCode = (geo ?? 'US').toUpperCase();

        if (!productId) {
            return NextResponse.json({ error: 'productId required' }, { status: 400 });
        }

        const product = DATA_PRODUCT_CATALOG.find(p => p.id === productId && p.active);
        if (!product) {
            return NextResponse.json({ error: 'Product not found or inactive' }, { status: 404 });
        }

        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({
                error: 'auth_required',
                message: 'Data products require an account so Stripe fulfillment can attach to the right buyer.',
                redirect: '/auth/register?intent=data_purchase&product=' + productId,
            }, { status: 401 });
        }

        attributeDataSaleRevenue(
            'data_product_agent',
            productId,
            product.price_usd,
            geoCode,
        ).catch(() => {});

        if (product.price_usd <= 0) {
            const purchase = await new DataProductEngine(getSupabaseAdmin()).purchaseProduct(
                user.id,
                product.id,
                geoCode,
            );

            if (!purchase.ok) {
                return NextResponse.json({ error: purchase.error }, { status: 400 });
            }

            return NextResponse.json({
                ok: true,
                product: { id: product.id, name: product.name, price_usd: product.price_usd },
                purchase_id: purchase.purchase_id,
                status: 'active',
            });
        }

        const origin = req.headers.get('origin') ?? 'https://www.haulcommand.com';
        const stripeBlockReason = getStripeCheckoutBlockReason();
        if (stripeBlockReason) {
            const checkoutTracking = await recordDataProductCheckoutIntent({
                user,
                product,
                geo: geoCode,
                checkoutUnavailableReason: stripeBlockReason,
            });

            return NextResponse.json({
                ok: false,
                payments_disabled: true,
                product: { id: product.id, name: product.name, price_usd: product.price_usd },
                error: 'Stripe checkout unavailable. No data access was unlocked.',
                reason: stripeBlockReason,
                geo: geoCode,
                checkout_intent_id: checkoutTracking.checkoutIntentId ?? null,
                crm_opportunity_id: checkoutTracking.crmOpportunityId ?? null,
                checkout_tracking_recorded: checkoutTracking.ok,
                checkout_tracking_errors: checkoutTracking.errors,
            }, { status: 503 });
        }

        try {
            const stripe = await import('stripe')
                .then(m => new m.default(process.env.STRIPE_SECRET_KEY!))
                .catch(() => null);

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
                    customer_email: user.email,
                    client_reference_id: user.id,
                    metadata: {
                        type: 'data_purchase',
                        product_id: product.id,
                        geo: geo ?? 'US',
                        user_id: user.id,
                    },
                    success_url: `${origin}/data?purchased=${productId}&session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${origin}/data?cancelled=1`,
                    allow_promotion_codes: true,
                });

                const pendingPurchase = await new DataProductEngine(getSupabaseAdmin()).purchaseProduct(
                    user.id,
                    product.id,
                    geoCode,
                    undefined,
                    session.id,
                );

                if (!pendingPurchase.ok) {
                    return NextResponse.json({ error: pendingPurchase.error }, { status: 400 });
                }

                const checkoutTracking = await recordDataProductCheckoutIntent({
                    user,
                    product,
                    geo: geoCode,
                    stripeSessionId: session.id,
                });
                if (!checkoutTracking.ok) {
                    console.error('[/api/data/buy] Checkout tracking failed:', checkoutTracking.errors);
                }

                return NextResponse.json({
                    ok: true,
                    product: { id: product.id, name: product.name, price_usd: product.price_usd },
                    checkout_url: session.url,
                    session_id: session.id,
                    purchase_id: pendingPurchase.purchase_id,
                    checkout_intent_id: checkoutTracking.checkoutIntentId ?? null,
                    crm_opportunity_id: checkoutTracking.crmOpportunityId ?? null,
                    checkout_tracking_recorded: checkoutTracking.ok,
                    checkout_tracking_errors: checkoutTracking.errors,
                    mode,
                });
            }
        } catch (stripeErr) {
            console.error('[/api/data/buy] Stripe error:', stripeErr);
        }

        const checkoutTracking = await recordDataProductCheckoutIntent({
            user,
            product,
            geo: geoCode,
            checkoutUnavailableReason: 'stripe_unavailable',
        });

        return NextResponse.json({
            ok: false,
            payments_disabled: true,
            product: { id: product.id, name: product.name, price_usd: product.price_usd },
            error: 'Stripe checkout unavailable. No data access was unlocked.',
            reason: 'stripe_unavailable',
            geo: geoCode,
            checkout_intent_id: checkoutTracking.checkoutIntentId ?? null,
            crm_opportunity_id: checkoutTracking.crmOpportunityId ?? null,
            checkout_tracking_recorded: checkoutTracking.ok,
            checkout_tracking_errors: checkoutTracking.errors,
        }, { status: 503 });
    } catch (err) {
        console.error('[/api/data/buy]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

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
