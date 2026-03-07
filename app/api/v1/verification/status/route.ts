// app/api/v1/verification/status/route.ts
//
// GET /api/v1/verification/status?user_id=...
// Returns verification tier, signals, next recommended step, and badges.

import { NextResponse } from "next/server";
import { computeVerificationTier } from "@/lib/verification/verification-engine";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");

    if (!userId) {
        return NextResponse.json({ error: "user_id required" }, { status: 400 });
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
