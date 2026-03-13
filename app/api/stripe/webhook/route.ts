/**
 * Haul Command — Stripe Webhook Handler
 *
 * Handles subscription lifecycle events from Stripe.
 * Updates billing_customers, billing_subscriptions, and operator_entitlements.
 *
 * CRITICAL: When creating Checkout Sessions, include metadata: { user_id: supabaseUserId }
 */

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
    if (!_stripe) {
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    }
    return _stripe;
}

// ─── Tier mapping ─────────────────────────────────────────
// Configure via env vars: STRIPE_PRICE_ELITE, STRIPE_PRICE_PRO, STRIPE_PRICE_BASIC
function tierFromPriceId(priceId?: string | null): 'free' | 'basic' | 'pro' | 'elite' {
    if (!priceId) return 'free';

    // Exact match from env vars (production-safe)
    if (process.env.STRIPE_PRICE_ELITE && priceId === process.env.STRIPE_PRICE_ELITE) return 'elite';
    if (process.env.STRIPE_PRICE_PRO && priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
    if (process.env.STRIPE_PRICE_BASIC && priceId === process.env.STRIPE_PRICE_BASIC) return 'basic';

    // Fallback: prefix-based matching for dev/test
    if (priceId.startsWith('price_elite') || priceId.includes('elite')) return 'elite';
    if (priceId.startsWith('price_pro') || priceId.includes('pro')) return 'pro';
    if (priceId.startsWith('price_basic') || priceId.includes('basic')) return 'basic';

    return 'free';
}

function entitlementsFromTier(tier: 'free' | 'basic' | 'pro' | 'elite') {
    switch (tier) {
        case 'elite':
            return { tier, gps_ping_interval_seconds: 15, priority_dispatch: true, proximity_boost: true };
        case 'pro':
            return { tier, gps_ping_interval_seconds: 30, priority_dispatch: false, proximity_boost: true };
        case 'basic':
            return { tier, gps_ping_interval_seconds: 60, priority_dispatch: false, proximity_boost: false };
        default:
            return { tier: 'free' as const, gps_ping_interval_seconds: 90, priority_dispatch: false, proximity_boost: false };
    }
}

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );
}

// ─── Webhook handler ──────────────────────────────────────
export async function POST(req: Request) {
    const sig = req.headers.get('stripe-signature');
    if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
        event = getStripe().webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: `Webhook signature failed: ${msg}` }, { status: 400 });
    }

    const supabase = getSupabase();

    try {
        switch (event.type) {
            // ── Checkout completed ──────────────────────────────
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
                const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
                const userId = (session.metadata?.user_id || '').trim();

                if (!userId || !customerId) break;

                await supabase.from('billing_customers').upsert({
                    user_id: userId,
                    stripe_customer_id: customerId,
                    updated_at: new Date().toISOString(),
                });

                if (subscriptionId) {
                    const sub: any = await getStripe().subscriptions.retrieve(subscriptionId, {
                        expand: ['items.data.price.product'],
                    });
                    const price = sub.items?.data?.[0]?.price;
                    const priceId = price?.id ?? null;
                    const productId = typeof price?.product === 'string' ? price.product : price?.product?.id ?? null;
                    const tier = tierFromPriceId(priceId);
                    const ent = entitlementsFromTier(tier);

                    await supabase.from('billing_subscriptions').upsert(
                        {
                            user_id: userId,
                            stripe_subscription_id: sub.id,
                            status: sub.status,
                            price_id: priceId,
                            product_id: productId,
                            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
                            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                            cancel_at_period_end: sub.cancel_at_period_end,
                            metadata: sub.metadata ?? {},
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: 'stripe_subscription_id' }
                    );

                    await supabase.from('operator_entitlements').upsert({
                        user_id: userId,
                        ...ent,
                        updated_at: new Date().toISOString(),
                        source: 'stripe',
                        raw: { stripe_subscription_id: sub.id, status: sub.status, price_id: priceId },
                    });
                }
                break;
            }

            // ── Subscription lifecycle ──────────────────────────
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const sub = event.data.object as any;
                const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;

                // Find user_id via billing_customers
                const { data: bc } = await supabase
                    .from('billing_customers')
                    .select('user_id')
                    .eq('stripe_customer_id', customerId)
                    .maybeSingle();

                if (!bc?.user_id) break;
                const userId = bc.user_id;

                const price = sub.items.data[0]?.price;
                const priceId = price?.id ?? null;
                const productId = typeof price?.product === 'string' ? price.product : (price?.product as any)?.id ?? null;

                const tier =
                    sub.status === 'active' || sub.status === 'trialing'
                        ? tierFromPriceId(priceId)
                        : 'free';

                const ent = entitlementsFromTier(tier);

                await supabase.from('billing_subscriptions').upsert(
                    {
                        user_id: userId,
                        stripe_subscription_id: sub.id,
                        status: sub.status,
                        price_id: priceId,
                        product_id: productId,
                        current_period_start: sub.current_period_start
                            ? new Date(sub.current_period_start * 1000).toISOString()
                            : null,
                        current_period_end: sub.current_period_end
                            ? new Date(sub.current_period_end * 1000).toISOString()
                            : null,
                        cancel_at_period_end: sub.cancel_at_period_end,
                        metadata: sub.metadata ?? {},
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'stripe_subscription_id' }
                );

                await supabase.from('operator_entitlements').upsert({
                    user_id: userId,
                    ...ent,
                    updated_at: new Date().toISOString(),
                    source: 'stripe',
                    raw: { stripe_subscription_id: sub.id, status: sub.status, price_id: priceId },
                });

                break;
            }

            default:
                // Unhandled event type — ignore
                break;
        }

        return NextResponse.json({ received: true });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Webhook handler failed';
        console.error('[stripe-webhook]', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
