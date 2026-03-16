// app/api/ports/sponsor/checkout/route.ts
//
// Creates a Stripe Checkout session for port sponsorship.
// Self-serve: user picks tier → pays → webhook activates sponsorship.
// Supports auction: if domination tier, bid must exceed current highest.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getStripe } from "@/lib/enterprise/stripe/client";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const TIER_PRICES: Record<string, number> = {
    starter: 199,
    pro: 399,
    domination: 799,
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { port_id, tier, bid_amount_usd } = body;

        if (!port_id || !tier) {
            return NextResponse.json({ error: "port_id and tier required" }, { status: 400 });
        }

        if (!TIER_PRICES[tier]) {
            return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
        }

        // Auth
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Login required" }, { status: 401 });
        }

        const admin = getSupabaseAdmin();
        const bidAmount = bid_amount_usd ?? TIER_PRICES[tier];

        // Auction check for domination tier
        if (tier === "domination") {
            const { data: existing } = await admin
                .from("port_sponsorships")
                .select("price_usd_month")
                .eq("port_id", port_id)
                .eq("tier", "domination")
                .eq("status", "active");

            if (existing && existing.length > 0) {
                const highest = Math.max(...existing.map(s => Number(s.price_usd_month) || 0));
                if (bidAmount <= highest) {
                    return NextResponse.json(
                        { error: `Bid must exceed current $${highest}/mo. Minimum: $${highest + 1}` },
                        { status: 409 }
                    );
                }
            }
        }

        // Get port name for Stripe description
        const { data: port } = await admin
            .from("ports")
            .select("name")
            .eq("id", port_id)
            .single();

        const stripe = getStripe();

        // Get/create Stripe customer
        const { data: profile } = await admin
            .from("profiles")
            .select("stripe_customer_id")
            .eq("id", user.id)
            .single();

        let customerId = profile?.stripe_customer_id;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { supabase_user_id: user.id },
            });
            customerId = customer.id;
            await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
        }

        // Create pending sponsorship record
        const { data: sponsorship, error: insertErr } = await admin
            .from("port_sponsorships")
            .insert({
                port_id,
                sponsor_operator_id: user.id,
                tier,
                status: "pending_payment",
                exclusive: tier === "domination",
                price_usd_month: bidAmount,
                contact_email: user.email,
            })
            .select("id")
            .single();

        if (insertErr) {
            return NextResponse.json({ error: insertErr.message }, { status: 500 });
        }

        // Create Stripe checkout for recurring sponsorship
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            line_items: [{
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `Port Sponsorship — ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
                        description: port?.name ? `Sponsor: ${port.name}` : `Port ID: ${port_id}`,
                        metadata: { port_id, tier, sponsorship_id: sponsorship.id },
                    },
                    unit_amount: Math.round(bidAmount * 100),
                    recurring: { interval: "month" },
                },
                quantity: 1,
            }],
            metadata: {
                type: "port_sponsorship",
                sponsorship_id: sponsorship.id,
                port_id,
                tier,
                user_id: user.id,
            },
            success_url: `${req.nextUrl.origin}/sponsor/success?type=port&id=${sponsorship.id}`,
            cancel_url: `${req.nextUrl.origin}/sponsor/checkout?canceled=true`,
        });

        return NextResponse.json({
            checkout_url: session.url,
            session_id: session.id,
            sponsorship_id: sponsorship.id,
        });
    } catch (err: any) {
        console.error("[ports/sponsor/checkout]", err);
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    }
}
