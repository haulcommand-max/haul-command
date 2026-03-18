// app/api/v1/leaderboard/route.ts
//
// GET  /api/v1/leaderboard?corridor=...&limit=20 — corridor/global leaderboard
//
// Schema truth (verified against live DB):
//   user_levels: DOES NOT EXIST yet
//   leaderboard_entries: EXISTS but EMPTY (columns: id, rank, created_at)
//   profiles: EXISTS with data (id, display_name, home_state, home_city, reliability_score, ...)
//
// Strategy: Try user_levels first → fall back to profiles ranked by scores → return empty if nothing

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = "nodejs";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 100);

    const supabase = getSupabaseAdmin();

    // Strategy 1: Try user_levels (future — will exist once scoring pipeline runs)
    const { data: levelsData, error: levelsErr } = await supabase
        .from("user_levels")
        .select("user_id, level, total_points")
        .order("total_points", { ascending: false })
        .limit(limit);

    if (!levelsErr && levelsData && levelsData.length > 0) {
        // Enrich with profile display names
        const enriched = [];
        for (const entry of levelsData as any[]) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("display_name, home_state, home_city")
                .eq("id", entry.user_id)
                .maybeSingle();

            enriched.push({
                rank: enriched.length + 1,
                user_id: entry.user_id,
                display_name: profile?.display_name || 'Operator',
                primary_state: profile?.home_state || '',
                city: profile?.home_city || '',
                total_points: entry.total_points ?? 0,
                verified: (entry.level ?? 0) >= 2,
            });
        }

        return NextResponse.json({
            ok: true,
            source: 'user_levels',
            count: enriched.length,
            leaderboard: enriched,
        });
    }

    // Strategy 2: Fall back to profiles with real score data
    // Use reliability_score + responsiveness_score + customer_signal_score as composite
    const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("id, display_name, home_state, home_city, reliability_score, responsiveness_score, customer_signal_score, completed_escorts")
        .not("display_name", "is", null)
        .order("reliability_score", { ascending: false, nullsFirst: false })
        .limit(limit);

    if (!profileErr && profileData && profileData.length > 0) {
        const withScores = (profileData as any[])
            .map((p: any) => ({
                ...p,
                composite: (p.reliability_score ?? 0) + (p.responsiveness_score ?? 0) + (p.customer_signal_score ?? 0),
            }))
            .filter((p: any) => p.composite > 0)
            .sort((a: any, b: any) => b.composite - a.composite);

        if (withScores.length > 0) {
            const enriched = withScores.map((p: any, i: number) => ({
                rank: i + 1,
                user_id: p.id,
                display_name: p.display_name || 'Operator',
                primary_state: p.home_state || '',
                city: p.home_city || '',
                total_points: Math.round(p.composite * 100) / 100,
                verified: false,
                completed_escorts: p.completed_escorts ?? 0,
            }));

            return NextResponse.json({
                ok: true,
                source: 'profiles_composite',
                count: enriched.length,
                leaderboard: enriched,
            });
        }
    }

    // Strategy 3: No data at all — return empty truthfully
    return NextResponse.json({
        ok: true,
        source: 'empty',
        count: 0,
        leaderboard: [],
        message: 'Leaderboard data is building. Rankings populate as operators complete verification, respond to jobs, and earn trust points.',
    });
}

export async function POST() {
    // Recompute is a no-op if user_levels doesn't exist yet
    try {
        const { computeLeaderboardForUser, recomputeAllLeaderboard } = await import("@/lib/leaderboard/leaderboard-scoring");
        const result = await recomputeAllLeaderboard();
        return NextResponse.json({ ok: true, ...result });
    } catch (err: unknown) {
        return NextResponse.json({
            ok: false,
            error: 'Leaderboard recompute not available — prerequisite tables not yet deployed',
        }, { status: 503 });
    }
}
