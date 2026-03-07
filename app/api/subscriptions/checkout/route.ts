// app/api/subscriptions/checkout/route.ts
//
// Creates a Stripe Checkout session for directory or mobile subscriptions.
// Resolves price via lookup key, applies PPP, enforces cost floor.

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/enterprise/stripe/client";
import { createClient } from "@/utils/supabase/server";
import {
    getPlanByLookupKey,
    getLocalizedPrice,
} from "@/lib/subscriptions/pricing-config";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { lookup_key, country_code, success_url, cancel_url } = body;

        if (!lookup_key) {
            return NextResponse.json({ error: "lookup_key required" }, { status: 400 });
        }

        // Auth check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get plan config
        const plan = getPlanByLookupKey(lookup_key);
        if (!plan || plan.base_price_usd === 0) {
            return NextResponse.json({ error: "Invalid plan or free tier" }, { status: 400 });
        }

        // Compute localized price
        const cc = country_code || "US";
        const localPrice = getLocalizedPrice(plan.base_price_usd, cc);
        const priceInCents = Math.round(localPrice * 100);

        const stripe = getStripe();

        // Check if customer already exists
        const { data: profile } = await supabase
            .from("profiles")
            .select("stripe_customer_id")
            .eq("id", user.id)
            .single();

        let customerId = profile?.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    supabase_user_id: user.id,
                    country_code: cc,
                },
            });
            customerId = customer.id;

            // Store customer ID
            await supabase
                .from("profiles")
                .update({ stripe_customer_id: customerId })
                .eq("id", user.id);
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: plan.name,
                            description: plan.tagline,
                            metadata: {
                                platform: plan.platform,
                                tier: plan.tier,
                                lookup_key: plan.stripe_price_lookup_key,
                            },
                        },
                        unit_amount: priceInCents,
                        recurring: {
                            interval: "month",
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                user_id: user.id,
                platform: plan.platform,
                tier: plan.tier,
                country_code: cc,
                lookup_key: plan.stripe_price_lookup_key,
            },
            success_url: success_url || `${req.nextUrl.origin}/settings/subscription?success=true`,
            cancel_url: cancel_url || `${req.nextUrl.origin}/pricing?canceled=true`,
            subscription_data: {
                metadata: {
                    user_id: user.id,
                    platform: plan.platform,
                    tier: plan.tier,
                    country_code: cc,
                },
            },
            allow_promotion_codes: true,
        });

        return NextResponse.json({
            checkout_url: session.url,
            session_id: session.id,
        });
    } catch (err: any) {
        console.error("[subscriptions/checkout] Error:", err);
        return NextResponse.json(
            { error: err.message || "Internal error" },
            { status: 500 }
        );
    }
}
