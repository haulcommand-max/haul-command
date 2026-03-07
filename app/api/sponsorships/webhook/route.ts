// app/api/sponsorships/webhook/route.ts
//
// Stripe webhook handler for port + corridor + adgrid sponsorship payment events.
// Activates sponsorships on successful payment, handles outbidding.

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/enterprise/stripe/client";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    const stripe = getStripe();
    const secret = process.env.STRIPE_SPONSORSHIP_WEBHOOK_SECRET;

    if (!secret) {
        console.error("[sponsorship-webhook] Missing STRIPE_SPONSORSHIP_WEBHOOK_SECRET");
        return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, secret);
    } catch (err: any) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const meta = session.metadata || {};

        if (meta.type === "port_sponsorship" && meta.sponsorship_id) {
            // Activate port sponsorship
            await supabase
                .from("port_sponsorships")
                .update({
                    status: "active",
                    stripe_subscription_id: session.subscription,
                    starts_at: new Date().toISOString(),
                    notes: "Payment confirmed via Stripe",
                })
                .eq("id", meta.sponsorship_id);

            // If domination tier, expire any other active domination sponsors
            if (meta.tier === "domination") {
                await supabase
                    .from("port_sponsorships")
                    .update({ status: "expired", notes: "Outbid" })
                    .eq("port_id", meta.port_id)
                    .eq("tier", "domination")
                    .eq("status", "active")
                    .neq("id", meta.sponsorship_id);
            }

            console.log(`[sponsorship-webhook] Port sponsorship ${meta.sponsorship_id} activated`);
        }

        if (meta.type === "corridor_sponsorship" && meta.sponsorship_id) {
            // Activate corridor sponsorship
            await supabase
                .from("corridor_featured_sponsorships")
                .update({
                    status: "active",
                    stripe_subscription_id: session.subscription,
                    starts_at: new Date().toISOString(),
                    notes: `Payment confirmed — $${meta.bid_amount}/mo`,
                })
                .eq("id", meta.sponsorship_id);

            // Expire outbid sponsors
            await supabase
                .from("corridor_featured_sponsorships")
                .update({ status: "expired", notes: "Outbid" })
                .eq("corridor_slug", meta.corridor_slug)
                .eq("tier", "corridor_takeover")
                .eq("status", "active")
                .neq("id", meta.sponsorship_id);

            console.log(`[sponsorship-webhook] Corridor sponsorship ${meta.sponsorship_id} activated (corridor: ${meta.corridor_slug})`);
        }

        if (meta.type === "adgrid_bid" && meta.bid_id) {
            // Activate AdGrid bid
            await supabase
                .from("adgrid_bids")
                .update({
                    status: "active",
                    stripe_subscription_id: session.subscription,
                    activated_at: new Date().toISOString(),
                })
                .eq("id", meta.bid_id);

            // Expire outbid competitors for same geo + slot
            await supabase
                .from("adgrid_bids")
                .update({ status: "outbid" })
                .eq("geo_key", meta.geo_key)
                .eq("slot_id", meta.slot_id)
                .eq("status", "active")
                .neq("id", meta.bid_id);

            console.log(`[sponsorship-webhook] AdGrid bid ${meta.bid_id} activated (geo: ${meta.geo_key}, slot: ${meta.slot_id})`);
        }
    }

    if (event.type === "customer.subscription.deleted") {
        const sub = event.data.object as any;
        const subId = sub.id;

        // Deactivate port sponsorship if subscription cancelled
        await supabase
            .from("port_sponsorships")
            .update({ status: "expired", notes: "Subscription cancelled" })
            .eq("stripe_subscription_id", subId)
            .eq("status", "active");

        // Deactivate corridor sponsorship
        await supabase
            .from("corridor_featured_sponsorships")
            .update({ status: "expired", notes: "Subscription cancelled" })
            .eq("stripe_subscription_id", subId)
            .eq("status", "active");

        // Deactivate adgrid bids
        await supabase
            .from("adgrid_bids")
            .update({ status: "expired" })
            .eq("stripe_subscription_id", subId)
            .eq("status", "active");

        console.log(`[sponsorship-webhook] All sponsorships deactivated (subscription ${subId} cancelled)`);
    }

    return NextResponse.json({ received: true });
}
