import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Force Node.js runtime (not Edge) — required for Stripe webhook signature verification
export const runtime = "nodejs";

// Disable body parsing — Stripe needs the raw body for signature verification
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
        return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[Stripe Webhook] Signature verification failed:", message);
        return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
    }

    // Idempotency: check if we already processed this event
    const { data: existing } = await supabaseAdmin
        .from("stripe_webhook_events")
        .select("id")
        .eq("stripe_event_id", event.id)
        .maybeSingle();

    if (existing) {
        return NextResponse.json({ received: true, duplicate: true });
    }

    // Log the event
    await supabaseAdmin.from("stripe_webhook_events").insert({
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event.data,
        received_at: new Date().toISOString(),
    });

    // Route events to handlers
    try {
        switch (event.type) {
            // ─── Subscription lifecycle ───────────────────────────
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.mode === "subscription" && session.subscription) {
                    await handleSubscriptionCreated(session);
                }
                break;
            }

            case "customer.subscription.updated": {
                const sub = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdated(sub);
                break;
            }

            case "customer.subscription.deleted": {
                const sub = event.data.object as Stripe.Subscription;
                await handleSubscriptionCanceled(sub);
                break;
            }

            // ─── Invoice lifecycle ────────────────────────────────
            case "invoice.paid": {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaid(invoice);
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoiceFailed(invoice);
                break;
            }

            default:
                console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }

        // Mark as processed
        await supabaseAdmin
            .from("stripe_webhook_events")
            .update({ processed_at: new Date().toISOString() })
            .eq("stripe_event_id", event.id);

    } catch (err) {
        console.error("[Stripe Webhook] Handler error:", err);
        // Still return 200 to prevent Stripe retries on business logic errors
    }

    return NextResponse.json({ received: true });
}

// ────────────────────────────────────────────────────────────
// HANDLERS
// ────────────────────────────────────────────────────────────

async function handleSubscriptionCreated(session: Stripe.Checkout.Session) {
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;
    const userId = session.metadata?.user_id || session.client_reference_id;

    if (!userId) {
        console.error("[Stripe] No user_id in session metadata or client_reference_id");
        return;
    }

    // Fetch subscription details
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const subData = sub as unknown as Record<string, unknown>;
    const priceId = sub.items.data[0]?.price?.id;
    const productId = sub.items.data[0]?.price?.product as string;
    const periodStart = typeof subData.current_period_start === 'number' ? new Date(subData.current_period_start * 1000).toISOString() : null;
    const periodEnd = typeof subData.current_period_end === 'number' ? new Date(subData.current_period_end * 1000).toISOString() : null;

    // Upsert subscription record
    await supabaseAdmin.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId,
        stripe_product_id: productId,
        status: sub.status,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: sub.cancel_at_period_end,
        updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    // Assign 'verified_operator' role if not already present
    await supabaseAdmin.from("user_roles").upsert({
        user_id: userId,
        role: "verified_operator",
        scope: "",
    }, { onConflict: "user_id,role,scope" });

    console.log(`[Stripe] Subscription created for user ${userId}: ${subscriptionId}`);
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
    const customerId = sub.customer as string;

    // Find user by stripe_customer_id
    const { data: existingSub } = await supabaseAdmin
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

    if (!existingSub) {
        console.warn(`[Stripe] No subscription found for customer ${customerId}`);
        return;
    }

    const subData = sub as unknown as Record<string, unknown>;
    const periodStart = typeof subData.current_period_start === 'number' ? new Date(subData.current_period_start * 1000).toISOString() : null;
    const periodEnd = typeof subData.current_period_end === 'number' ? new Date(subData.current_period_end * 1000).toISOString() : null;

    await supabaseAdmin.from("subscriptions").update({
        status: sub.status,
        stripe_price_id: sub.items.data[0]?.price?.id,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: sub.cancel_at_period_end,
        updated_at: new Date().toISOString(),
    }).eq("stripe_customer_id", customerId);
}

async function handleSubscriptionCanceled(sub: Stripe.Subscription) {
    const customerId = sub.customer as string;

    await supabaseAdmin.from("subscriptions").update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }).eq("stripe_customer_id", customerId);

    console.log(`[Stripe] Subscription canceled for customer ${customerId}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
    console.log(`[Stripe] Invoice paid: ${invoice.id} — $${(invoice.amount_paid / 100).toFixed(2)}`);
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
    console.log(`[Stripe] Invoice payment failed: ${invoice.id}`);
    // TODO: Send notification to user about payment failure
}
