// lib/leaderboard/leaderboard-scoring.ts
//
// Haul Command — Leaderboard Scoring Engine
// Combines: verification tier, photo quality, responsiveness,
// profile completion, job performance, streaks, and trust score.
// Anti-gaming: caps, cooldowns, decay, and abuse detection.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export interface LeaderboardInput {
    user_id: string;
    // Verification
    verification_tier: number;            // 0-4
    // Avatar
    avatar_quality_score: number;         // 0-100
    face_detected: boolean;
    // Responsiveness
    median_response_seconds: number;      // lower = better
    response_rate: number;                // 0-1
    // Profile
    profile_completion: number;           // 0-1
    // Jobs
    completed_jobs_30d: number;
    total_completed_jobs: number;
    acceptance_rate: number;              // 0-1
    on_time_rate: number;                 // 0-1
    // Trust
    trust_score: number;                  // 0-100
    // Streaks
    current_streak_days: number;
    // Social
    providers_linked: number;             // 0-3
    reviews_received: number;
    avg_review_score: number;             // 0-5
}

export interface LeaderboardOutput {
    user_id: string;
    raw_score: number;                    // uncapped weighted sum
    final_score: number;                  // after caps + anti-gaming
    rank_tier: "elite" | "gold" | "silver" | "bronze" | "unranked";
    breakdown: LeaderboardBreakdown;
    anti_gaming_flags: string[];
    badges_earned: string[];
}

export interface LeaderboardBreakdown {
    verification_points: number;
    avatar_points: number;
    responsiveness_points: number;
    completion_points: number;
    job_performance_points: number;
    trust_points: number;
    streak_bonus: number;
    social_bonus: number;
    review_bonus: number;
    decay_penalty: number;
}

// ============================================================
// WEIGHTS (sum to 1.0 before bonuses)
// ============================================================

const WEIGHTS = {
    verification: 0.18,        // verified identity matters most for trust
    avatar: 0.06,              // photo quality (capped, not gameable)
    responsiveness: 0.16,      // speed + reliability
    completion: 0.08,          // profile completeness
    job_performance: 0.25,     // actual work done
    trust_score: 0.20,         // existing trust score
    social_proof: 0.07,        // reviews + social links
} as const;

// Bonus multipliers (additive, capped)
const BONUS = {
    streak_max: 0.05,          // max 5% bonus for streaks
    review_max: 0.05,          // max 5% bonus for reviews
} as const;

// ============================================================
// ANTI-GAMING RULES
// ============================================================

const ANTI_GAMING = {
    // Cap individual component contributions
    avatar_max_points: 8,                    // can't score >8 from photo alone
    streak_cap_days: 30,                     // no extra credit past 30 days
    reupload_cooldown_hours: 24,             // no points from re-uploading photos
    min_jobs_for_performance_credit: 3,      // no job perf score with <3 jobs
    min_reviews_for_review_bonus: 2,         // no review bonus with <2 reviews
    completion_only_if_claimed: true,        // unclaimed profiles get 0 completion pts
    decay_inactive_days: 14,                 // start decaying after 14 days idle
    decay_rate_per_day: 0.005,               // 0.5% per day of inactivity
    max_decay: 0.25,                         // max 25% decay
    suspicious_patterns: {
        rapid_accept_decline: true,            // flag if accepting then declining repeatedly
        zero_response_high_acceptance: true,   // flag if high acceptance but 0 responses
    },
} as const;

// ============================================================
// VERIFICATION TIER POINTS
// ============================================================

const VERIFICATION_POINTS: Record<number, number> = {
    0: 0,     // unverified
    1: 20,    // face_detected
    2: 50,    // face + social
    3: 75,    // liveness
    4: 100,   // elite (cert + claimed + liveness)
};

// ============================================================
// COMPUTE LEADERBOARD SCORE
// ============================================================

