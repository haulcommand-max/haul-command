import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

type Json = Record<string, unknown>;

serve(async (req: Request) => {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const sig = req.headers.get("stripe-signature");
    if (!sig) return new Response("Missing signature", { status: 400 });

    const raw = await req.text();

    let event: any; // Stripe types are hard in Deno sometimes, keeping any for safety with imports
    try {
        event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET);
    } catch (_e) {
        return new Response("Invalid signature", { status: 400 });
    }

    // Idempotent store
    await admin.from("webhook_inbox").insert({
        provider: "stripe",
        event_id: event.id,
        event_type: event.type,
        payload: event as any,
    }).catch(() => null);

    // Minimal payment status updates
    if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.amount_capturable_updated") {
        const pi = event.data.object as any;
        const job_id = (pi.metadata?.job_id ?? null);

        if (job_id) {
            // Find payment row by PI
            const { data: payment } = await admin
                .from("payments")
                .select("id, status")
                .eq("stripe_payment_intent_id", pi.id)
                .maybeSingle();

            if (payment?.id) {
                const nextStatus = (event.type === "payment_intent.succeeded") ? "captured" : "preauthorized";
                await admin.from("payments").update({ status: nextStatus }).eq("id", payment.id);
            }
        }
    }

    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
