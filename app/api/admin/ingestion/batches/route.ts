/**
 * GET /api/admin/ingestion/batches
 * List ingestion batches with stats.
 * Query: ?limit=50&offset=0
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
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = getSupabaseAdmin();

    const { data, error, count } = await supabase
        .from("hc_ingestion_batches")
        .select("id, source_name, source_type, country_hint, batch_date, ingested_at, total_lines, parsed_lines, partial_lines, unparsed_lines, text_hash", { count: "exact" })
        .order("ingested_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, batches: data, total: count });
}
