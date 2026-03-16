// app/api/v1/marketplace/offers/expire/route.ts
//
// POST /api/v1/marketplace/offers/expire
// Cron job: expire stale offers past their deadline, advance cascade if needed.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { runMatchPipeline, cascadeFallback, rankCandidates, determineOfferStrategy } from "@/lib/marketplace/match-engine";

export const runtime = "nodejs";

export async function POST() {
    const supabase = getSupabaseAdmin();

    // 1) Expire stale offers via DB function
    const { data: expiredCount, error: expErr } = await supabase.rpc("expire_stale_offers");
    if (expErr) return NextResponse.json({ error: expErr.message }, { status: 500 });

    // 2) Find load requests that are still "matching" but have NO remaining "sent" offers
    //    These need cascade fallback.
    const { data: pendingLoads, error: plErr } = await supabase
        .from("load_requests")
        .select("request_id,country_code,admin1_code,origin_lat,origin_lon,destination_lat,destination_lon,pickup_time_window,load_type_tags,required_escort_count,special_requirements,broker_id,carrier_id,budget_range,cross_border_flag")
        .eq("status", "matching")
        .limit(50);

    if (plErr) return NextResponse.json({ error: plErr.message }, { status: 500 });

    const cascadeResults: any[] = [];

    for (const load of (pendingLoads ?? []) as any[]) {
        // Check if any sent offers remain
        const { data: sentOffers } = await supabase
            .from("offers")
            .select("offer_id")
            .eq("request_id", load.request_id)
            .eq("status", "sent")
            .limit(1);

        if (sentOffers && sentOffers.length > 0) continue; // still has active offers

        // Check if enough accepted
        const { data: acceptedOffers } = await supabase
            .from("offers")
            .select("offer_id")
            .eq("request_id", load.request_id)
            .eq("status", "accepted");

        const acceptedCount = (acceptedOffers ?? []).length;
        const requiredCount = load.required_escort_count ?? 1;

        if (acceptedCount >= requiredCount) continue; // already filled

        // Determine current cascade round
        const { data: lastRun } = await supabase
            .from("match_runs")
            .select("cascade_round")
            .eq("request_id", load.request_id)
            .order("computed_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        const currentRound = ((lastRun as any)?.cascade_round ?? 0) + 1;

        // Get all previously offered operator IDs
        const { data: allOffers } = await supabase
            .from("offers")
            .select("operator_id")
            .eq("request_id", load.request_id);

        const previousIds = new Set<string>((allOffers ?? []).map((o: any) => o.operator_id));

        // Attempt cascade
        const cascade = await cascadeFallback(load, currentRound - 1, previousIds);

        if (!cascade || cascade.newCandidates.length === 0) {
            // No more candidates — mark as expired
            await supabase
                .from("load_requests")
                .update({ status: "expired", updated_at: new Date().toISOString() })
                .eq("request_id", load.request_id);

            cascadeResults.push({
                request_id: load.request_id,
                action: "expired",
                reason: "no_candidates_after_cascade",
            });
            continue;
        }

        // Score and create new offers
        const scored = rankCandidates(cascade.newCandidates, load);
        const offerPlan = determineOfferStrategy(load, scored);

        // Persist match run
        await supabase.from("match_runs").insert({
            request_id: load.request_id,
            stage: "cascade_fallback",
            candidate_count: cascade.newCandidates.length,
            top_candidates: scored.slice(0, 10).map((c) => ({
                operator_id: c.operator_id,
                score: c.match_score,
                rank: c.rank,
            })),
            explainability: {},
            offer_plan: offerPlan,
            cascade_round: currentRound,
        });

        // Create new offers
        const newOffers = offerPlan.targets.map((operatorId) => ({
            request_id: load.request_id,
            operator_id: operatorId,
            status: "sent",
            cascade_round: currentRound,
            accept_deadline_at: new Date(Date.now() + offerPlan.timeout_seconds * 1000).toISOString(),
        }));

        if (newOffers.length) {
            await supabase.from("offers").insert(newOffers);
        }

        cascadeResults.push({
            request_id: load.request_id,
            action: "cascade_expanded",
            round: currentRound,
            new_offers: newOffers.length,
            radius_km: cascade.newRadius,
        });
    }

    return NextResponse.json({
        ok: true,
        expired_offers: expiredCount ?? 0,
        cascade_actions: cascadeResults,
    });
}
