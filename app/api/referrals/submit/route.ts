import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/referrals/submit
 * 
 * Operator refers another operator to the network.
 * Auto-creates their profile + queues claim activation.
 * This is the "Who Else Runs This Corridor?" growth engine.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            referrer_provider_key,
            referred_name,
            referred_phone,
            referred_email,
            referred_corridor,
            referred_county,
            referred_country = "US",
        } = body;

        if (!referrer_provider_key || !referred_name) {
            return NextResponse.json(
                { error: "referrer_provider_key and referred_name required" },
                { status: 400 }
            );
        }

        const sb = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await sb.rpc("hc_submit_referral", {
            p_referrer_provider_key: referrer_provider_key,
            p_referred_name: referred_name,
            p_referred_phone: referred_phone || null,
            p_referred_email: referred_email || null,
            p_referred_corridor: referred_corridor || null,
            p_referred_county: referred_county || null,
            p_referred_country: referred_country,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
