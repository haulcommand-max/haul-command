export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const state = (searchParams.get("state") ?? "").trim();
    const type = (searchParams.get("type") ?? "").trim();
    const availability = (searchParams.get("availability") ?? "").trim();
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

    let query = getSupabase()
        .from("profiles")
        .select("id,slug,display_name,city,state,type,availability,verified,compliance_score")
        .order("compliance_score", { ascending: false })
        .limit(limit);

    if (state) query = query.eq("state", state);
    if (type) query = query.eq("type", type);
    if (availability) query = query.eq("availability", availability);

    if (q) {
        query = query.or(
            `display_name.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%,slug.ilike.%${q}%`
        );
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ results: data ?? [], total: data?.length ?? 0 });
}
