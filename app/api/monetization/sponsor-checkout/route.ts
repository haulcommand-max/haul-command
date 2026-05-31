import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { resolveSponsorCheckoutOffer } from '@/lib/monetization/funnel-guards';
import { recordCheckoutIntent } from '@/lib/revenue/checkout-intent';

// ══════════════════════════════════════════════════════════════
// /api/monetization/sponsor-checkout — STRIPE CHECKOUT SESSION
//
// Creates a Stripe Checkout session for sponsor territory/corridor/port
// purchases. All sponsor buys go monthly recurring (subscription).
//
// Input:  { zone, geo, priceMonthly, label, returnUrl }
// Output: { sessionUrl } — redirect to Stripe-hosted checkout
//
// On success: Stripe webhook → update sponsors table → email receipt
// ══════════════════════════════════════════════════════════════

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
});

const rowId = (row: unknown) => (row && typeof row === 'object' && 'id' in row ? String(row.id) : undefined);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { zone, geo, priceMonthly, label, returnUrl } = body as {
            zone: string;
            geo: string;
            priceMonthly: number;
            label: string;
            returnUrl?: string;
        };

        // ── Input validation ──
        const offer = resolveSponsorCheckoutOffer({
            zone,
            geo,
            label,
            requestedPriceMonthly: priceMonthly,
        });
        if (!offer.ok) {
            return NextResponse.json({ error: offer.error }, { status: offer.status });
        }

        // ── Auth: get user_id if signed in (optional — sponsors can buy as guest) ──
        const supabase = createClient();
        let customerId: string | undefined;
        let userId: string | null = null;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                userId = user.id;
                // Look up or create Stripe customer
                const existing = await stripe.customers.list({ email: user.email, limit: 1 });
                if (existing.data.length > 0) {
                    customerId = existing.data[0].id;
                } else {
                    const customer = await stripe.customers.create({
                        email: user.email,
                        metadata: { supabase_user_id: user.id },
                    });
                    customerId = customer.id;
                }
            }
        } catch {
            // Non-blocking — proceed without customer linkage
        }

        // ── Create Stripe Price (inline, one-off per session) ──
        // In production, create a Price catalog in Stripe and look up by lookup_key
        const admin = getSupabaseAdmin();
        const { data: pendingOrder, error: pendingOrderError } = await admin
            .from('sponsorship_orders' as never)
            .insert({
                user_id: userId,
                product_key: offer.productKey,
                geo_key: offer.geo,
                zone: offer.zone,
                geo: offer.geo,
                status: 'pending',
            } as never)
            .select('id')
            .single();

        const pendingOrderId = rowId(pendingOrder);
        if (pendingOrderError || !pendingOrderId) {
            return NextResponse.json({ error: pendingOrderError?.message ?? 'Unable to reserve sponsor order' }, { status: 500 });
        }

        const price = await stripe.prices.create({
            currency: 'usd',
            unit_amount: Math.round(offer.priceMonthly * 100),
            recurring: { interval: 'month' },
            product_data: {
                name: `Haul Command Sponsor: ${offer.label}`,
                metadata: { zone: offer.zone, geo: offer.geo, product_key: offer.productKey },
            },
        });

        // ── Create Checkout Session ──
        const origin = returnUrl
            ? new URL(returnUrl).origin
            : 'https://haulcommand.com';

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [{ price: price.id, quantity: 1 }],
            ...(customerId ? { customer: customerId } : {}),
            success_url: `${origin}/advertise?checkout=success&zone=${offer.zone}&geo=${encodeURIComponent(offer.geo)}`,
            cancel_url: `${origin}/advertise?checkout=cancelled`,
            subscription_data: {
                metadata: {
                    sponsor_order_id: pendingOrderId,
                    sponsor_zone: offer.zone,
                    sponsor_geo: offer.geo,
                    sponsor_label: offer.label,
                    sponsor_product_key: offer.productKey,
                },
            },
            metadata: {
                sponsor_order_id: pendingOrderId,
                sponsor_zone: offer.zone,
                sponsor_geo: offer.geo,
                sponsor_label: offer.label,
                sponsor_product_key: offer.productKey,
                ignored_client_price: String(offer.ignoredClientPrice),
            },
            allow_promotion_codes: true,
            billing_address_collection: 'auto',
        });

        await admin
            .from('sponsorship_orders' as never)
            .update({
                stripe_checkout_session_id: session.id,
                stripe_customer_id: (session.customer as string | null) ?? customerId ?? null,
            } as never)
            .eq('id' as never, pendingOrderId);

        const checkoutTracking = await recordCheckoutIntent({
            userId,
            buyerRole: 'sponsor',
            productKind: 'adgrid_sponsor',
            productKey: offer.productKey,
            priceCents: Math.round(offer.priceMonthly * 100),
            currency: 'usd',
            targetCorridorKey: offer.zone === 'corridor' ? offer.geo : null,
            stripeSessionId: session.id,
            stripeCustomerId: (session.customer as string | null) ?? customerId ?? null,
            sourcePath: '/api/monetization/sponsor-checkout',
            recommendation: `Follow up on sponsor checkout for ${offer.label}.`,
            meta: {
                sponsor_order_id: pendingOrderId,
                sponsor_zone: offer.zone,
                sponsor_geo: offer.geo,
                sponsor_label: offer.label,
                ignored_client_price: offer.ignoredClientPrice,
            },
        });

        if (!checkoutTracking.ok) {
            console.error('[Sponsor Checkout] checkout tracking failed:', checkoutTracking.errors);
        }

        return NextResponse.json({
            sessionUrl: session.url,
            orderId: pendingOrderId,
            checkoutIntentId: checkoutTracking.checkoutIntentId ?? null,
            checkoutTrackingRecorded: checkoutTracking.ok,
            checkoutTrackingErrors: checkoutTracking.errors,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Sponsor checkout failed';
        console.error('[Sponsor Checkout] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
