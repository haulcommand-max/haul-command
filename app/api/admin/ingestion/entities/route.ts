/**
 * GET /api/admin/ingestion/entities
 * Query market entities with filtering.
 * Query: ?limit=50&type=organization&min_recurrence=0.4&role=broker
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
    const type = searchParams.get("type");
    const minRecurrence = parseFloat(searchParams.get("min_recurrence") || "0");
    const role = searchParams.get("role");
    const claimReady = searchParams.get("claim_ready") === "true";

    const supabase = getSupabaseAdmin();

    let query = supabase
        .from("hc_market_entities")
        .select("*")
        .gte("recurrence_score", minRecurrence)
        .order("observation_count", { ascending: false })
        .limit(limit);

    if (type) {
        query = query.eq("entity_type", type);
    }

    if (role) {
        query = query.contains("primary_roles", [role]);
    }

    if (claimReady) {
        query = query.gte("claim_priority_score", 0.4);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        ok: true,
        entities: data,
        count: data?.length || 0,
    });
}
