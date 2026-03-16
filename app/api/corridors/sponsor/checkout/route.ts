// app/api/corridors/sponsor/checkout/route.ts
//
// Creates a Stripe Checkout session for corridor sponsorship bidding.
// Self-serve auction: user bids → pays → webhook activates + outbids old sponsor.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getStripe } from "@/lib/enterprise/stripe/client";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const MIN_BID_USD = 149;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { corridor_slug, bid_amount_usd } = body;

        if (!corridor_slug) {
            return NextResponse.json({ error: "corridor_slug required" }, { status: 400 });
        }

        const bidAmount = bid_amount_usd ?? MIN_BID_USD;
        if (bidAmount < MIN_BID_USD) {
            return NextResponse.json({ error: `Minimum bid is $${MIN_BID_USD}/mo` }, { status: 400 });
        }

        // Auth
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Login required" }, { status: 401 });
        }

        const admin = getSupabaseAdmin();

        // Check current highest bid
        const { data: existing } = await admin
            .from("corridor_featured_sponsorships")
            .select("price_usd_month")
            .eq("corridor_slug", corridor_slug)
            .eq("tier", "corridor_takeover")
            .eq("status", "active");

        if (existing && existing.length > 0) {
            const highest = Math.max(...existing.map(s => Number(s.price_usd_month) || 0));
            if (bidAmount <= highest) {
                return NextResponse.json(
                    {
                        error: `Bid must exceed current $${highest}/mo`,
                        current_highest: highest,
                        minimum_bid: highest + 1,
                    },
                    { status: 409 }
                );
            }
        }

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

        // Create pending sponsorship
        const { data: sponsorship, error: insertErr } = await admin
            .from("corridor_featured_sponsorships")
            .insert({
                corridor_slug,
                sponsor_operator_id: user.id,
                tier: "corridor_takeover",
                status: "pending_payment",
                price_usd_month: bidAmount,
                contact_email: user.email,
                notes: `Self-serve bid: $${bidAmount}/mo`,
            })
            .select("id")
            .single();

        if (insertErr) {
            return NextResponse.json({ error: insertErr.message }, { status: 500 });
        }

        // Create Stripe session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            line_items: [{
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `Corridor Takeover — ${corridor_slug}`,
                        description: `Exclusive corridor sponsorship at $${bidAmount}/mo`,
                        metadata: {
                            corridor_slug,
                            sponsorship_id: sponsorship.id,
                        },
                    },
                    unit_amount: Math.round(bidAmount * 100),
                    recurring: { interval: "month" },
                },
                quantity: 1,
            }],
            metadata: {
                type: "corridor_sponsorship",
                sponsorship_id: sponsorship.id,
                corridor_slug,
                user_id: user.id,
                bid_amount: String(bidAmount),
            },
            success_url: `${req.nextUrl.origin}/sponsor/success?type=corridor&id=${sponsorship.id}`,
            cancel_url: `${req.nextUrl.origin}/sponsor/checkout?canceled=true`,
        });

        return NextResponse.json({
            checkout_url: session.url,
            session_id: session.id,
            sponsorship_id: sponsorship.id,
            bid_amount: bidAmount,
        });
    } catch (err: any) {
        console.error("[corridors/sponsor/checkout]", err);
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    }
}
