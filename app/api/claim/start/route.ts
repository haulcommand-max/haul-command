export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

function code6() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
    const body = await req.json();
    const { profileId, phone, email, method } = body as {
        profileId: string;
        phone?: string;
        email?: string;
        method: "sms" | "email";
    };

    if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 });
    if (method === "sms" && !phone) return NextResponse.json({ error: "phone required for SMS" }, { status: 400 });
    if (method === "email" && !email) return NextResponse.json({ error: "email required" }, { status: 400 });

    const verification_code = code6();
    const code_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data, error } = await getSupabase()
        .from("claim_requests")
        .insert({
            profile_id: profileId,
            phone: phone ?? null,
            email: email ?? null,
            verification_method: method,
            verification_code,
            code_expires_at,
            status: "pending",
        })
        .select("id")
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // In production: send via Twilio/Vapi/Postmark
    // In dev: echo the code for testing
    const devEcho = process.env.NODE_ENV !== "production"
        ? { dev_code: verification_code }
        : {};

    console.log(`[CLAIM] Profile ${profileId} claim started via ${method}. Code: ${verification_code}`);

    return NextResponse.json({ claimRequestId: data.id, ...devEcho });
}
