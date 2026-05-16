// app/api/v1/verification/status/route.ts
//
// GET /api/v1/verification/status?user_id=...
// Returns verification tier, signals, next recommended step, and badges.

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { computeVerificationTier } from "@/lib/verification/verification-engine";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id") ?? user.id;

    if (userId !== user.id) {
        const isAdmin = user.app_metadata?.role === "admin" || user.app_metadata?.is_admin === true;
        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }

    const result = await computeVerificationTier(userId);

    // Determine next recommended step
    let nextStep: string | null = null;
    if (!result.signals.face_detected) nextStep = "Upload a clear photo with your face visible";
    else if (!result.signals.social_verified) nextStep = "Link another social account (Google, Facebook, or LinkedIn)";
    else if (!result.signals.liveness_passed) nextStep = "Complete liveness verification for Verified+ badge";
    else if (!result.signals.cert_verified) nextStep = "Upload your certification for Elite Verified status";
    else if (!result.signals.profile_claimed) nextStep = "Complete your profile to reach Elite Verified";

    // Badge eligibility
    const badgeStates = {
        unverified: result.tier === 0,
        face_verified: result.tier >= 1,
        verified_plus: result.tier >= 2,
        liveness_verified: result.tier >= 3,
        elite_verified: result.tier >= 4,
    };

    return NextResponse.json({
        ok: true,
        user_id: userId,
        ...result,
        next_step: nextStep,
        badge_states: badgeStates,
        prompt: result.tier < 2
            ? "Get verified to boost your rank and win more jobs"
            : null,
    });
}
