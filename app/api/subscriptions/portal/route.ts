// app/api/subscriptions/portal/route.ts
//
// Creates a Stripe Customer Portal session for self-service
// subscription management (upgrade, downgrade, cancel, update payment).

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/enterprise/stripe/client";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("stripe_customer_id")
            .eq("id", user.id)
            .single();

        if (!profile?.stripe_customer_id) {
            return NextResponse.json(
                { error: "No subscription found. Please subscribe first." },
                { status: 400 }
            );
        }

        const stripe = getStripe();

        const body = await req.json().catch(() => ({}));
        const returnUrl = body.return_url || `${req.nextUrl.origin}/settings/subscription`;

        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: returnUrl,
        });

        return NextResponse.json({ portal_url: session.url });
    } catch (err: any) {
        console.error("[subscriptions/portal] Error:", err);
        return NextResponse.json(
            { error: err.message || "Internal error" },
            { status: 500 }
        );
    }
}
