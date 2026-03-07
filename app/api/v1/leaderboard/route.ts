// app/api/v1/leaderboard/route.ts
//
// GET  /api/v1/leaderboard?user_id=...           — single user score
// GET  /api/v1/leaderboard?corridor=...&limit=20 — corridor leaderboard
// POST /api/v1/leaderboard/recompute             — cron: batch recompute

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";
import { computeLeaderboardForUser, recomputeAllLeaderboard } from "@/lib/leaderboard/leaderboard-scoring";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");
    const corridor = url.searchParams.get("corridor");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 100);

    // Single user
    if (userId) {
        const result = await computeLeaderboardForUser(userId);
        return NextResponse.json({ ok: true, ...result });
    }

    // Corridor / global leaderboard
    const supabase = getSupabaseAdmin();
    let query = supabase
        .from("user_levels")
        .select("user_id,level,total_points,verified_tier_points,responsiveness_points,completion_points,updated_at")
        .order("total_points", { ascending: false })
        .limit(limit);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const entries = (data ?? []) as any[];

    // Enrich with badges + verification tier
    const enriched = [];
    for (const entry of entries) {
        const { data: badges } = await supabase
            .from("user_badges")
            .select("badge_type,badge_label")
            .eq("user_id", entry.user_id)
            .eq("active", true);

        const { data: tier } = await supabase
            .from("user_verification_tiers")
            .select("tier,tier_label")
            .eq("user_id", entry.user_id)
            .maybeSingle();

        enriched.push({
            rank: enriched.length + 1,
            ...entry,
            verification: tier ?? { tier: 0, tier_label: "unverified" },
            badges: badges ?? [],
        });
    }

    return NextResponse.json({
        ok: true,
        corridor: corridor ?? "global",
        count: enriched.length,
        leaderboard: enriched,
    });
}

export async function POST() {
    const result = await recomputeAllLeaderboard();
    return NextResponse.json({ ok: true, ...result });
}
