// lib/verification/verification-engine.ts
//
// Human Verification Tier Engine
// Computes 5-tier verification from accumulated signals.
// Powers trust score bonuses, badge eligibility, and marketplace gates.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TIER DEFINITIONS
// ============================================================

const TIER_LABELS: Record<number, string> = {
    0: "unverified",
    1: "face_verified",
    2: "verified_plus",
    3: "liveness_verified",
    4: "elite_verified",
};

const TIER_TRUST_BONUS: Record<number, number> = {
    0: 0,
    1: 8,
    2: 18,
    3: 30,
    4: 45,
};

// ============================================================
// COMPUTE VERIFICATION TIER
// ============================================================

export async function computeVerificationTier(userId: string): Promise<{
    tier: number;
    tier_label: string;
    trust_bonus: number;
    signals: Record<string, boolean>;
}> {
    const supabase = getSupabaseAdmin();

    // Fetch all signals
    const { data: signals } = await supabase
        .from("human_verification_signals")
        .select("signal_type,strength")
        .eq("user_id", userId);

    const allSignals = (signals ?? []) as any[];

    // Aggregate by type (take max strength per type)
    const signalMap: Record<string, number> = {};
    for (const s of allSignals) {
        signalMap[s.signal_type] = Math.max(signalMap[s.signal_type] ?? 0, s.strength);
    }

    const faceDetected = (signalMap.face_detected ?? 0) > 10;
    const socialVerified = (signalMap.social_consistency ?? 0) > 0;
    const livenessPassed = (signalMap.liveness_passed ?? 0) > 30;

    // Check profile claimed + cert verified
    const { data: profile } = await supabase
        .from("user_profile_progress")
        .select("completion_score")
        .eq("user_id", userId)
        .maybeSingle();

    const profileClaimed = ((profile as any)?.completion_score ?? 0) > 0.3;

    const { data: certs } = await supabase
        .from("operator_certifications")
        .select("id")
        .eq("operator_id", userId)
        .eq("verification_status", "verified")
        .limit(1);

    const certVerified = ((certs ?? []) as any[]).length > 0;

    // Tier computation
    let tier = 0;
    if (faceDetected) tier = 1;
    if (faceDetected && socialVerified) tier = 2;
    if (livenessPassed) tier = 3;
    if (livenessPassed && certVerified && profileClaimed) tier = 4;

    const result = {
        tier,
        tier_label: TIER_LABELS[tier] ?? "unverified",
        trust_bonus: TIER_TRUST_BONUS[tier] ?? 0,
        signals: {
            face_detected: faceDetected,
            social_verified: socialVerified,
            liveness_passed: livenessPassed,
            cert_verified: certVerified,
            profile_claimed: profileClaimed,
        },
    };

    // Persist
    await supabase.from("user_verification_tiers").upsert(
        {
            user_id: userId,
            tier: result.tier,
            tier_label: result.tier_label,
            trust_score_bonus: result.trust_bonus,
            face_detected: faceDetected,
            social_verified: socialVerified,
            liveness_passed: livenessPassed,
            cert_verified: certVerified,
            profile_claimed: profileClaimed,
            computed_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
    );

    return result;
}

// ============================================================
// WRITE SIGNAL
// ============================================================

export async function writeVerificationSignal(
    userId: string,
    signalType: string,
    strength: number,
    evidence?: Record<string, any>
): Promise<void> {
    const supabase = getSupabaseAdmin();
    await supabase.from("human_verification_signals").insert({
        user_id: userId,
        signal_type: signalType,
        strength,
        evidence_json: evidence ?? {},
    });

    // Recompute tier
    await computeVerificationTier(userId);
}
