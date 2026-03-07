import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/enterprise/stripe/client";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
    const stripe = getStripe();
    const supabase = getSupabaseAdmin();

    const sig = (await headers()).get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !webhookSecret) {
        return NextResponse.json({ error: "Missing stripe-signature or STRIPE_WEBHOOK_SECRET" }, { status: 400 });
    }

    const rawBody = await req.text();

    let event: any;
    try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook signature verification failed: ${err?.message ?? err}` }, { status: 400 });
    }

    // Dedupe store (PK prevents double-processing)
    const insertPayload = {
        stripe_event_id: event.id,
        event_type: event.type,
        account_id: null as any, // optional: populate if you can map customer->account
        payload: event as any,
        processing_status: "pending",
    };

    const { error: insErr } = await supabase.from("stripe_webhook_events").insert(insertPayload);
    if (insErr) {
        // If duplicate, return 200 to Stripe
        return NextResponse.json({ ok: true, deduped: true });
    }

    try {
        // Minimal processing hooks (expand as needed)
        // Useful events: invoice.finalized, invoice.paid, customer.subscription.updated, etc.
        if (event.type === "customer.subscription.updated") {
            // Optionally trigger a sync job, or update stripe_subscriptions table by mapping customer->account
        }

        await supabase
            .from("stripe_webhook_events")
            .update({ processing_status: "processed", processed_at: new Date().toISOString() })
            .eq("stripe_event_id", event.id);

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        await supabase
            .from("stripe_webhook_events")
            .update({ processing_status: "failed", error_message: e?.message ?? String(e) })
            .eq("stripe_event_id", event.id);

        // Still return 200 to Stripe to avoid endless retries if the error is deterministic;
        // if you prefer retries, return 500 here instead.
        return NextResponse.json({ ok: true, processed: false });
    }
}
