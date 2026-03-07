// app/api/subscriptions/webhook/route.ts
//
// Stripe webhook handler for subscription lifecycle events.
// Updates user tier in Supabase on subscribe, upgrade, downgrade, cancel.

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/enterprise/stripe/client";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

export const runtime = "nodejs";

// Stripe sends raw body — Next.js needs this
export async function POST(req: NextRequest) {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error("[sub-webhook] Missing STRIPE_SUBSCRIPTION_WEBHOOK_SECRET");
        return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
        console.error("[sub-webhook] Signature verification failed:", err.message);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as any;
            if (session.mode === "subscription" && session.metadata?.user_id) {
                await supabase
                    .from("profiles")
                    .update({
                        subscription_tier: session.metadata.tier,
                        subscription_platform: session.metadata.platform,
                        subscription_status: "active",
                        stripe_subscription_id: session.subscription,
                        subscription_country: session.metadata.country_code,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", session.metadata.user_id);

                console.log(`[sub-webhook] User ${session.metadata.user_id} subscribed: ${session.metadata.tier} (${session.metadata.platform})`);
            }
            break;
        }

        case "customer.subscription.updated": {
            const sub = event.data.object as any;
            const userId = sub.metadata?.user_id;
            if (userId) {
                const status = sub.status === "active" ? "active"
                    : sub.status === "past_due" ? "past_due"
                        : sub.status === "canceled" ? "canceled"
                            : sub.status;

                await supabase
                    .from("profiles")
                    .update({
                        subscription_tier: sub.metadata?.tier,
                        subscription_status: status,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", userId);

                console.log(`[sub-webhook] Subscription updated for ${userId}: status=${status}, tier=${sub.metadata?.tier}`);
            }
            break;
        }

        case "customer.subscription.deleted": {
            const sub = event.data.object as any;
            const userId = sub.metadata?.user_id;
            if (userId) {
                await supabase
                    .from("profiles")
                    .update({
                        subscription_tier: "free",
                        subscription_status: "canceled",
                        stripe_subscription_id: null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", userId);

                console.log(`[sub-webhook] Subscription canceled for ${userId}`);
            }
            break;
        }

        case "invoice.payment_failed": {
            const invoice = event.data.object as any;
            const customerId = typeof invoice.customer === "string"
                ? invoice.customer
                : invoice.customer?.id;

            if (customerId) {
                await supabase
                    .from("profiles")
                    .update({
                        subscription_status: "past_due",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("stripe_customer_id", customerId);

                console.log(`[sub-webhook] Payment failed for customer ${customerId}`);
            }
            break;
        }

        default:
            // Unhandled event type
            break;
    }

    return NextResponse.json({ received: true });
}
