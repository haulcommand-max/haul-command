export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';


export async function POST(req: Request) {
    const { claimRequestId, code } = await req.json();

    if (!claimRequestId || !code) {
        return NextResponse.json({ error: "claimRequestId and code required" }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
        .from("claim_requests")
        .select("id,verification_code,code_expires_at,status")
        .eq("id", claimRequestId)
        .single();

    if (error || !data) return NextResponse.json({ error: "Claim request not found" }, { status: 404 });
    if (data.status !== "pending") return NextResponse.json({ error: "Invalid claim status" }, { status: 400 });
    if (new Date(data.code_expires_at).getTime() < Date.now()) {
        return NextResponse.json({ error: "Verification code expired. Please restart." }, { status: 400 });
    }
    if (String(code).trim() !== String(data.verification_code).trim()) {
        return NextResponse.json({ error: "Wrong code. Double-check your message." }, { status: 400 });
    }

    const { error: upErr } = await getSupabaseAdmin()
        .from("claim_requests")
        .update({ status: "verified", verified_at: new Date().toISOString() })
        .eq("id", claimRequestId);

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, message: "Identity verified successfully." });
}
