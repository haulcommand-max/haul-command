// app/api/v1/badges/profile/route.ts
//
// GET /api/v1/badges/profile?user_id=...
// Returns all active badges for a profile + structured data hints.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");

    if (!userId) {
        return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    const { data: badges } = await supabase
        .from("user_badges")
        .select("badge_type,badge_label,earned_at,criteria_snapshot")
        .eq("user_id", userId)
        .eq("active", true);

    const activeBadges = (badges ?? []) as any[];

    // Schema.org hints for SEO
    const schemaHints: Record<string, string[]> = {};
    for (const b of activeBadges) {
        if (b.badge_type === "verified_operator") {
            schemaHints[b.badge_type] = ["identifier", "award"];
        } else if (b.badge_type === "elite_verified") {
            schemaHints[b.badge_type] = ["award"];
        } else if (b.badge_type === "fast_responder") {
            schemaHints[b.badge_type] = ["knowsAbout"];
        } else if (b.badge_type === "top_corridor") {
            schemaHints[b.badge_type] = ["award"];
        }
    }

    return NextResponse.json({
        ok: true,
        user_id: userId,
        badges_count: activeBadges.length,
        badges: activeBadges,
        schema_hints: schemaHints,
    });
}