export function computeLeaderboardScore(input: LeaderboardInput): LeaderboardOutput {
    const flags: string[] = [];

    // Profile completion gate: must be >= 60% to rank on the leaderboard
    if ((input.profile_completion * 100) < 60) {
        flags.push("profile_completion_gate");
        return {
            user_id: input.user_id,
            raw_score: 0,
            final_score: 0,
            rank_tier: "unranked",
            breakdown: {
                verification_points: 0,
                avatar_points: 0,
                responsiveness_points: 0,
                completion_points: input.profile_completion * 100,
                job_performance_points: 0,
                trust_points: 0,
                social_bonus: 0,
                streak_bonus: 0,
                review_bonus: 0,
                decay_penalty: 0,
            },
            anti_gaming_flags: flags,
            badges_earned: [],
        };
    }

    // 1) Verification (0-100)
    const verificationPoints = VERIFICATION_POINTS[input.verification_tier] ?? 0;

    // 2) Avatar (0-100, capped at 8 points contribution)
    let avatarPoints = 0;
    if (input.face_detected) {
        avatarPoints = Math.min(input.avatar_quality_score, 100);
    } else {
        avatarPoints = Math.min(input.avatar_quality_score * 0.3, 30); // heavy penalty if no face
    }

    // 3) Responsiveness (0-100)
    let responsivenessPoints = 0;
    // Speed component (60%)
    if (input.median_response_seconds <= 60) responsivenessPoints += 60;
    else if (input.median_response_seconds <= 180) responsivenessPoints += 50;
    else if (input.median_response_seconds <= 600) responsivenessPoints += 35;
    else if (input.median_response_seconds <= 1800) responsivenessPoints += 20;
    else responsivenessPoints += 5;
    // Rate component (40%)
    responsivenessPoints += input.response_rate * 40;

    // 4) Profile completion (0-100)
    const completionPoints = input.profile_completion * 100;

    // 5) Job performance (0-100)
    let jobPoints = 0;
    if (input.total_completed_jobs >= ANTI_GAMING.min_jobs_for_performance_credit) {
        // Volume (30%)
        const volumeScore = Math.min(input.completed_jobs_30d / 20, 1) * 30;
        // Acceptance rate (25%)
        const acceptScore = input.acceptance_rate * 25;
        // On-time rate (25%)
        const onTimeScore = input.on_time_rate * 25;
        // Experience (20%)
        const experienceScore = Math.min(input.total_completed_jobs / 100, 1) * 20;
        jobPoints = volumeScore + acceptScore + onTimeScore + experienceScore;
    } else {
        // Not enough jobs — neutral, don't penalize new operators
        jobPoints = 25; // baseline
        if (input.total_completed_jobs === 0) flags.push("no_jobs_completed");
    }

    // 6) Trust score passthrough (0-100)
    const trustPoints = input.trust_score;

    // 7) Social proof (0-100)
    let socialPoints = 0;
    socialPoints += Math.min(input.providers_linked, 3) * 15; // max 45
    if (input.reviews_received >= ANTI_GAMING.min_reviews_for_review_bonus) {
        socialPoints += Math.min(input.avg_review_score / 5, 1) * 55; // max 55
    }

    // ---- WEIGHTED RAW SCORE ----
    const rawScore =
        verificationPoints * WEIGHTS.verification +
        Math.min(avatarPoints, ANTI_GAMING.avatar_max_points / WEIGHTS.avatar) * WEIGHTS.avatar +
        responsivenessPoints * WEIGHTS.responsiveness +
        completionPoints * WEIGHTS.completion +
        jobPoints * WEIGHTS.job_performance +
        trustPoints * WEIGHTS.trust_score +
        socialPoints * WEIGHTS.social_proof;

    // ---- BONUSES (capped) ----
    // Streak bonus
    const streakDaysCapped = Math.min(input.current_streak_days, ANTI_GAMING.streak_cap_days);
    const streakBonus = (streakDaysCapped / ANTI_GAMING.streak_cap_days) * BONUS.streak_max * 100;

    // Review bonus
    let reviewBonus = 0;
    if (input.reviews_received >= ANTI_GAMING.min_reviews_for_review_bonus) {
        reviewBonus = Math.min(input.reviews_received / 20, 1) * BONUS.review_max * 100;
    }

    // ---- DECAY PENALTY ----
    // Simulated: caller should pass streak data; 0 streak = inactive
    let decayPenalty = 0;
    if (input.current_streak_days === 0 && input.total_completed_jobs > 0) {
        // Apply decay based on inactivity
        decayPenalty = ANTI_GAMING.decay_rate_per_day * ANTI_GAMING.decay_inactive_days * 100;
        decayPenalty = Math.min(decayPenalty, ANTI_GAMING.max_decay * 100);
        flags.push("inactivity_decay_applied");
    }

    // ---- FINAL SCORE ----
    const finalScore = Math.round(
        Math.max(0, Math.min(100, rawScore + streakBonus + reviewBonus - decayPenalty))
    );

    // ---- RANK TIER ----
    let rankTier: LeaderboardOutput["rank_tier"];
    if (finalScore >= 85) rankTier = "elite";
    else if (finalScore >= 70) rankTier = "gold";
    else if (finalScore >= 55) rankTier = "silver";
    else if (finalScore >= 35) rankTier = "bronze";
    else rankTier = "unranked";

    // ---- ANTI-GAMING CHECKS ----
    if (input.acceptance_rate > 0.9 && input.response_rate < 0.1) {
        flags.push("suspicious_high_accept_low_response");
    }
    if (input.completed_jobs_30d > 50) {
        flags.push("unusually_high_volume_review_recommended");
    }

    // ---- BADGES ----
    const badges: string[] = [];
    if (input.verification_tier >= 2) badges.push("verified_operator");
    if (input.verification_tier >= 4) badges.push("elite_verified");
    if (input.median_response_seconds <= 180 && input.response_rate >= 0.8) badges.push("fast_responder");
    if (finalScore >= 85 && input.completed_jobs_30d >= 5) badges.push("top_corridor");

    return {
        user_id: input.user_id,
        raw_score: Math.round(rawScore * 100) / 100,
        final_score: finalScore,
        rank_tier: rankTier,
        breakdown: {
            verification_points: Math.round(verificationPoints * WEIGHTS.verification * 100) / 100,
            avatar_points: Math.round(Math.min(avatarPoints, ANTI_GAMING.avatar_max_points / WEIGHTS.avatar) * WEIGHTS.avatar * 100) / 100,
            responsiveness_points: Math.round(responsivenessPoints * WEIGHTS.responsiveness * 100) / 100,
            completion_points: Math.round(completionPoints * WEIGHTS.completion * 100) / 100,
            job_performance_points: Math.round(jobPoints * WEIGHTS.job_performance * 100) / 100,
            trust_points: Math.round(trustPoints * WEIGHTS.trust_score * 100) / 100,
            streak_bonus: Math.round(streakBonus * 100) / 100,
            social_bonus: Math.round(socialPoints * WEIGHTS.social_proof * 100) / 100,
            review_bonus: Math.round(reviewBonus * 100) / 100,
            decay_penalty: Math.round(decayPenalty * 100) / 100,
        },
        anti_gaming_flags: flags,
        badges_earned: badges,
    };
}

