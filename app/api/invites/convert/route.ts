export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// POST /api/invites/convert
// { token: string, broker_user_id: string }
// Called after broker completes signup — marks invite as converted and links accounts
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json().catch(() => ({}));
    const { token, broker_user_id } = body;
    const userId = broker_user_id ?? user?.id;

    if (!token || !userId) {
        return NextResponse.json({ error: "token and broker_user_id required" }, { status: 400 });
    }

    // Find the invite
    const { data: invite, error: findErr } = await supabase
        .from("escort_invite_links")
        .select("id, escort_id, converted_at, expires_at")
        .eq("token", token)
        .single();

    if (findErr || !invite) {
        return NextResponse.json({ error: "Invalid invite token" }, { status: 404 });
    }

    if (invite.converted_at) {
        return NextResponse.json({ ok: true, message: "Already converted" });
    }

    const isExpired = invite.expires_at && new Date(invite.expires_at) < new Date();
    if (isExpired) {
        return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    // Mark as converted
    await supabase
        .from("escort_invite_links")
        .update({
            converted_at: new Date().toISOString(),
            broker_user_id: userId,
        })
        .eq("id", invite.id);

    // Award the escort a "referred_broker" badge if they don't already have it
    await supabase
        .from("profile_badges")
        .upsert({
            profile_id: invite.escort_id,
            badge_slug: "fast_responder",
            awarded_at: new Date().toISOString(),
            source: "broker_referral",
        }, { onConflict: "profile_id,badge_slug" });

    // Log conversion event
    await supabase
        .from("admin_events")
        .insert({
            event_type: "invite_converted",
            actor_id: userId,
            metadata: {
                escort_id: invite.escort_id,
                invite_id: invite.id,
                token,
            },
        })
        .single();

    return NextResponse.json({ ok: true, escort_id: invite.escort_id });
}
