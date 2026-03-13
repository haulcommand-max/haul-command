/**
 * POST /api/admin/trust/anti-gaming
 * Run anti-gaming checks on a user.
 * Body: { user_id: string }
 * 
 * Wires: checkReviewIntegrity, detectLocationSpoofing, 
 *        detectScoreTampering, detectSockPuppets
 */
import { NextRequest, NextResponse } from "next/server";
import {
    checkReviewIntegrity,
    detectLocationSpoofing,
    detectScoreTampering,
    type ThreatDetection,
    type ReviewIntegrityCheck,
} from "@/lib/trust/anti-gaming-engine";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

const ADMIN_SECRET = process.env.HC_ADMIN_SECRET;

export async function POST(req: NextRequest) {
    const auth = req.headers.get("x-admin-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!ADMIN_SECRET || auth !== ADMIN_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const supabase = getSupabaseAdmin();
        const userId = body.user_id;

        if (!userId) {
            return NextResponse.json({ error: "user_id required" }, { status: 400 });
        }

        // Gather user signals
        const [profileRes, reviewsRes, featuresRes] = await Promise.all([
            supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
            supabase.from("hc_reviews").select("*").eq("author_id", userId)
                .order("created_at", { ascending: false }).limit(100),
            supabase.from("hc_trust_features_daily").select("*").eq("account_id", userId)
                .order("computed_at", { ascending: false }).limit(1),
        ]);

        const profile = (profileRes.data ?? {}) as any;
        const reviews = (reviewsRes.data ?? []) as any[];
        const features = (featuresRes.data?.[0] ?? {}) as any;

        const threats: ThreatDetection[] = [];
        const reviewChecks: ReviewIntegrityCheck[] = [];

        // ── Phase 6a: Review Integrity ──
        const latestReview = reviews[0];
        if (latestReview) {
            const todayReviews = reviews.filter((r) => Date.now() - new Date(r.created_at).getTime() < 86400000);
            const reviewAccountAge = Math.floor(
                (Date.now() - new Date(profile.created_at ?? Date.now()).getTime()) / 86400000
            );

            const reviewCheck = checkReviewIntegrity(
                {
                    userId,
                    reviewerAge: reviewAccountAge,
                    reviewerReviewCount: reviews.length,
                    reviewerDevice: features.device_fp ?? "unknown",
                    textLength: latestReview.body?.length ?? 0,
                    hasPhotos: !!latestReview.media_urls?.length,
                    submittedAt: latestReview.created_at,
                    targetId: latestReview.target_id,
                },
                {
                    reviewsInLastHour: todayReviews.filter((r) =>
                        Date.now() - new Date(r.created_at).getTime() < 3600000
                    ).length,
                    sameIpReviews: features.same_ip_reviews ?? 0,
                    sameDeviceReviews: features.same_device_reviews ?? 0,
                    targetRecentReviewCount: features.target_recent_reviews ?? 0,
                    avgRatingDeviation: features.avg_rating_deviation ?? 0,
                }
            );

            reviewChecks.push(reviewCheck);

            if (reviewCheck.verdict !== "pass") {
                threats.push({
                    type: "fake_reviews",
                    severity: reviewCheck.verdict === "fraud" ? "critical" : "medium",
                    confidence: (100 - reviewCheck.integrityScore) / 100,
                    evidence: reviewCheck.signals.map((s) => `${s.name}: ${s.details}`),
                    suggestedAction: reviewCheck.verdict === "fraud" ? "auto_suppress" : "flag_for_review",
                    detectedAt: new Date().toISOString(),
                });
            }
        }

        // ── Phase 6b: Location Spoofing ──
        if (profile.home_base_lat && features.ip_geo_lat) {
            const locThreat = detectLocationSpoofing(
                { lat: profile.home_base_lat, lng: profile.home_base_lng },
                { lat: features.ip_geo_lat, lng: features.ip_geo_lng, accuracy: features.ip_geo_accuracy ?? "city" },
                features.device_timezone ?? "UTC",
                features.expected_timezone ?? "UTC"
            );
            if (locThreat) threats.push(locThreat);
        }

        // ── Phase 6c: Score Tampering ──
        const scoreHistory = features.score_history as { score: number; timestamp: string }[] | undefined;
        if (scoreHistory && scoreHistory.length >= 2) {
            const scoreThreat = detectScoreTampering(scoreHistory);
            if (scoreThreat) threats.push(scoreThreat);
        }

        // Log threats
        if (threats.length > 0) {
            await supabase.from("hc_trust_threat_log").insert(
                threats.map((t) => ({
                    user_id: userId,
                    threat_type: t.type,
                    severity: t.severity,
                    confidence: t.confidence,
                    evidence: t.evidence,
                    suggested_action: t.suggestedAction,
                    detected_at: t.detectedAt,
                }))
            ).then(() => {/* ignore errors for logging */});
        }

        return NextResponse.json({
            ok: true,
            user_id: userId,
            threats_detected: threats.length,
            threats,
            review_checks: reviewChecks,
            risk_level:
                threats.length === 0
                    ? "clean"
                    : threats.some((t) => t.severity === "critical")
                    ? "critical"
                    : threats.some((t) => t.severity === "high")
                    ? "high"
                    : "moderate",
        });
    } catch (err: any) {
        console.error("[anti-gaming]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
