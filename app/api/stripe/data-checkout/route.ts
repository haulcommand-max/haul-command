/**
 * POST /api/stripe/data-checkout
 *
 * Creates a Stripe Checkout session for authenticated data product purchases.
 * Fulfillment is tied to a pending data_purchases row before Stripe redirects.
 *
 * Body: { product_id, country_code?, corridor_code?, success_url?, cancel_url? }
 * Returns: { url: string, session_id: string, purchase_id: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createServerComponentClient } from '@/lib/supabase/server-auth';
import { getStripeCheckoutBlockReason } from '@/lib/launch/production-guards';
import { DATA_PRODUCT_CATALOG, type DataProduct } from '@/lib/monetization/data-product-engine';
import { recordCheckoutIntent } from '@/lib/revenue/checkout-intent';

function buildLineItem(product: DataProduct): Stripe.Checkout.SessionCreateParams.LineItem {
    return {
        price_data: {
            currency: 'usd',
            unit_amount: Math.round(product.price_usd * 100),
            product_data: {
                name: product.name,
                description: product.description.slice(0, 200),
                metadata: {
                    product_id: product.id,
                    product_type: product.type,
                },
            },
            ...(product.purchase_type === 'subscription'
                ? { recurring: { interval: 'month' as const } }
                : {}),
        },
        quantity: 1,
    };
}

function normalizeCountryCode(value: unknown) {
    const normalized = String(value || 'ALL').trim().toUpperCase();
    return normalized === 'ALL' || /^[A-Z]{2}$/.test(normalized) ? normalized : 'ALL';
}

function normalizeCorridorCode(value: unknown) {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized ? normalized.replace(/[^a-z0-9-]+/g, '-').slice(0, 120) : null;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { product_id, success_url, cancel_url } = body as {
            product_id?: string;
            country_code?: string;
            corridor_code?: string;
            success_url?: string;
            cancel_url?: string;
        };

        if (!product_id) {
            return NextResponse.json({ error: 'Missing product_id' }, { status: 400 });
        }

        const product = DATA_PRODUCT_CATALOG.find(p => p.id === product_id && p.active);
        if (!product) {
            return NextResponse.json({ error: 'Product not found or inactive' }, { status: 404 });
        }

        if (product.price_usd === 0) {
            return NextResponse.json({ error: 'This product is free - no checkout needed' }, { status: 400 });
        }

        const authClient = createServerComponentClient();
        const { data: { user } } = await authClient.auth.getUser();
        if (!user) {
            return NextResponse.json({
                error: 'auth_required',
                message: 'Sign in to buy data products so fulfillment and receipts attach to your account.',
                redirect: `/login?intent=data_purchase&product=${encodeURIComponent(product.id)}`,
            }, { status: 401 });
        }

        const countryCode = normalizeCountryCode(body.country_code);
        const corridorCode = normalizeCorridorCode(body.corridor_code);
        const admin = getSupabaseAdmin();
        const blockReason = getStripeCheckoutBlockReason();
        if (blockReason) {
            const checkoutTracking = await recordCheckoutIntent({
                userId: user.id,
                userEmail: user.email ?? null,
                buyerRole: 'data_buyer',
                productKind: 'data_product',
                productKey: product.id,
                priceCents: Math.round(product.price_usd * 100),
                currency: 'usd',
                countryCode,
                targetCorridorKey: corridorCode,
                sourcePath: '/api/stripe/data-checkout',
                recommendation: `Follow up on data product checkout intent for ${product.name}.`,
                meta: {
                    product_type: product.type,
                    purchase_type: product.purchase_type,
                    checkout_unavailable_reason: blockReason,
                },
            });

            return NextResponse.json(
                {
                    error: 'Data product checkout is temporarily unavailable.',
                    reason: blockReason,
                    checkout_intent_id: checkoutTracking.checkoutIntentId ?? null,
                    crm_opportunity_id: checkoutTracking.crmOpportunityId ?? null,
                    checkout_tracking_recorded: checkoutTracking.ok,
                    checkout_tracking_errors: checkoutTracking.errors,
                },
                { status: 503 },
            );
        }

        let query = admin
            .from('data_purchases')
            .select('id, status, stripe_session_id')
            .eq('user_id', user.id)
            .eq('product_id', product.id)
            .eq('country_code', countryCode)
            .in('status', ['pending', 'active']);

        query = corridorCode ? query.eq('corridor_code', corridorCode) : query.is('corridor_code', null);

        const { data: currentPurchase } = await query.maybeSingle();
        if (currentPurchase?.status === 'active') {
            return NextResponse.json({
                error: 'already_active',
                message: 'This data product is already active on your account.',
                purchase_id: currentPurchase.id,
            }, { status: 409 });
        }

        const pendingPurchase = currentPurchase ?? (await admin
            .from('data_purchases')
            .insert({
                user_id: user.id,
                product_id: product.id,
                product_type: product.type,
                country_code: countryCode,
                corridor_code: corridorCode,
                status: 'pending',
                metadata: {
                    source: 'data_marketplace',
                    checkout_route: '/api/stripe/data-checkout',
                    product_name: product.name,
                },
            })
            .select('id, status, stripe_session_id')
            .single()).data;

        if (!pendingPurchase) {
            return NextResponse.json({ error: 'Could not create pending purchase' }, { status: 500 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.haulcommand.com';
        const mode: Stripe.Checkout.SessionCreateParams.Mode =
            product.purchase_type === 'subscription' ? 'subscription' : 'payment';
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode,
            payment_method_types: ['card'],
            line_items: [buildLineItem(product)],
            success_url: success_url || `${baseUrl}/data?purchased=${product.id}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancel_url || `${baseUrl}/data?cancelled=${product.id}`,
            client_reference_id: user.id,
            customer_email: user.email || undefined,
            metadata: {
                type: 'data_purchase',
                product_id: product.id,
                product_type: product.type,
                user_id: user.id,
                purchase_id: pendingPurchase.id,
                country_code: countryCode,
                corridor_code: corridorCode || '',
                source: 'data_marketplace',
            },
            allow_promotion_codes: true,
        };

        const session = await stripe.checkout.sessions.create(sessionParams);

        await admin
            .from('data_purchases')
            .update({
                stripe_session_id: session.id,
                metadata: {
                    source: 'data_marketplace',
                    checkout_route: '/api/stripe/data-checkout',
                    product_name: product.name,
                    stripe_checkout_status: 'created',
                },
            })
            .eq('id', pendingPurchase.id);

        return NextResponse.json({
            url: session.url,
            session_id: session.id,
            purchase_id: pendingPurchase.id,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Checkout session creation failed';
        console.error('Stripe data checkout error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
