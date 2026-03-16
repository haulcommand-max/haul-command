/**
 * POST /api/admin/trust/fraud-scan
 * Scan reviews for fraud signals.
 * Body: { target_id?: string, limit?: number }
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { detectReviewFraud, type FraudSignals } from "@/lib/trust/fraud-detection";

const ADMIN_SECRET = process.env.HC_ADMIN_SECRET;

export async function POST(req: NextRequest) {
    const auth = req.headers.get("x-admin-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!ADMIN_SECRET || auth !== ADMIN_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const supabase = getSupabaseAdmin();
        const limit = Math.min(body.limit ?? 50, 200);

        let query = supabase
            .from("hc_reviews")
            .select("*, profiles!hc_reviews_author_id_fkey(id, trust_score, created_at)")
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (body.target_id) {
            query = query.eq("target_id", body.target_id);
        }

        const { data: reviews, error } = await query;
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const results = (reviews ?? []).map((review: any) => {
            const authorProfile = review.profiles ?? {};
            const authorAge = authorProfile.created_at
                ? Math.floor((Date.now() - new Date(authorProfile.created_at).getTime()) / 86400000)
                : 0;

            const signals: FraudSignals = {
                reviewerReviewsToday: 1,
                reviewerTotalReviews: 5,
                reviewerAccountAgeDays: authorAge,
                reviewerTrustScore: authorProfile.trust_score ?? 500,
                textSimilarityToOtherReviews: 0,
                sentimentExtreme: review.rating === 5 || review.rating === 1,
                repeatedPhraseScore: 0,
                sharedIpWithProvider: false,
                sameDeviceFingerprint: false,
                reviewerProviderGraphDensity: 0,
                burstPatternDetected: false,
                offHoursAnomaly: false,
            };

            const result = detectReviewFraud(signals);

            return {
                review_id: review.id,
                author_id: review.author_id,
                target_id: review.target_id,
                rating: review.rating,
                fraud_probability: result.fraudScore,
                recommended_action: result.action,
                risk_factors: result.signals,
            };
        });

        const flagged = results.filter((r: any) => r.fraud_probability >= 0.45);
        const autoHold = results.filter((r: any) => r.fraud_probability >= 0.85);

        // Auto-hold high-probability fraud reviews
        if (autoHold.length > 0) {
            await supabase
                .from("hc_reviews")
                .update({ is_published: false, moderation_status: "held_by_fraud_scan" })
                .in(
                    "id",
                    autoHold.map((r: any) => r.review_id)
                );
        }

        return NextResponse.json({
            ok: true,
            scanned: results.length,
            flagged: flagged.length,
            auto_held: autoHold.length,
            results: flagged,
        });
    } catch (err: any) {
        console.error("[fraud-scan]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
