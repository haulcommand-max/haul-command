/**
 * POST /api/stripe/data-checkout
 *
 * Creates a Stripe Checkout session for data product purchases.
 * Supports one_time, subscription, and metered products from DATA_PRODUCT_CATALOG.
 *
 * Body: { product_id, email?, country_code?, corridor_code?, success_url?, cancel_url? }
 * Returns: { url: string } → redirect to Stripe Checkout
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { DATA_PRODUCT_CATALOG, type DataProduct } from '@/lib/monetization/data-product-engine';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

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

export async function POST(req: NextRequest) {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
        }

        const body = await req.json();
        const { product_id, email, country_code, corridor_code, success_url, cancel_url } = body;

        if (!product_id) {
            return NextResponse.json({ error: 'Missing product_id' }, { status: 400 });
        }

        const product = DATA_PRODUCT_CATALOG.find(p => p.id === product_id && p.active);
        if (!product) {
            return NextResponse.json({ error: 'Product not found or inactive' }, { status: 404 });
        }

        // Don't checkout free products
        if (product.price_usd === 0) {
            return NextResponse.json({ error: 'This product is free — no checkout needed' }, { status: 400 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.haulcommand.com';
        const mode: Stripe.Checkout.SessionCreateParams.Mode =
            product.purchase_type === 'subscription' ? 'subscription' : 'payment';

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode,
            payment_method_types: ['card'],
            line_items: [buildLineItem(product)],
            success_url: success_url || `${baseUrl}/data?purchased=${product.id}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancel_url || `${baseUrl}/data?cancelled=${product.id}`,
            metadata: {
                type: 'data_purchase',
                product_id: product.id,
                product_type: product.type,
                country_code: country_code || 'ALL',
                corridor_code: corridor_code || '',
                source: 'data_marketplace',
            },
            allow_promotion_codes: true,
        };

        // Pre-fill email if known
        if (email) {
            sessionParams.customer_email = email;
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        return NextResponse.json({ url: session.url });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Checkout session creation failed';
        console.error('Stripe data checkout error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
