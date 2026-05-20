export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendRoutedNotification } from '@/lib/notifications/channelRouter';
import { requireAdminRequest } from '@/lib/security/admin-request-auth';


export async function POST(req: Request) {
    const authFailure = await requireAdminRequest();
    if (authFailure) return authFailure;

    const { claimRequestId } = await req.json();

    if (!claimRequestId) {
        return NextResponse.json({ error: "claimRequestId required" }, { status: 400 });
    }

    const { data: claim, error: claimErr } = await getSupabaseAdmin()
        .from("claim_requests")
        .select("id,status,profile_id,requester_user_id")
        .eq("id", claimRequestId)
        .single();

    if (claimErr || !claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    if (claim.status !== "verified") {
        return NextResponse.json({ error: "Must verify identity first before approving." }, { status: 400 });
    }
    if (!claim.requester_user_id) {
        return NextResponse.json({ error: "Claim is missing requester ownership context." }, { status: 400 });
    }

    // Assign profile ownership to this user
    const { error: profileErr } = await getSupabaseAdmin()
        .from("profiles")
        .update({ user_id: claim.requester_user_id, verified: true })
        .eq("id", claim.profile_id);

    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });

    await getSupabaseAdmin()
        .from("claim_requests")
        .update({ status: "approved" })
        .eq("id", claimRequestId);

    await sendRoutedNotification(claim.requester_user_id, {
        type: 'claim_approval',
        urgency: 'high',
        title: 'Profile Claim Approved',
        body: 'Your identity has been verified and you now have full access to your business profile.',
        url: `/dashboard/operator/profile`,
    }).catch(() => { /* best-effort */ });

    return NextResponse.json({ ok: true, profileId: claim.profile_id });
}
