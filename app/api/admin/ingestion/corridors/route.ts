/**
 * GET /api/admin/ingestion/corridors
 * Query corridor intelligence.
 * Query: ?limit=50&country=US&min_strength=0.3
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

const ADMIN_SECRET = process.env.HC_ADMIN_SECRET;

export async function GET(req: NextRequest) {
    const auth =
        req.headers.get("x-admin-secret") ||
        req.headers.get("authorization")?.replace("Bearer ", "");
    if (!ADMIN_SECRET || auth !== ADMIN_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const country = searchParams.get("country");
    const minStrength = parseFloat(searchParams.get("min_strength") || "0");

    const supabase = getSupabaseAdmin();

    let query = supabase
        .from("hc_corridor_intelligence")
        .select("*")
        .gte("corridor_strength_score", minStrength)
        .order("observation_count", { ascending: false })
        .limit(limit);

    if (country) {
        query = query.eq("country_code", country.toUpperCase());
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        ok: true,
        corridors: data,
        count: data?.length || 0,
    });
}