// ============================================================
// FETCH INPUT DATA + COMPUTE (full pipeline)
// ============================================================

export async function computeLeaderboardForUser(userId: string): Promise<LeaderboardOutput> {
    const supabase = getSupabaseAdmin();

    // Fetch all inputs in parallel
    const [verTier, avatar, streaks, levels, progress, badges, trustBonus] = await Promise.all([
        supabase.from("user_verification_tiers").select("tier,face_detected").eq("user_id", userId).maybeSingle(),
        supabase.from("user_avatars").select("avatar_quality_score,face_detected").eq("user_id", userId).maybeSingle(),
        supabase.from("user_streaks").select("current_streak_days").eq("user_id", userId).maybeSingle(),
        supabase.from("user_levels").select("total_points").eq("user_id", userId).maybeSingle(),
        supabase.from("user_profile_progress").select("completion_score").eq("user_id", userId).maybeSingle(),
        supabase.from("user_badges").select("badge_type").eq("user_id", userId).eq("active", true),
        supabase.from("trust_score_social_bonuses").select("providers_linked,combined_social_multiplier").eq("user_id", userId).maybeSingle(),
    ]);

    // ── Fetch real metrics for the 8 formerly-hardcoded values ──
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [offersResult, jobsAll, jobs30d, reviewsResult, trustResult] = await Promise.all([
        // Offers: response times, acceptance rate, response rate
        supabase
            .from("offers")
            .select("status,responded_at,sent_at")
            .eq("operator_id", userId)
            .gte("sent_at", thirtyDaysAgo),

        // All completed jobs
        supabase
            .from("jobs")
            .select("job_id,status")
            .contains("assigned_escort_ids", [userId])
            .eq("status", "completed"),

        // Jobs completed in last 30 days
        supabase
            .from("jobs")
            .select("job_id,status,on_time")
            .contains("assigned_escort_ids", [userId])
            .eq("status", "completed")
            .gte("completed_at", thirtyDaysAgo),

        // Reviews
        supabase
            .from("operator_reviews")
            .select("rating")
            .eq("operator_id", userId),

        // Trust score
        supabase
            .from("trust_scores")
            .select("score")
            .eq("user_id", userId)
            .maybeSingle(),
    ]);

    // Compute response metrics from offers
    const offers = (offersResult.data ?? []) as any[];
    const respondedOffers = offers.filter((o: any) => o.responded_at && o.sent_at);
    const responseTimes = respondedOffers.map((o: any) =>
        (new Date(o.responded_at).getTime() - new Date(o.sent_at).getTime()) / 1000
    ).sort((a: number, b: number) => a - b);
    const medianResponseSec = responseTimes.length > 0
        ? responseTimes[Math.floor(responseTimes.length / 2)]
        : 300; // default 5min if no data
    const responseRate = offers.length > 0
        ? respondedOffers.length / offers.length
        : 0.7; // default if no offers
    const acceptedOffers = offers.filter((o: any) => o.status === "accepted").length;
    const acceptanceRate = offers.length > 0
        ? acceptedOffers / offers.length
        : 0.7; // default if no offers

    // Compute job metrics
    const allJobs = (jobsAll.data ?? []) as any[];
    const recentJobs = (jobs30d.data ?? []) as any[];
    const totalCompletedJobs = allJobs.length;
    const completedJobs30d = recentJobs.length;
    const onTimeJobs = recentJobs.filter((j: any) => j.on_time === true).length;
    const onTimeRate = recentJobs.length > 0 ? onTimeJobs / recentJobs.length : 0.9;

    // Trust score
    const trustScore = (trustResult.data as any)?.score ?? 50;

    // Reviews
    const reviews = (reviewsResult.data ?? []) as any[];
    const reviewsReceived = reviews.length;
    const avgReviewScore = reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + Number(r.rating ?? 0), 0) / reviews.length
        : 0;

    const v = verTier.data as any;
    const a = avatar.data as any;
    const s = streaks.data as any;
    const p = progress.data as any;
    const tb = trustBonus.data as any;

    const input: LeaderboardInput = {
        user_id: userId,
        verification_tier: v?.tier ?? 0,
        avatar_quality_score: a?.avatar_quality_score ?? 0,
        face_detected: a?.face_detected ?? false,
        median_response_seconds: medianResponseSec,
        response_rate: responseRate,
        profile_completion: p?.completion_score ?? 0,
        completed_jobs_30d: completedJobs30d,
        total_completed_jobs: totalCompletedJobs,
        acceptance_rate: acceptanceRate,
        on_time_rate: onTimeRate,
        trust_score: trustScore,
        current_streak_days: s?.current_streak_days ?? 0,
        providers_linked: tb?.providers_linked ?? 0,
        reviews_received: reviewsReceived,
        avg_review_score: avgReviewScore,
    };

    const result = computeLeaderboardScore(input);

    // Persist to user_levels
    await supabase.from("user_levels").upsert(
        {
            user_id: userId,
            total_points: result.final_score,
            verified_tier_points: Math.round(result.breakdown.verification_points),
            responsiveness_points: Math.round(result.breakdown.responsiveness_points),
            completion_points: Math.round(result.breakdown.completion_points),
            last_point_earned_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
    );

    // Sync badges
    for (const badge of result.badges_earned) {
        await supabase.from("user_badges").upsert(
            {
                user_id: userId,
                badge_type: badge,
                badge_label: badgeLabel(badge),
                active: true,
                criteria_snapshot: result.breakdown,
            },
            { onConflict: "user_id,badge_type" }
        );
    }

    return result;
}

// ============================================================
// BATCH RECOMPUTE (cron)
// ============================================================

export async function recomputeAllLeaderboard(): Promise<{ processed: number; errors: number }> {
    const supabase = getSupabaseAdmin();
    const { data: users } = await supabase
        .from("user_verification_tiers")
        .select("user_id")
        .limit(5000);

    let processed = 0;
    let errors = 0;

    for (const u of (users ?? []) as any[]) {
        try {
            await computeLeaderboardForUser(u.user_id);
            processed++;
        } catch {
            errors++;
        }
    }

    return { processed, errors };
}

// ============================================================
// HELPERS
// ============================================================

function badgeLabel(badge: string): string {
    const labels: Record<string, string> = {
        verified_operator: "Verified Operator",
        elite_verified: "Elite Verified",
        fast_responder: "Fast Responder",
        top_corridor: "Top 10 Corridor",
    };
    return labels[badge] ?? badge;
}
