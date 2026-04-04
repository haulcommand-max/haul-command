import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ══════════════════════════════════════════════════════════════
// /api/webhooks/stripe-sponsor — SPONSOR SUBSCRIPTION WEBHOOK
//
// Handles Stripe subscription lifecycle events for AdGrid sponsors.
// Idempotent: all events deduped via sponsor_webhook_events table.
//
// Events handled:
//   checkout.session.completed   → activate sponsorship_order
//   customer.subscription.updated/deleted → sync status
//   invoice.payment_succeeded    → renew active_until
//   invoice.payment_failed       → mark past_due
//
// Security: raw body verified via constructEvent() before any processing
// ══════════════════════════════════════════════════════════════

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
});

const WEBHOOK_SECRET = process.env.STRIPE_SPONSOR_WEBHOOK_SECRET!;

// Service-role client — bypasses RLS for all webhook writes
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

function thirtyDaysFromNow(): string {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

export async function POST(req: Request) {
    // ── 1. Verify signature BEFORE parsing — CRITICAL ──
    const payload = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig || !WEBHOOK_SECRET) {
        console.error('[SponsorWebhook] Missing signature or STRIPE_SPONSOR_WEBHOOK_SECRET');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(payload, sig, WEBHOOK_SECRET);
    } catch (err: any) {
        console.error('[SponsorWebhook] Signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // ── 2. Idempotency check ──
    const { data: existing } = await supabaseAdmin
        .from('sponsor_webhook_events')
        .select('id')
        .eq('stripe_event_id', event.id)
        .maybeSingle();

    if (existing) {
        return NextResponse.json({ status: 'duplicate', eventId: event.id });
    }

    // ── 3. Record event before processing (prevents race on retry) ──
    const { data: eventRecord } = await supabaseAdmin
        .from('sponsor_webhook_events')
        .insert({
            stripe_event_id: event.id,
            event_type: event.type,
            raw_payload: JSON.parse(payload),
        })
        .select('id')
        .single();

    let orderId: string | null = null;

    try {
        switch (event.type) {

            // ── checkout.session.completed ──
            // Creates the sponsorship_order and marks it active
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.mode !== 'subscription') break;

                // sponsor_zone metadata should be the product_key directly (e.g. 'corridor_primary')
                // sponsor_geo is the geographic scope (e.g. 'US-TX')
                const zone  = session.metadata?.sponsor_zone;
                const geo   = session.metadata?.sponsor_geo;

                if (!zone || !geo) {
                    console.warn('[SponsorWebhook] Missing zone/geo metadata on session', session.id);
                    break;
                }

                // Resolve supabase user from Stripe customer metadata
                let userId: string | null = null; // null = anonymous/guest checkout (no FK violation)
                if (session.customer) {
                    try {
                        const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer;
                        if (customer.metadata?.supabase_user_id) {
                            userId = customer.metadata.supabase_user_id;
                        }
                    } catch { /* non-critical */ }
                }

                const { data: order, error: orderErr } = await supabaseAdmin
                    .from('sponsorship_orders')
                    .insert({
                        user_id:                    userId,
                        product_key:                zone,   // zone IS the product_key (e.g. 'corridor_primary')
                        geo_key:                    geo,
                        zone,
                        geo,
                        stripe_checkout_session_id: session.id,
                        stripe_subscription_id:     session.subscription as string | null,
                        stripe_customer_id:         session.customer as string | null,
                        status:                     'active',
                        active_from:                new Date().toISOString(),
                        active_until:               thirtyDaysFromNow(),
                    })
                    .select('id')
                    .single();

                if (orderErr) {
                    console.error('[SponsorWebhook] sponsorship_orders insert failed:', orderErr.message, orderErr.details);
                }

                orderId = order?.id ?? null;
                console.log(`[SponsorWebhook] ✅ Activated: ${zone}/${geo} → order ${orderId}`);
                break;
            }

            // ── customer.subscription.updated ──
            case 'customer.subscription.updated': {
                const sub = event.data.object as Stripe.Subscription;

                // Stripe uses 'canceled' (American spelling)
                const dbStatus =
                    sub.status === 'active'   ? 'active'    :
                    sub.status === 'past_due'  ? 'past_due'  :
                    sub.status === 'canceled'  ? 'cancelled' :
                    'pending';

                // current_period_end is on the items in newer API versions
                const periodEnd = (sub as any).current_period_end
                    ? new Date((sub as any).current_period_end * 1000).toISOString()
                    : null;

                const { data: updated } = await supabaseAdmin
                    .from('sponsorship_orders')
                    .update({
                        status: dbStatus,
                        ...(periodEnd ? { active_until: periodEnd } : {}),
                    })
                    .eq('stripe_subscription_id', sub.id)
                    .select('id')
                    .single();

                orderId = updated?.id ?? null;
                console.log(`[SponsorWebhook] 🔄 Sub updated: ${sub.id} → ${dbStatus}`);
                break;
            }

            // ── customer.subscription.deleted ──
            case 'customer.subscription.deleted': {
                const sub = event.data.object as Stripe.Subscription;

                const { data: cancelled } = await supabaseAdmin
                    .from('sponsorship_orders')
                    .update({
                        status:       'cancelled',
                        cancelled_at: new Date().toISOString(),
                    })
                    .eq('stripe_subscription_id', sub.id)
                    .select('id')
                    .single();

                orderId = cancelled?.id ?? null;
                console.log(`[SponsorWebhook] 🚫 Sub cancelled: ${sub.id}`);
                break;
            }

            // ── invoice.payment_succeeded ──
            case 'invoice.payment_succeeded': {
                // Use type assertion — invoice fields vary by API version
                const invoice = event.data.object as any;
                const subId: string | null = invoice.subscription ?? null;
                if (!subId) break;

                const periodEnd = invoice.period_end
                    ? new Date(invoice.period_end * 1000).toISOString()
                    : thirtyDaysFromNow();

                const { data: renewed } = await supabaseAdmin
                    .from('sponsorship_orders')
                    .update({ status: 'active', active_until: periodEnd })
                    .eq('stripe_subscription_id', subId)
                    .select('id')
                    .single();

                orderId = renewed?.id ?? null;
                console.log(`[SponsorWebhook] 💳 Payment succeeded, renewed → ${periodEnd}`);
                break;
            }

            // ── invoice.payment_failed ──
            case 'invoice.payment_failed': {
                const invoice = event.data.object as any;
                const subId: string | null = invoice.subscription ?? null;
                if (!subId) break;

                const { data: pastDue } = await supabaseAdmin
                    .from('sponsorship_orders')
                    .update({ status: 'past_due' })
                    .eq('stripe_subscription_id', subId)
                    .select('id')
                    .single();

                orderId = pastDue?.id ?? null;
                console.warn(`[SponsorWebhook] ⚠️ Payment failed for sub ${subId}`);
                break;
            }

            default:
                // Recorded for audit, no action needed
                break;
        }

        // ── 5. Link event record to resolved order ──
        if (orderId && eventRecord?.id) {
            await supabaseAdmin
                .from('sponsor_webhook_events')
                .update({ order_id: orderId })
                .eq('id', eventRecord.id);
        }

        return NextResponse.json({ status: 'ok', eventId: event.id, orderId });

    } catch (err: any) {
        console.error('[SponsorWebhook] Processing error:', err.message);
        // Return 200 to prevent Stripe retry storm — event is recorded for manual inspection
        return NextResponse.json({
            status: 'processing_error',
            eventId: event.id,
            error: err.message,
        });
    }
}
