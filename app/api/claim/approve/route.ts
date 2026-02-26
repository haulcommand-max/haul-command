export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(req: Request) {
    const { claimRequestId, userId } = await req.json();

    if (!claimRequestId || !userId) {
        return NextResponse.json({ error: "claimRequestId and userId required" }, { status: 400 });
    }

    const { data: claim, error: claimErr } = await getSupabase()
        .from("claim_requests")
        .select("id,status,profile_id")
        .eq("id", claimRequestId)
        .single();

    if (claimErr || !claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    if (claim.status !== "verified") {
        return NextResponse.json({ error: "Must verify identity first before approving." }, { status: 400 });
    }

    // Assign profile ownership to this user
    const { error: profileErr } = await getSupabase()
        .from("profiles")
        .update({ user_id: userId, verified: true })
        .eq("id", claim.profile_id);

    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });

    await getSupabase()
        .from("claim_requests")
        .update({ status: "approved" })
        .eq("id", claimRequestId);

    return NextResponse.json({ ok: true, profileId: claim.profile_id });
}
