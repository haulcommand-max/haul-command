/**
 * Trust Score Compute API — Phase 2 Scoring RPC
 * 
 * POST /api/admin/trust/compute
 * Body: { account_id: string } or { batch: string[] }
 * 
 * Computes trust score using the 3-Layer Composite Trust Engine
 * and persists results to composite_trust_scores.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";
import { computeTrustScore, type TrustInput, type TrustResult, applyInactivityDecay } from "@/lib/trust/trust-score-v3";

const ADMIN_SECRET = process.env.HC_ADMIN_SECRET;

export async function POST(req: NextRequest) {
    // Auth check
    const auth = req.headers.get("x-admin-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!ADMIN_SECRET || auth !== ADMIN_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const supabase = getSupabaseAdmin();

        // Single compute
        if (body.account_id) {
            const result = await computeSingleTrustScore(supabase, body.account_id);
            return NextResponse.json({ success: true, result });
        }

        // Batch compute
        if (body.batch && Array.isArray(body.batch)) {
            const batchIds = body.batch as string[];
            const results: TrustResult[] = [];
            const errors: { account_id: string; error: string }[] = [];

            // Process in chunks of 10 to avoid overloading
            const chunks = chunkArray(batchIds, 10);
            for (const chunk of chunks) {
                const chunkResults = await Promise.allSettled(
                    chunk.map((id) => computeSingleTrustScore(supabase, id))
                );
                for (let i = 0; i < chunkResults.length; i++) {
                    const r = chunkResults[i];
                    if (r.status === 'fulfilled') {
                        results.push(r.value);
                    } else {
                        errors.push({ account_id: chunk[i], error: r.reason?.message || 'Unknown error' });
                    }
                }
            }

            return NextResponse.json({
                success: true,
                computed: results.length,
                errors: errors.length,
                results,
                error_details: errors,
            });
        }

        return NextResponse.json({ error: "Provide account_id or batch" }, { status: 400 });

    } catch (err: any) {
        console.error("[trust-compute]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

async function computeSingleTrustScore(supabase: any, accountId: string): Promise<TrustResult> {
    // Gather inputs from various tables
    const [profileData, activityData, reviewData] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", accountId).maybeSingle(),
        supabase.from("hc_trust_features_daily").select("*").eq("account_id", accountId).order("computed_at", { ascending: false }).limit(1),
        supabase.from("hc_reviews").select("rating, weighted_score, created_at").eq("target_id", accountId).eq("is_published", true),
    ]);

    const profile = profileData.data ?? {};
    const features = activityData.data?.[0] ?? {};
    const reviews = reviewData.data ?? [];

    // Build TrustInput from available signals
    const input: TrustInput = {
        account_id: accountId,
        country_iso2: profile.country_code || 'US',
        admin1: profile.home_base_state,

        // Identity signals
        phone_verified: !!profile.phone_verified || !!features.phone_verified,
        govt_id_verified: !!features.govt_id_verified,
        business_verified: !!features.business_verified,

        // Profile signals
        profile_fields_complete_ratio: profile.profile_completeness ? profile.profile_completeness / 100 : 0.2,
        service_area_defined: !!(profile.coverage_radius_miles || profile.service_radius_miles),
        escort_types_defined: !!(profile.can_height_pole || profile.can_route_survey || profile.can_steering),

        // Responsiveness
        median_reply_minutes: features.median_reply_minutes ?? 120,
        reply_rate_24h: features.reply_rate_24h ?? 0.3,

        // Completion signals
        verified_completions_30d: features.verified_completions_30d ?? profile.completed_escorts ?? 0,
        verified_completions_180d: features.verified_completions_180d ?? (profile.completed_escorts ?? 0) * 3,
        cancellation_rate: features.cancellation_rate ?? 0.05,

        // Ledger signals
        ledger_reliability_score: features.ledger_reliability ?? profile.reliability_score ?? 0.5,
        paid_attestations_ratio: features.paid_attestations_ratio ?? 0.3,
        dispute_rate: features.dispute_rate ?? 0.02,

        // Community signals
        peer_endorsements_weighted: features.peer_endorsements_weighted ?? 0.2,
        report_rate: features.report_rate ?? 0.01,

        // Anti-gaming
        sybil_risk: features.sybil_risk ?? 0,
        anomaly_score: features.anomaly_score ?? 0,
    };

    const result = computeTrustScore(input);

    // Apply inactivity decay if applicable
    const daysSinceActive = features.days_since_last_active ?? 0;
    if (daysSinceActive > 45) {
        result.trust_score = applyInactivityDecay(result.trust_score, daysSinceActive);
    }

    // Persist to hc_trust_score_breakdown (upsert)
    await supabase.from("hc_trust_score_breakdown").upsert({
        account_id: accountId,
        trust_score: result.trust_score,
        trust_tier: result.trust_tier,
        identity_verification: result.identity_verification,
        profile_completeness: result.profile_completeness,
        responsiveness: result.responsiveness,
        completion_quality: result.completion_quality,
        ledger_reliability: result.ledger_reliability,
        community_signal: result.community_signal,
        anti_gaming_health: result.anti_gaming_health,
        country_iso2: input.country_iso2,
        computed_at: new Date().toISOString(),
    }, { onConflict: "account_id" });

    return result;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}
