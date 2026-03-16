// app/api/v1/demand-intelligence/segments/route.ts
//
// GET /api/v1/demand-intelligence/segments
// Returns industry segments, filterable by tier, category, payout, competition.
// Powers marketplace targeting, SEO pages, and operator discovery.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = "nodejs";

export async function GET(req: Request) {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);

    const tier = url.searchParams.get("tier");
    const category = url.searchParams.get("category");
    const payoutLevel = url.searchParams.get("payout_level");
    const competitionLevel = url.searchParams.get("competition_level");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);

    let query = supabase
        .from("industry_segments")
        .select("*")
        .order("tier", { ascending: true })
        .order("payout_level", { ascending: false })
        .limit(limit);

    if (tier) query = query.eq("tier", parseInt(tier));
    if (category) query = query.eq("category", category);
    if (payoutLevel) query = query.eq("payout_level", payoutLevel);
    if (competitionLevel) query = query.eq("competition_level", competitionLevel);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Build summary
    const segments = (data ?? []) as any[];
    const summary = {
        total: segments.length,
        by_tier: {} as Record<string, number>,
        by_category: {} as Record<string, number>,
        by_payout: {} as Record<string, number>,
    };

    for (const s of segments) {
        summary.by_tier[`tier_${s.tier}`] = (summary.by_tier[`tier_${s.tier}`] || 0) + 1;
        summary.by_category[s.category] = (summary.by_category[s.category] || 0) + 1;
        summary.by_payout[s.payout_level] = (summary.by_payout[s.payout_level] || 0) + 1;
    }

    return NextResponse.json({ ok: true, summary, segments });
}
